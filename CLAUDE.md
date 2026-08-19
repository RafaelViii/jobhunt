# CLAUDE.md — JobHunt Project Rules

This file is the source of truth for how JobHunt gets built. It captures every decision made during planning so an AI coding assistant (or a human) doesn't have to re-derive them, guess, or drift from the agreed design. Read this in full before writing any code. If a request conflicts with something here, flag the conflict instead of silently picking one side.

Place this file at the repo root as `CLAUDE.md` (Claude Code and Cowork load it automatically at session start).

---

## 1. What this is

A two-sided job platform demo for a thesis — **not for commercial use**. Two account types: **Applicant** and **Recruiter**, on one shared login. Goal: applicants get a system-generated resume and a ranked list of matching jobs; recruiters post a job and immediately get a ranked list of matching candidates. The matching algorithm is a transparent, weighted rule-based score — deliberately not ML, because it has to be explainable in a thesis defense.

## 2. Explicit non-goals (do not build these unless asked)

- No payments/subscriptions.
- No chat/messaging between recruiter and applicant.
- No ML/embedding-based matching (documented as future work only — see §5.5).
- No multi-resume-per-applicant management — one canonical auto-built resume per applicant.
- No Cloud Functions (see §3 — this is a hard constraint, not an oversight).

## 3. Tech stack — hard constraints

- **Frontend + server logic:** Next.js, App Router, deployed on **Vercel** (Hobby tier).
- **Auth:** Firebase Authentication (email/password + Google sign-in). Email/password signups must verify their email before `users/{uid}` and the role claim are created — enforced server-side in `/api/auth/register` via the ID token's `email_verified` claim, not just in the UI. Google sign-in is exempt (already provider-verified). Verification uses Firebase's own built-in `sendEmailVerification` link — works for *any* email address immediately, no third-party service or domain needed. (A custom 6-digit-code-by-email variant was tried and reverted 2026-08-19: Resend's free tier can only deliver to the sender's own verified email without a verified sending domain, and Firebase's Admin API refuses template-content edits — `EMAIL_TEMPLATE_UPDATE_NOT_ALLOWED` — so cosmetic branding of the verification email has to be done by hand in the Firebase console, Authentication → Templates.) `SignupForm`'s client polls for `emailVerified` every few seconds after sending the link, so the page continues on its own once clicked — no "I've verified, continue" button needed. Signup also detects and resumes a stranded unverified account left over from an abandoned prior attempt (`auth/email-already-in-use`) rather than permanently blocking that email.
- **Database:** Firestore, **Spark (free) plan**.
- **Storage:** **Supabase Storage** (free tier) — resume PDFs, profile photos, company logos. *(Changed from Firebase Storage on 2026-08-18: as of late 2024 Google requires the Blaze plan and a card on file to create a Firebase Storage bucket at all, even at $0 usage. The user is not willing to attach billing. Supabase Storage's free tier needs no card and is a drop-in bucket/path model, so only file storage moves off Firebase — Auth and Firestore are unaffected.)*
- **Server-privileged writes:** Next.js Server Actions / Route Handlers using the **Firebase Admin SDK** (Firestore/Auth) and the **Supabase service-role key** (Storage).

**DO NOT use Firebase Cloud Functions (2nd gen) for anything.** They require the Blaze billing plan even at near-zero usage. Every place you'd instinctively reach for a Firestore trigger (`onCreate`, `onWrite`) must instead be explicit application code called from the relevant Server Action — see §7 for exactly where.

**DO NOT compute match scores at dashboard render time.** Scores are precomputed and written to the `matches` collection when a profile or job is saved. Dashboards only ever run a `where` + `orderBy` query against `matches`. If you find yourself scoring inside a page/component, stop — that logic belongs in the shared recompute function (§7).

**DO NOT give a Supabase anon/public key access to private buckets.** All resume/photo/logo uploads, and any signed-URL generation for reads, happen server-side via the Supabase **service-role key** in a Route Handler — never from a client SDK directly. This mirrors the server-write-only rule for the `matches` collection (§8).

## 4. Data model (Firestore)

| Collection | Doc ID | Key fields |
|---|---|---|
| `users` | `{uid}` | `role` ('applicant'\|'recruiter'), `email`, `displayName`, `createdAt` |
| `applicantProfiles` | `{uid}` | `basicInfo{name,location,phone,photoUrl}`, `experience[]`, `education[]`, `skills[]`, `preferences{titles[],locations[],salaryMin,salaryMax,employmentTypes[],seniority}`, `resumeUrl`, `onboardingComplete: boolean` |
| `companies` | `{companyId}` | `name`, `logoUrl`, `website`, `industry`, `size`, `recruiterUids[]` |
| `jobs` | `{jobId}` | `companyId`, `title`, `description`, `skills[]`, `location`, `remote`, `salaryMin`, `salaryMax`, `employmentType`, `seniority`, `status` ('open'\|'closed'), `postedAt`, `postedBy` |
| `applications` | `{applicationId}` | `jobId`, `applicantUid`, `companyId`, `resumeUrl` (snapshot at apply time), `status`, `appliedAt`, `statusHistory[]` |
| `matches` | `{applicantUid}_{jobId}` | `applicantUid`, `jobId`, `companyId`, `score`, `breakdown{title,skills,location,salary,type,seniority}`, `computedAt` |

Note the `companyId` denormalized onto `matches` — it's needed so Firestore security rules can scope a recruiter's read access without an extra lookup (see §8).

Required composite indexes: `jobs(status, postedAt desc)`, `matches(applicantUid, score desc)`, `matches(jobId, score desc)`, `applications(applicantUid, status)`.

## 5. Matching algorithm — implement exactly as specified

```
score = 100 × (0.25·title + 0.30·skills + 0.15·location + 0.10·salary + 0.10·type + 0.10·seniority)
```

| Factor | Weight | Scoring rule (0–1) |
|---|---|---|
| Title / role | 0.25 | Exact normalized match = 1.0; synonym-map match = 0.7; no match = 0 |
| Skills overlap | 0.30 | `matched_skills / min(len(applicant_skills), len(job_required_skills))` |
| Location | 0.15 | Same city = 1.0; same region or either side remote-ok = 0.6; else 0 |
| Salary range | 0.10 | 1.0 if ranges fully overlap; proportional partial credit; 0 if disjoint |
| Employment type | 0.10 | Exact match = 1.0 else 0 |
| Seniority | 0.10 | Exact = 1.0; one level off = 0.5; two+ off = 0 |

### 5.1 Synonym map
Store title synonyms as a JSON file in the repo (e.g. `/lib/matching/title-synonyms.json`), not a database collection — it's static reference data, not user data. Keep it small and curated (10–20 common title groups is enough for demo data).

*(Deviation, 2026-08-19: expanded to 67 groups — the original 32 hand-curated groups plus 35 categories generated from a comprehensive predefined title list covering common Philippines remote/BPO job titles, stored source-of-truth as `/lib/matching/experience-titles.json` (category → title array) and flattened for UI autocomplete via `/lib/matching/experienceTitles.ts`. Still a static JSON lookup with no Firestore involvement, so the architecture is unchanged — only the size. Driven directly by user request: applicants and recruiters both get a free-text input with a type-ahead suggestion dropdown sourced from this list — `TitleCombobox` for single-value fields (experience entry title, job posting title), and `TagInput`'s new optional `suggestions` prop for the multi-value "Desired titles" preference field — so that picking a standardized title from the list (rather than typing an idiosyncratic one) reliably lands an exact or synonym-group title match. Custom free text is always still allowed on every field; nothing is a locked `<select>`.)*

### 5.2 Where the scoring function lives
One pure function, e.g. `computeMatchScore(applicantProfile, job): { score, breakdown }` in `/lib/matching/score.ts`. No side effects, no Firestore calls inside it — just math, so it's trivially unit-testable. All recompute call sites (§7) call this function and then write the result.

### 5.3 Known limitation (have the answer ready, don't try to fix it now)
Recomputing against *all* jobs or *all* applicants on every edit is O(N×M). Fine at demo scale (10–20 seeded records). If asked about scale: pre-filter candidates on indexed fields (location/title) before scoring, or move to a queued batch recompute. Do not build this now — it's out of scope.

### 5.4 Future upgrade (do not implement — mention only if asked)
Blending in text-embedding cosine similarity between job description and resume summary is documented as a deliberate future-work item, not a gap.

## 6. Resume generation — rules

- Trigger: automatically, right after the 5-step applicant onboarding wizard completes, and again whenever the applicant explicitly saves a profile edit.
- **Do not** regenerate on every keystroke/field change — trigger on step-submit / explicit save only, to avoid redundant PDF renders and Storage writes.
- Library: `@react-pdf/renderer`, rendered inside a Vercel Route Handler (works in serverless without a headless browser — do not reach for Puppeteer here).
- Output: upload PDF to the Supabase `resumes` bucket (private), save the resulting storage path to `applicantProfiles/{uid}.resumeUrl`. This is a path, not a public URL — it only resolves to a downloadable link via the signed-URL Route Handler described in §8, after that handler checks the caller is the owning applicant or a recruiter with a qualifying relationship.
- Applications snapshot the resume URL at apply time into `applications/{id}.resumeUrl` — so a later profile edit doesn't retroactively change what a recruiter already reviewed.
- **Do not let PDF generation block other work.** If `@react-pdf/renderer` output is being finicky mid-build, stub `resumeUrl` with a placeholder so the dashboard/apply flow (§7 Phase 3–4) isn't stalled waiting on pixel-perfect PDF rendering.

## 7. Where match recompute is triggered (centralize this — do not duplicate)

Write two shared functions and call them from every mutation path below. Do not re-implement scoring inline at any of these call sites.

- `recomputeMatchesForApplicant(uid)` — scores this applicant against all open jobs, upserts `matches` docs.
- `recomputeMatchesForJob(jobId)` — scores this job against all applicant profiles, upserts `matches` docs.

Call sites (all four must call one of the above — this is the most common place mistakes creep in):
1. Applicant onboarding wizard completes → `recomputeMatchesForApplicant`
2. Applicant edits profile/preferences → `recomputeMatchesForApplicant`
3. Recruiter creates a job → `recomputeMatchesForJob`
4. Recruiter edits a job (title/skills/location/salary/type/seniority change) → `recomputeMatchesForJob`

If you add a new field that affects scoring, grep for both function names before deciding it's "handled" — a missed call site produces stale scores with no visible error, which is the failure mode to design against.

## 8. Security rules — required, not optional

### Firestore
- Applicants: read/write only their own `applicantProfiles/{uid}` and their own `applications` (where `applicantUid == request.auth.uid`).
- Recruiters: read/write only `jobs` where `companyId` is in their linked company; read `applications` scoped to their own company's `jobId`s.
- `matches`: **server-write-only** (writes only via Admin SDK from a trusted Route Handler — client SDK writes must be rejected). Client reads are scoped: applicants can read where `applicantUid == request.auth.uid`; recruiters can read where `companyId` matches their linked company (this is why `companyId` is denormalized onto `matches` — see §4).
- **Recruiters need read access to applicant data outside their own account** — specifically, the resume/profile of any applicant who applied to or matched with one of their jobs. This is the trickiest rule to write correctly: it requires a `get()` on the related `application` (or `matches`) doc inside the rule to verify the relationship, not a flat "owner only" rule. Do not skip this — and do not over-grant (recruiters should not be able to read arbitrary applicant profiles they have no relationship to).

### Storage (Supabase, not Firebase — see §3)
Two buckets:
- `resumes` (private, no public access). Reads happen only through short-lived signed URLs minted server-side by a Route Handler using the Supabase service-role key, after that handler checks the same relationship rule as Firestore's `matches`/`applications`: the owning applicant, or a recruiter with a qualifying application/match to that applicant. Uploads are server-side only (service-role key) — never a direct client upload, and never a bucket-level public-read policy.
- `public-assets` (profile photos, company logos): public read is fine (not sensitive). Uploads still go through a server-side Route Handler with a basic owner check, rather than direct client writes, to avoid an open write policy.

## 9. Route / page structure

```
/                          redirects — signed in -> role dashboard, signed out -> /login (no standalone landing page, changed 2026-08-18)
/login
/signup/applicant
/signup/recruiter
/applicant/onboarding      5-step wizard
/applicant/dashboard       matched jobs, sorted by %, with breakdown chips
/applicant/jobs/[jobId]
/applicant/applications
/applicant/profile         edit -> regenerates resume
/recruiter/onboarding      company profile
/recruiter/dashboard       posted jobs + candidate previews
/recruiter/jobs/new
/recruiter/jobs/[jobId]/edit
/recruiter/jobs/[jobId]/candidates   ranked applicant list
```

Role-based redirect after login: read `users/{uid}.role` in Next.js middleware, send to `/applicant/dashboard` or `/recruiter/dashboard`.

## 10. Build order — follow this sequence

**Phase 1 — Skeleton:** Firebase Auth wiring, role-based routing/middleware, applicant onboarding wizard (forms only, no PDF/matching yet), recruiter job posting form (saves to `jobs`, no matching yet).

**Phase 1.5 — Seed data (do this now, not at the end):** Write a Node seed script using the Firebase Admin SDK (never exposed client-side) that creates 3–5 dummy companies/recruiters, 10–15 dummy jobs with varied fields, 15–20 dummy applicants with varied preferences/skills. Run it against a test Firebase project. Every phase after this should be developed and eyeballed against this seeded data, not an empty database — the goal is to see a realistic score spread (not everything clustered at 0% or 100%) as early as possible.

**Phase 2 — Resume + Matching:** `computeMatchScore` function (§5.2), the two shared recompute functions (§7) wired into all four call sites, resume PDF generation (§6, stub if needed so this doesn't block Phase 3).

**Phase 3 — Dashboards:** Applicant dashboard (query `matches`, show % + breakdown chips), recruiter dashboard (query `matches` per job, candidate list with resume preview).

**Phase 4 — Applications + status:** One-click apply (snapshots resume, creates `applications` doc), recruiter status pipeline (shortlist/interview/offer/reject), applicant "My Applications" tracker reflecting status changes.

**Phase 5 — Polish:** Firestore + Storage security rules (§8), composite indexes (§4), final pass on seeded data variety, defense/demo dry run.

## 11. Common mistakes to avoid (checked against this plan)

- Reaching for a Cloud Functions trigger instead of an explicit Server Action call — not allowed, see §3.
- Computing match scores inline in a dashboard component instead of reading precomputed `matches` — not allowed, see §3.
- Implementing scoring logic more than once instead of calling the shared `computeMatchScore` — see §5.2/§7.
- Forgetting one of the four recompute call sites, especially "recruiter edits an existing job" — see §7.
- Regenerating the resume PDF on every keystroke instead of on save — see §6.
- Writing a Firestore rule that's either "recruiter can read nothing outside their own data" (breaks candidate review) or "recruiter can read any applicant profile" (privacy hole) instead of the relationship-scoped rule — see §8.
- Leaving dummy data creation to the last phase instead of seeding early — see §10, Phase 1.5.
- Building multi-resume support, chat, payments, or embedding-based matching — out of scope, see §2.

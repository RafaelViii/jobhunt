# CLAUDE.md — JobHunt Project Rules

This file is the source of truth for how JobHunt gets built. It captures every decision made during planning so an AI coding assistant (or a human) doesn't have to re-derive them, guess, or drift from the agreed design. Read this in full before writing any code. If a request conflicts with something here, flag the conflict instead of silently picking one side.

Place this file at the repo root as `CLAUDE.md` (Claude Code and Cowork load it automatically at session start).

---

## 1. What this is

A two-sided job platform demo for a thesis — **not for commercial use**. Two account types: **Applicant** and **Recruiter**, on one shared login. Goal: applicants get a system-generated resume and a ranked list of matching jobs; recruiters post a job and immediately get a ranked list of matching candidates. The matching algorithm is a transparent, weighted rule-based score — deliberately not ML, because it has to be explainable in a thesis defense.

The platform's scope grew beyond pure matching during development to include a trust/verification dimension on both sides: applicants can see their email-verification status reflected back to them, and recruiters must pass a (simulated) business-verification check before posting — see §11 and §13.

## 2. Explicit non-goals (do not build these unless asked)

- No payments/subscriptions.
- No chat/messaging between recruiter and applicant.
- No ML/embedding-based matching (documented as future work only — see §5.4).
- No multi-resume-per-applicant management — one canonical auto-built resume per applicant.
- No Cloud Functions (see §3 — this is a hard constraint, not an oversight).
- No real business/ID verification integration — §11's recruiter verification gate is a simulated placeholder by explicit design, not a gap to eventually fill in during this thesis project.

## 3. Tech stack — hard constraints

- **Frontend + server logic:** Next.js, App Router, deployed on **Vercel** (Hobby tier).
- **Auth:** Firebase Authentication (email/password + Google sign-in). Email/password signups must verify their email before `users/{uid}` and the role claim are created — enforced server-side in `/api/auth/register` via the ID token's `email_verified` claim, not just in the UI. Google sign-in is exempt (already provider-verified). Verification uses Firebase's own built-in `sendEmailVerification` link — works for *any* email address immediately, no third-party service or domain needed. (A custom 6-digit-code-by-email variant was tried and reverted 2026-08-19: Resend's free tier can only deliver to the sender's own verified email without a verified sending domain, and Firebase's Admin API refuses template-content edits — `EMAIL_TEMPLATE_UPDATE_NOT_ALLOWED` — so cosmetic branding of the verification email has to be done by hand in the Firebase console, Authentication → Templates.) `SignupForm`'s client polls for `emailVerified` every few seconds after sending the link, so the page continues on its own once clicked — no "I've verified, continue" button needed. Signup also detects and resumes a stranded unverified account left over from an abandoned prior attempt (`auth/email-already-in-use`) rather than permanently blocking that email.
- **Database:** Firestore, **Spark (free) plan**.
- **Storage:** **Supabase Storage** (free tier) — resume PDFs, profile photos, company logos, recruiter verification documents. *(Changed from Firebase Storage on 2026-08-18: as of late 2024 Google requires the Blaze plan and a card on file to create a Firebase Storage bucket at all, even at $0 usage. The user is not willing to attach billing. Supabase Storage's free tier needs no card and is a drop-in bucket/path model, so only file storage moves off Firebase — Auth and Firestore are unaffected.)*
- **Server-privileged writes:** Next.js Server Actions / Route Handlers using the **Firebase Admin SDK** (Firestore/Auth) and the **Supabase service-role key** (Storage).

**DO NOT use Firebase Cloud Functions (2nd gen) for anything.** They require the Blaze billing plan even at near-zero usage. Every place you'd instinctively reach for a Firestore trigger (`onCreate`, `onWrite`) must instead be explicit application code called from the relevant Server Action — see §7 for exactly where.

**DO NOT compute match scores at dashboard render time.** Scores are precomputed and written to the `matches` collection when a profile or job is saved. Dashboards only ever run a `where` + `orderBy` query against `matches`. If you find yourself scoring inside a page/component, stop — that logic belongs in the shared recompute function (§7).

**DO NOT give a Supabase anon/public key access to private buckets.** All resume/photo/logo/verification-document uploads, and any signed-URL generation for reads, happen server-side via the Supabase **service-role key** in a Route Handler — never from a client SDK directly. This mirrors the server-write-only rule for the `matches` collection (§8).

## 4. Data model (Firestore)

| Collection | Doc ID | Key fields |
|---|---|---|
| `users` | `{uid}` | `role` ('applicant'\|'recruiter'), `email`, `displayName`, `createdAt` |
| `applicantProfiles` | `{uid}` | `basicInfo{name,location,address,phone,photoUrl,about}`, `experience[]`, `education[]`, `skills[]`, `preferences{titles[],locations[],salaryMin,salaryMax,employmentTypes[],seniority}`, `resumeUrl`, `onboardingComplete: boolean` |
| `companies` | `{companyId}` | `name`, `logoUrl`, `website`, `industry`, `size`, `recruiterUids[]`, `verification{status,documentType,documentPath,submittedAt,verifiedAt}` (§11) |
| `jobs` | `{jobId}` | `companyId`, `title`, `description`, `bannerUrl`, `skills[]`, `location`, `remote`, `salaryMin`, `salaryMax`, `employmentType`, `seniority`, `status` ('open'\|'closed'), `postedAt`, `postedBy` |
| `applications` | `{applicationId}` | `jobId`, `applicantUid`, `companyId`, `resumeUrl` (snapshot at apply time), `status` ('submitted'\|'shortlisted'\|'interview'\|'rejected'), `appliedAt`, `statusHistory[]` |
| `matches` | `{applicantUid}_{jobId}` | `applicantUid`, `jobId`, `companyId`, `score`, `breakdown{title,skills,location,salary,type,seniority}`, `computedAt` |

Note the `companyId` denormalized onto `matches` — it's needed so Firestore security rules can scope a recruiter's read access without an extra lookup (see §8).

Required composite indexes: `jobs(status, postedAt desc)`, `matches(applicantUid, score desc)`, `matches(jobId, score desc)`, `applications(applicantUid, status)`.

*(Deviation, 2026-08-19: several fields were added after the original schema was built out.* `applicantProfiles.basicInfo` *gained* `address` *(a free-text resume-display detail, deliberately separate from* `location`*, which still drives the location match factor in §5) and* `about` *(a short professional summary, rendered as the resume's "About Me" section — §6). Applicant email is deliberately **not** stored on the profile at all — it's pulled live from the Firebase Auth session (or, in the batch seed script, from* `users/{uid}.email`*) every time a resume is generated, per an explicit "automatically get from my email" request rather than a manually-entered/duplicated field.* `jobs` *gained* `bannerUrl` *(a recruiter-uploaded banner image; falls back to a deterministic gradient+icon when null — §12).* `companies` *gained* `verification` *(§11).* `applications.status` *dropped the "offer" option — the pipeline is now submitted → shortlisted → interview → rejected only, per explicit request; see §13.)*

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

*(Deviation, 2026-08-19: expanded to 67 groups — the original 32 hand-curated groups plus 35 categories generated from a comprehensive predefined title list covering common Philippines remote/BPO job titles, stored source-of-truth as `/lib/matching/experience-titles.json` (category → title array, 814 unique titles) and flattened for UI autocomplete via `/lib/matching/experienceTitles.ts`. Still a static JSON lookup with no Firestore involvement, so the architecture is unchanged — only the size. Driven directly by user request: applicants and recruiters both get a free-text input with a type-ahead suggestion dropdown sourced from this list — `TitleCombobox` (§12) for single-value fields (experience entry title, job posting title), and `TagInput`'s new optional `suggestions` prop for the multi-value "Desired titles" preference field — so that picking a standardized title from the list (rather than typing an idiosyncratic one) reliably lands an exact or synonym-group title match. Custom free text is always still allowed on every field; nothing is a locked `<select>`. The same 35-category taxonomy also drives `lib/matching/jobSkillPresets.ts`: when a recruiter picks a predefined title while posting a job, "Required skills" auto-fills with that category's preset skill list — merged with, not replacing, anything already typed, and freely editable afterward.)*

### 5.2 Where the scoring function lives
One pure function, e.g. `computeMatchScore(applicantProfile, job): { score, breakdown }` in `/lib/matching/score.ts`. No side effects, no Firestore calls inside it — just math, so it's trivially unit-testable. All recompute call sites (§7) call this function and then write the result.

### 5.3 Known limitation (have the answer ready, don't try to fix it now)
Recomputing against *all* jobs or *all* applicants on every edit is O(N×M). Fine at demo scale. If asked about scale: pre-filter candidates on indexed fields (location/title) before scoring, or move to a queued batch recompute. Do not build this now — it's out of scope.

### 5.4 Future upgrade (do not implement — mention only if asked)
Blending in text-embedding cosine similarity between job description and resume summary is documented as a deliberate future-work item, not a gap.

## 6. Resume generation — rules

- Trigger: automatically, right after the 5-step applicant onboarding wizard completes, and again whenever the applicant explicitly saves a profile edit.
- **Do not** regenerate on every keystroke/field change — trigger on step-submit / explicit save only, to avoid redundant PDF renders and Storage writes.
- Library: `@react-pdf/renderer`, rendered inside a Vercel Route Handler (works in serverless without a headless browser — do not reach for Puppeteer here).
- Output: upload PDF to the Supabase `resumes` bucket (private), save the resulting storage path to `applicantProfiles/{uid}.resumeUrl`. This is a path, not a public URL — it only resolves to a downloadable link via the signed-URL Route Handler described in §8, after that handler checks the caller is the owning applicant or a recruiter with a qualifying relationship.
- Applications snapshot the resume URL at apply time into `applications/{id}.resumeUrl` — so a later profile edit doesn't retroactively change what a recruiter already reviewed.
- **Do not let PDF generation block other work.** If `@react-pdf/renderer` output is being finicky mid-build, stub `resumeUrl` with a placeholder so the dashboard/apply flow (§7 Phase 3–4) isn't stalled waiting on pixel-perfect PDF rendering.

*(Redesigned 2026-08-19 to match a professional reference template, per explicit request. `ResumeDocument` (`lib/resume/ResumeDocument.tsx`) now renders: a centered bold name, a headline line (the applicant's first "desired title" preference, falling back to their most recent experience entry's title, omitted if neither exists), a contact row (phone, email, address), an "About Me" section (from `basicInfo.about`, omitted if blank), section-divider rules, Education/Work Experience entries in a consistent muted-meta-line-then-bold-title layout, skills laid out in a 3-column grid instead of one wrapped row, and a plain footer bar. `generateAndStoreResume(uid, profile, email)` gained the `email` parameter, since email is never stored on the profile itself (§4) — every call site (onboarding action, profile-edit action, the manual-regenerate API route, the batch seed script) now supplies it from wherever it's actually available in that context. The applicant profile-edit page also surfaces a "Preview resume" link in the sidebar — a signed URL with a 15-minute expiry (longer than `getSignedResumeUrl`'s 5-minute default, since this link sits on a form the applicant may spend a while editing before clicking it), with a fallback note when no resume has been generated yet.)*

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
Three buckets:
- `resumes` (private, no public access). Reads happen only through short-lived signed URLs minted server-side by a Route Handler using the Supabase service-role key, after that handler checks the same relationship rule as Firestore's `matches`/`applications`: the owning applicant, or a recruiter with a qualifying application/match to that applicant. Uploads are server-side only (service-role key) — never a direct client upload, and never a bucket-level public-read policy.
- `public-assets` (profile photos, company logos): public read is fine (not sensitive). Uploads still go through a server-side Route Handler with a basic owner check, rather than direct client writes, to avoid an open write policy.
- `verification-docs` (added 2026-08-19, see §11) — private, same posture as `resumes`: business permits and government IDs are never public-read. No signed-URL read path exists yet since nothing in the current UI displays an uploaded document back (the verification is simulated and always succeeds); add one the same way `getSignedResumeUrl` works if a review UI is ever built.

## 9. Route / page structure

```
/                          redirects — signed in -> role dashboard, signed out -> /login (no standalone landing page, changed 2026-08-18)
/login
/signup/applicant
/signup/recruiter
/applicant/onboarding      5-step wizard
/applicant/dashboard       matched jobs, sorted by %, with search/filter (§12) and breakdown chips
/applicant/jobs/[jobId]
/applicant/applications
/applicant/profile         edit -> regenerates resume; includes a "Preview resume" link (§6)
/recruiter/onboarding      company profile
/recruiter/dashboard       posted jobs + applicant counts (§13) + verification-status banner (§11)
/recruiter/verify          business permit/ID upload — see §11; gates /recruiter/jobs/new
/recruiter/jobs/new        two-column layout with a live preview panel — see §12
/recruiter/jobs/[jobId]/edit
/recruiter/jobs/[jobId]/candidates   applicants only, not all matches — see §13
```

Role-based redirect after login: read `users/{uid}.role` in Next.js middleware (`proxy.ts` — Next.js 16 renamed `middleware.ts`), send to `/applicant/dashboard` or `/recruiter/dashboard`.

## 10. Build order — follow this sequence

**Phase 1 — Skeleton:** Firebase Auth wiring, role-based routing/middleware, applicant onboarding wizard (forms only, no PDF/matching yet), recruiter job posting form (saves to `jobs`, no matching yet).

**Phase 1.5 — Seed data (do this now, not at the end):** Write a Node seed script using the Firebase Admin SDK (never exposed client-side) that creates dummy companies/recruiters, dummy jobs with varied fields, dummy applicants with varied preferences/skills. Run it against a test Firebase project. Every phase after this should be developed and eyeballed against this seeded data, not an empty database — the goal is to see a realistic score spread (not everything clustered at 0% or 100%) as early as possible.

*(Deviation, 2026-08-19: expanded well past the original 3–5 companies/10–15 jobs/15–20 applicants guideline — the seed data initially skewed entirely toward software-engineering titles, so 7 new companies and 19 new jobs covering common Philippines remote/BPO categories (VA/admin, customer service, sales, creative, marketing, e-commerce ops, finance, education, and more — see §5.1) were added, along with matching new applicants. Current scale: 12 companies, 32 jobs, 28 seeded applicants. Still small enough to eyeball, and the wider category spread is what makes §5.1's expanded synonym map and §12's job-category icons meaningfully testable.)*

**Phase 2 — Resume + Matching:** `computeMatchScore` function (§5.2), the two shared recompute functions (§7) wired into all four call sites, resume PDF generation (§6, stub if needed so this doesn't block Phase 3).

**Phase 3 — Dashboards:** Applicant dashboard (query `matches`, show % + breakdown chips), recruiter dashboard (query `matches` per job, candidate list with resume preview).

**Phase 4 — Applications + status:** One-click apply (snapshots resume, creates `applications` doc), recruiter status pipeline (submitted → shortlisted → interview → rejected — see §13's note on "offer" being dropped), applicant "My Applications" tracker reflecting status changes.

**Phase 5 — Polish:** Firestore + Storage security rules (§8), composite indexes (§4), final pass on seeded data variety, defense/demo dry run.

## 11. Recruiter verification gate (added 2026-08-19 — not in the original plan)

Recruiters must submit a business permit or a government-issued ID before they can post a job — the platform is meant to be trustworthy on both sides (applicants trusting who's hiring, recruiters trusting who's applying), and an unverified recruiter posting jobs undermines that. Explicit user requirement: *"if the recruiter account doesn't upload any documents it should not allow to post job."*

**This is not a real verification integration.** A real business-permit/government-ID verification API is a serious, paid, KYB/KYC-grade integration — entirely out of scope for a thesis demo (see §2). Instead, the flow *simulates* what that gate would feel like, and says so explicitly in its own UI ("Demo mode…") rather than implying a real check happened:

- `CompanyDoc.verification: { status: "unverified" | "verified", documentType: "business_permit" | "government_id" | null, documentPath, submittedAt, verifiedAt }` (`lib/types.ts`). New companies start `"unverified"` (set in `createCompany`, `app/recruiter/onboarding/actions.ts`).
- Gate placement: **not** part of onboarding — a recruiter reaches their dashboard immediately after creating a company. The gate triggers the first time they try to post a job. `/recruiter/jobs/new` (both the page and the `createJob` Server Action — defense in depth, same reasoning as `recruiterOwnsJob` elsewhere) redirect to `/recruiter/verify` if `company.verification?.status !== "verified"`. Everything else on the dashboard (editing company info, viewing existing jobs/applicants) stays open. The dashboard also shows a "Verify now" banner while unverified, so the redirect isn't a surprise.
- `/recruiter/verify` (`components/verification/VerificationForm.tsx`): recruiter picks a document type, uploads a file, submits. **Always succeeds** — there is no real check, no chance of rejection. The client plays a scripted "Processing… → Verifying documents… → Confirming… → Verified" sequence over a few seconds before redirecting to `/recruiter/jobs/new` — purely cosmetic pacing, not tied to any real async check. The Verified screen includes a "Demo mode" note naming plausible real integration targets (DTI Business Name Registration System for permits, PhilSys National ID Verification Service for IDs) so it reads as an intentional placeholder for a specific real integration, not an unfinished feature.
- The upload goes to a private Supabase bucket, `verification-docs` (`VERIFICATION_DOCS_BUCKET` in `lib/supabase/admin.ts`, created via the Storage REST API since the bucket didn't exist yet) — private for the same reason `resumes` is: a business permit or a government ID is exactly the kind of document that should never be public-read, thesis demo or not. Verified directly during development: the uploaded object is unreachable via Supabase's public object URL pattern (`/storage/v1/object/public/...` 404s — the bucket isn't registered as public at all). The upload route (`app/api/uploads/verification-doc/route.ts`) is separate from the existing `public-asset` route because that one only ever serves the public bucket.
- **Every existing company in the seed data and in production Firestore as of 2026-08-19 was migrated to `verified`** (a company that already has jobs posted obviously predates this gate — leaving it `"unverified"` would incorrectly lock out an already-established seeded/real account; the migration checked each company for existing jobs and set status accordingly). New companies going forward start `"unverified"` as normal. All `company.verification` reads use optional chaining (`company.verification?.status`) rather than assuming the field exists, since Firestore won't retroactively enforce the TypeScript type on documents written before this field existed — a company doc from before this feature has no `verification` field at all until touched.
- A verified badge is shown to applicants wherever a company appears — see §13.

## 12. UI/UX design system (built incrementally, not in the original plan)

The original plan didn't specify a visual design system — early phases used unstyled/minimal forms. A full design pass was added once Phases 1–4 were functionally complete, driven directly by user feedback ("make it a proper website... like a LinkedIn copy"), then iterated on repeatedly (mobile responsiveness, whitespace, imagery, navigation) through the rest of development.

- **Theme**: Tailwind CSS v4 `@theme` tokens, a single light palette (`app/globals.css`) — `--color-page`, `--color-surface`, `--color-line`, `--color-ink`, `--color-muted`, `--color-brand`, `--color-brand-dark`, `--color-brand-soft`, `--color-danger`. Deliberately does not follow `prefers-color-scheme` — an earlier dark-mode-aware version produced low-contrast borders/chips that were reported as hard to read, so it's one well-tuned palette rather than two half-tuned ones.
- **Component library** (`components/ui/`): `Input`, `Textarea`, `Select`, `Button`, `Label`, `Card`, `Chip` (tone: neutral/brand/success/danger), `EmptyState`, `TitleCombobox` (a single-value free-text input with a type-ahead suggestion dropdown, backed by §5.1's title list — always still accepts custom text, never a locked `<select>`), `BackButton`, a shared icon set (`icons.tsx`).
- **Navigation** (`components/nav/`): `AppNav` — a sticky header with the JobHunt wordmark, role-specific nav links, and an avatar dropdown scoped to account actions only (Edit profile / Sign out). Nav links render as icon+label on desktop and icon-only next to the logo on mobile, always inline in the header. *(An earlier version hid the nav links behind the avatar dropdown below the `md` breakpoint — reported as a real usability bug, "i need to click the dropdown first just to go to the dashboard," and reverted so Dashboard/Applications/Post-a-job are always one tap away.)* `Avatar` falls back to initials on a per-entity deterministic color (`lib/utils/entityColor.ts`, hashed from the display name) rather than one flat color for everyone — every seeded person/company previously rendered with the identical pale-blue circle, reported as making the site "feel like it's full of untrusted bots." `SidebarCard` is the reusable profile/company summary card used across dashboards, job detail, and the candidates page (photo, meta stats, an "Experience" sub-list capped at 3 entries with a "+N more" note, action links that can be internal or `external` (new-tab, e.g. the resume preview link), and an optional verified badge — §13).
- **Job banners**: `CategoryBanner` (`components/matches/CategoryBanner.tsx`) renders a deterministic two-tone gradient (`lib/utils/bannerGradient.ts`, hashed from the job id) with a category watermark icon chosen from the job's own title/skills (`lib/utils/jobCategory.ts`), or a recruiter-uploaded `job.bannerUrl` image when one exists (§4, uploaded via `ImageUploadField`'s new `"banner"` preview shape). *(This replaced an earlier version that used Lorem Picsum random stock photos keyed by the job id — reverted after a real screenshot showed an unrelated animal photo on a healthcare job listing. Picsum has no concept of job content, so any job could land on an equally wrong image; the gradient+icon approach can never mismatch, since the icon is derived from the job's own data, not fetched from anywhere. Login/signup hero panels still use fixed-seed Picsum photos — decorative only, not tied to any job's content, so the mismatch risk doesn't apply there.)*
- **Photo/logo/banner uploads**: `ImageUploadField` shows a photo holder — the uploaded image, or a default placeholder icon (a person silhouette for profile photos, a briefcase for company logos, a camera for banners) — with a small camera-badge button on the holder itself that triggers the file picker, rather than relying on the native file input's own UI. Positioned at the top of the Basic Info form, above the text fields.
- **Responsive layout pattern**: most content pages use a two-column `[sidebar + main]` layout (`hidden lg:block` sidebar, `sticky top-20`) to use full desktop width — added after repeated feedback about excessive whitespace on narrow single-column pages (this includes the job posting form, which also gained a live preview panel showing exactly how the posting will render once saved). On mobile, pages that need a persistent primary action (e.g. Apply) use a `fixed inset-x-0 bottom-0 lg:hidden` action bar with matching `pb-24 lg:pb-0` on the scrollable content so nothing sits underneath it unreachable. A generic floating "Back" button was tried and then removed entirely after user feedback that it was redundant with native browser/OS back navigation on both mobile and desktop.
- **Match breakdown** (`components/matches/MatchBreakdown.tsx`, `ScoreRing.tsx`, `tierColor.ts`): a shared tier-color function (gray/orange/blue/green by score band) colors both the score ring and each breakdown factor's bar. The breakdown bar's track needs an explicit border (`border-line`) — its background color alone was nearly invisible against the white card, which made 0%/low bars read as blank whitespace rather than "0% match."
- **Applicant dashboard search** (`components/matches/JobSearchFilters.tsx`): client-side search/filter (title/skill text with a suggestion dropdown, location, employment type, salary range) over the already-loaded `matches` — no server round trip per keystroke or filter change, appropriate at demo scale.

## 13. Applicant-facing trust signals & recruiter candidate view

- The recruiter's candidate list (`/recruiter/jobs/[jobId]/candidates`) shows only applicants who actually applied, not every algorithmic match — an earlier version listed every match regardless of application status with a "Not applied yet" note, reported as confusing ("i must only see the person who applied not all the available person"). `getApplicationCountForJob` (`lib/applications/queries.ts`) replaced the match-count-based `getCandidateCountForJob` (removed as dead code) everywhere a count is shown, so the recruiter dashboard's numbers match what the detail page actually displays when clicked through. A status filter (All/Submitted/Shortlisted/Interview/Rejected, with counts) sits above the list.
- Both that status filter and the status-change buttons (`StatusControls.tsx`) are client-side/optimistic (`useOptimistic`, local `useState` for the filter) rather than server round trips — two earlier versions (a `?status=` URL param requiring full navigation, and a plain `router.refresh()` after every status change) both re-ran the whole page's server-side data fetching (matches, applications, a signed resume URL per applicant) just to reflect a UI-only change, which was reported as laggy. The real update still persists to Firestore in the background; only the *visible* response is instant.
- The status pipeline is `submitted → shortlisted → interview → rejected` — "offer" was explicitly dropped per user request (§4).
- A verified badge (the same `VerifiedBadgeIcon` used for the applicant's own email-verified badge) shows next to a company's name on job feed cards and the job detail page/sidebar whenever `company.verification.status === "verified"` (§11) — trust needs to be visible to applicants, not just enforced on recruiters.

## 14. Deployment & git workflow

- Repo: `https://github.com/RafaelViii/jobhunt`, default branch `main`. Vercel project `reworks-lab/jobhunt` (live at `https://jobhunt-lime-eight.vercel.app`) has a GitHub integration that auto-deploys on every push to `main`.
- **Ship changes by `git push` to `main` only.** Deploying via the Vercel CLI directly (`vercel deploy --prod --token ...`) in parallel with that GitHub integration's auto-deploys caused a real production incident — whichever deploy finished last silently overwrote the other, with no error surfaced anywhere. Resolved by settling on git push as the single deploy path; do not reach for a manual CLI deploy as a shortcut.
- *(Note for future sessions: this repo has, at points, been developed from more than one environment at once — this local checkout, and at least one other AI/Claude session with independent push access to GitHub, whose commits included features that didn't originate locally. Before assuming a local checkout reflects the current/authoritative state, `git fetch origin && git log origin/main` — there may be newer work upstream that a stale local copy would otherwise silently conflict with or duplicate.)*

## 15. Common mistakes to avoid (checked against this plan)

- Reaching for a Cloud Functions trigger instead of an explicit Server Action call — not allowed, see §3.
- Computing match scores inline in a dashboard component instead of reading precomputed `matches` — not allowed, see §3.
- Implementing scoring logic more than once instead of calling the shared `computeMatchScore` — see §5.2/§7.
- Forgetting one of the four recompute call sites, especially "recruiter edits an existing job" — see §7.
- Regenerating the resume PDF on every keystroke instead of on save — see §6.
- Writing a Firestore rule that's either "recruiter can read nothing outside their own data" (breaks candidate review) or "recruiter can read any applicant profile" (privacy hole) instead of the relationship-scoped rule — see §8.
- Leaving dummy data creation to the last phase instead of seeding early — see §10, Phase 1.5.
- Building multi-resume support, chat, payments, embedding-based matching, or a real business/ID verification integration — out of scope, see §2 and §11.
- Passing a React component reference (e.g. an icon) as a prop from a Server Component into a Client Component — functions cannot cross that serialization boundary and this fails only at request time, not at build time (`next build` does not catch it for dynamic routes). Pass a string key instead and resolve it to the real component inside the client component itself. Verify anything crossing that boundary against a real running server with a real session, not just a clean build — a clean `next build` and a genuinely broken production route are not mutually exclusive here.
- Wrapping a Server Action call in a client-side try/catch without accounting for `redirect()` — a successful redirect throws a special error internally, which a naive catch displays as a real failure instead of letting the navigation complete. Rethrow it (`next/navigation`'s `unstable_rethrow`) before treating the catch as genuine.
- Adding a client-side filter/sort control that re-fetches from the server (a `?param=` Link, or `router.refresh()`) when the underlying data is already fully loaded on the page — filter/sort client-side with local state instead; the server round trip is pure unnecessary latency.

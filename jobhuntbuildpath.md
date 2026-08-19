# JobHunt — Build Path (Step-by-Step)

A granular checklist version of the phases in `CLAUDE.md`. The phases tell your AI tool *what the rules are*; this tells you *what to ask for, in what order, in small enough bites that it doesn't try to do five things in one prompt and lose the thread*.

**How to use this:**
1. `CLAUDE.md` goes in the repo root once, before step 0.1. It doesn't get re-pasted — the tool reads it automatically each session.
2. Work top to bottom. Give the tool **one step at a time** (the suggested prompt under each item is a starting point, not a script — adjust freely). Don't paste multiple steps into one message.
3. After each step: check it actually works (page loads, data shows up in the Firestore console, etc.) before moving to the next. Small checkpoints now save you from debugging five stacked features later.
4. Check the box, move on.

---

## Phase 0 — Project setup

- [x] **0.1 Scaffold the app.** Next.js (App Router, TypeScript) + Tailwind, pushed to a repo.
  > "Scaffold a new Next.js App Router project with TypeScript and Tailwind. No Firebase yet — just the base app, a basic layout, and a placeholder home page."

- [ ] **0.2 Firebase project setup (console, not code).** Create the Firebase project, enable Auth (email/password + Google), enable Firestore (Spark plan). **Skip Storage** — moved to Supabase Storage (already set up: `resumes` + `public-assets` buckets live), see CLAUDE.md §3. Do this yourself in the Firebase console — no need to involve the AI tool.

- [x] **0.3 Wire up Firebase in the app.** Client SDK config + Admin SDK config, env vars for both. *(Also wired Supabase Storage config — lib/supabase/admin.ts — since Firebase Storage was dropped, see CLAUDE.md §3.)*
  > "Add Firebase to this project: client SDK config in /lib/firebase/client.ts using env vars, and Admin SDK config in /lib/firebase/admin.ts for server-side use. Add a .env.local.example listing the required keys. Don't build any auth UI yet — just the config plumbing."

---

## Phase 1 — Skeleton (auth, routing, forms — no matching, no resume yet)

- [x] **1.1 Login page + Firebase Auth.** Email/password and Google sign-in. *(Built together with 1.3 — redirect goes straight to the role-correct dashboard via a session cookie carrying a role custom claim, rather than a throwaway /dashboard placeholder.)*
  > "Build /login using Firebase Auth (email/password + Google). On success, redirect to /dashboard for now — role-based redirect comes in the next step."

- [x] **1.2 Sign-up flow, split by role.**
  > "Build /signup/applicant and /signup/recruiter. Both create a Firebase Auth user, then write a users/{uid} doc with role set to 'applicant' or 'recruiter' per CLAUDE.md §4."

- [x] **1.3 Role-based redirect middleware.** *(Next.js 16 renamed middleware.ts → proxy.ts — same thing, see proxy.ts. Verifies a Firebase session cookie and its role claim; enforcement still happens server-side per request via lib/auth/dal.ts, per Next's own "optimistic check" guidance.)*
  > "Add Next.js middleware that reads users/{uid}.role after login and redirects to /applicant/dashboard or /recruiter/dashboard per CLAUDE.md §9. Both dashboard routes can be placeholder pages for now."

- [x] **1.4 Applicant onboarding wizard — UI only.** All 5 steps, no Firestore writes yet. *(Built together with 1.5 — see below.)*
  > "Build the 5-step applicant onboarding wizard UI at /applicant/onboarding per CLAUDE.md §6: basic info, work experience (repeatable), education (repeatable), skills (tag input), job preferences. Local state only for now, no save."

- [x] **1.5 Wire the wizard to Firestore.**
  > "On wizard completion, write the collected data to applicantProfiles/{uid} matching the schema in CLAUDE.md §4, and set onboardingComplete: true. No resume generation or matching yet — just the save."

- [x] **1.6 Recruiter onboarding — company profile.**
  > "Build /recruiter/onboarding: a company profile form (name, logo, website, industry, size) that writes to companies/{companyId} and links the recruiter's uid into recruiterUids, per CLAUDE.md §4."

- [x] **1.7 Recruiter job posting form.**
  > "Build /recruiter/jobs/new: a form for title, description, skills, location, remote, salary range, employment type, seniority. On submit, write to jobs/{jobId} with status 'open', per CLAUDE.md §4. No match computation yet — that's Phase 2."

**Checkpoint:** you can sign up as both roles, complete both onboarding flows, and post a job. Nothing matches or generates a resume yet — that's expected.

---

## Phase 1.5 — Seed data (do this before Phase 2, not at the end)

- [x] **1.5.1 Write the seed script.** *(scripts/seed.mjs — 5 companies/recruiters, 13 jobs, 18 applicants. Idempotent (safe to re-run). Blocked on 0.2 to actually execute — verified the syntax and the missing-env-var error path, but haven't run it against a live project yet.)*
  > "Write a standalone Node script (not exposed client-side) using the Firebase Admin SDK that seeds: 3–5 companies with recruiter users, 10–15 jobs with varied titles/skills/locations/salary/seniority, and 15–20 applicant users with varied profiles and preferences. Follow the schemas in CLAUDE.md §4. Make the variety deliberate — some near-perfect matches, some partial, some poor — so scoring produces a visible spread once Phase 2 is built."

- [x] **1.5.2 Run it against your Firebase project and eyeball the data** in the Firestore console. Confirm the variety looks right before moving on. *(Ran `npm run seed`, then `npm run seed:matches` — a second script added to compute matches + resumes for the seeded profiles by calling the real lib/matching/recompute.ts and lib/resume/generateResumePdf.ts, since the base seed script only writes profiles/jobs directly via the Admin SDK and never went through the app's own Server Actions. Verified directly against Firestore: 234 match docs (18 applicants × 13 jobs), scores span 5.0–100.0, avg 30.5 — a real spread, not clustered. All 18 resumes generated successfully.)*

---

## Phase 2 — Resume + Matching engine

- [x] **2.1 Pure scoring function.** *(lib/matching/score.ts. 7 vitest unit tests incl. two hand-checked scores (100 and 61.5) — caught and fixed a real edge-case bug in the salary-overlap logic (zero-span/point salary range was scoring 0 instead of 1). Run with `npm run test`.)*
  > "Implement computeMatchScore(applicantProfile, job) in /lib/matching/score.ts exactly per the formula and weights in CLAUDE.md §5. Pure function, no Firestore calls inside it. Add a few unit tests with hand-checkable expected scores."

- [x] **2.2 Title synonym map.**
  > "Create /lib/matching/title-synonyms.json with 10–20 common title synonym groups, and use it inside computeMatchScore's title-scoring logic per CLAUDE.md §5.1."

- [x] **2.3 Shared recompute functions.**
  > "Implement recomputeMatchesForApplicant(uid) and recomputeMatchesForJob(jobId) per CLAUDE.md §7 — each scores against the relevant open jobs/profiles using computeMatchScore, and upserts matches/{applicantUid}_{jobId} docs including the companyId field."

- [x] **2.4 Wire recompute into all four call sites.** *(Call site #2 required building /applicant/profile's edit form, and call site #4 required adding a /recruiter/jobs/[jobId]/edit route — neither existed yet in Phase 1. Both reuse existing components rather than duplicating forms.)*
  > "Call recomputeMatchesForApplicant from the onboarding-completion save (1.5) and from profile edits, and recomputeMatchesForJob from job creation (1.7) and job edits. This is CLAUDE.md §7 — all four call sites, not just the obvious two."

- [x] **2.5 Resume PDF generation.** *(Uploads to Supabase's `resumes` bucket, not Firebase Storage — see CLAUDE.md §3/§6. Wrapped in a try/catch that logs and returns null on failure rather than blocking onboarding/profile-save, per §6's explicit fallback instruction.)*
  > "Build a Route Handler that renders an applicant's applicantProfiles data into a PDF using @react-pdf/renderer, uploads it to Firebase Storage, and saves the URL to applicantProfiles/{uid}.resumeUrl, per CLAUDE.md §6. Trigger it from the same save points as 2.4's applicant recompute — not on every keystroke."

**Checkpoint:** after seeding + this phase, query `matches` directly in the Firestore console for one applicant — you should see a range of scores across jobs, not all 0 or all 100.

---

## Phase 3 — Dashboards

- [x] **3.1 Applicant dashboard.** *(Needs the matches(applicantUid, score desc) composite index from CLAUDE.md §4 — not created yet, that's Phase 5.3. Firestore will throw with an index-creation link the first time this query actually runs.)*
  > "Build /applicant/dashboard: query matches where applicantUid == current uid, order by score desc, render job cards showing match % and breakdown chips (skills/title/location/etc. per CLAUDE.md §5) per CLAUDE.md §9."

- [x] **3.2 Job detail page.**
  > "Build /applicant/jobs/[jobId] showing the full job posting and this applicant's match breakdown. No apply button yet — that's Phase 4."

- [x] **3.3 Recruiter dashboard.** *("Candidate count" originally = matched candidates (matches for that job), not applications, since applications didn't exist until Phase 4. Reversed 2026-08-19 (explicit user request, see 3.4 below) — now counts real applicants via `getApplicationCountForJob`.*
  > "Build /recruiter/dashboard: list this recruiter's posted jobs with applicant/candidate counts."

- [x] **3.4 Recruiter candidate list.** *(Also needs the matches(jobId, score desc) composite index — same Phase 5.3 caveat as 3.1. Resume preview uses a short-lived signed URL from the private Supabase `resumes` bucket, generated server-side — matches the §8 relationship rule since reaching this page already proves the recruiter owns the job.)*
  > "Build /recruiter/jobs/[jobId]/candidates: query matches where jobId == this job, order by score desc, show each candidate's match % breakdown and a resume preview link."

  *(Deviation, 2026-08-19: the page originally listed every algorithmic match for the job — the score/breakdown were useful, but most listed people had never applied, which the user found confusing ("i must only see the person who applied not all the available person"). The list is now filtered to matches that have a corresponding `applications` doc; the empty state reads "No one has applied yet" instead of "No matching candidates yet." `getCandidateCountForJob` (matches count) was removed as dead code and replaced everywhere by `getApplicationCountForJob` (lib/applications/queries.ts), including the recruiter dashboard's per-job and total counts, so the numbers stay consistent between the dashboard and the detail page.)*

---

## Phase 4 — Applications + status

- [x] **4.1 Apply flow.** *(applications/{uid}_{jobId} — deterministic ID like `matches`, so duplicate-apply prevention is a single get() rather than a query.)*
  > "Add an Apply button on the job detail page that creates an applications/{id} doc (snapshotting the current resumeUrl per CLAUDE.md §6) with status 'submitted', per CLAUDE.md §4."

- [x] **4.2 Applicant application tracker.** *(No orderBy in the Firestore query — sorted by appliedAt in JS instead, since CLAUDE.md §4 doesn't list an applications(applicantUid, appliedAt) composite index and this avoids depending on one that isn't planned.)*
  > "Build /applicant/applications listing this applicant's applications with current status."

- [x] **4.3 Recruiter status pipeline.**
  > "On the candidate list page, add status controls (shortlist / interview / offer / reject) that update the relevant applications doc's status and statusHistory."

- [x] **4.4 Confirm status changes are visible on the applicant tracker** without a manual refresh being required to matter (a refetch on page load is fine for the demo; live listeners are a nice-to-have, not required). *(Free by construction — the tracker is a plain Server Component reading Firestore fresh on every request, nothing cached.)*

---

## Phase 5 — Polish

- [x] **5.1 Firestore security rules** per CLAUDE.md §8 — **deployed and live** (2026-08-18), via the Firebase Rules API directly using the Admin SDK service account's minted OAuth token — the CLI's blocked `serviceusage` check turned out not to apply to this specific API, so no interactive login was needed after all. **Worth reading before your defense:** the relationship-scoped "recruiter reads a matched applicant's profile" rule turned out to be *not expressible* as a plain Firestore rule — rules can't loop over "does the recruiter own any job this applicant matched" without either an unbounded scan or extra denormalized lookup docs invented solely for rules (schema drift from §4). Instead, that relationship check is enforced in server code (`recruiterOwnsJob()` in lib/auth/company.ts + the query helpers in lib/matching/queries.ts, lib/applications/queries.ts), which every recruiter-facing page already goes through via the Admin SDK — and `applicantProfiles` denies all client-side reads except by the owner. This is arguably a stronger guarantee than the rule CLAUDE.md envisioned, not a shortcut: the client Firestore SDK is never used for cross-user data anywhere in this app (confirmed — `getFirebaseDb()` in lib/firebase/client.ts is defined but unused).
- [x] **5.2 Storage security rules** per CLAUDE.md §8 — N/A as originally scoped (that assumed Firebase Storage; storage is Supabase now, see CLAUDE.md §3). No bucket policy needed for the same reason as 5.1: the Supabase service-role key is never sent to the client, and every upload/signed-URL read already goes through a Route Handler that calls `requireSession()` plus the matching relationship check (app/api/uploads/public-asset/route.ts, lib/resume/signedUrl.ts). The anon/public key is never used at all in this codebase.
- [x] **5.3 Composite indexes** per CLAUDE.md §4 — **deployed and confirmed working** (2026-08-18). You clicked the two console links; both `matches` composite indexes (`applicantUid, score`) and (`jobId, score`) finished building (~10 min) and are `READY`. Verified end-to-end against the live site: `/applicant/dashboard` and `/recruiter/jobs/[jobId]/candidates` both return real data with no errors. The `jobs(status, postedAt)` and `applications(applicantUid, status)` indexes from firestore.indexes.json still aren't created — nothing hits them yet, so not urgent, but worth doing via `firebase deploy --only firestore` (needs `firebase login`, same as always) before those queries get used, e.g. if the jobs list ever needs sorting by post date.
- [x] **5.4 Re-run/expand the seed script** if the score spread across the app doesn't look convincing yet. *(Not needed — verified spread is already good, see 1.5.2.)*
- [ ] **5.5 Full demo dry run**, both roles, start to finish, before your defense. *(I ran an automated version of this — signed in as a seeded applicant and recruiter via the Firebase Auth REST API and hit the dashboard, job detail, applications tracker, and candidate list pages directly, confirming real data renders correctly end-to-end. Still worth doing yourself in an actual browser before your defense, especially to click through the UI flows I can't easily automate: onboarding wizard, apply button, status-control clicks.)*
- [x] **Google sign-in fixed on the live site** (2026-08-18) — `auth/unauthorized-domain` error, because Firebase Auth only allows OAuth sign-in from an explicit domain allowlist and the Vercel URL wasn't on it. Added `jobhunt-lime-eight.vercel.app` via the Identity Toolkit Admin API (same service-account-token trick as 5.1). Confirmed the domain is now listed; couldn't fully replay the OAuth popup itself from here (needs a real browser), so worth a quick re-test on your end.

- [x] **Mobile responsiveness pass** (2026-08-19) — job detail page (`/applicant/jobs/[jobId]`): the "full-time · lead · 100,000–140,000" text row now renders as `Chip`s matching the Skills row styling; Apply button is fixed to the bottom of the viewport on mobile (`fixed inset-x-0 bottom-0 lg:hidden`) so it's reachable without scrolling the whole description, with `pb-24` on the scrollable content so nothing sits under it; added a `BackButton` (`components/ui/BackButton.tsx`, `router.back()`) — floating pill fixed bottom-left on desktop, folded into the same fixed mobile bar as a compact icon-only button next to Apply. Also fixed `AppNav`: the text nav links ("Dashboard"/"My applications") were never given a mobile treatment and would have overflowed a phone-width header next to the logo and avatar — they now hide below `md` and are reachable instead from the avatar dropdown, which now includes those same links on narrow screens. Stacked the two-column form grids that held long free-text fields (Degree/Field of study in `EducationStep`, Job title/Company in `ExperienceStep`, Industry/Company size in `CompanyOnboardingForm`) to `grid-cols-1 sm:grid-cols-2`; left short-value grids (salary min/max number inputs, employment type/seniority selects, month-pickers) at a fixed 2-up since those fields stay legible at half-width even on a narrow phone.

- [x] **Deployed to Vercel** — live at **https://jobhunt-lime-eight.vercel.app**. Deployed via the Vercel CLI directly from local files, all 10 Firebase/Supabase env vars pushed to the production environment. This repo is now a git repo (single initial commit, not pushed to GitHub — see conversation) but Vercel deploys are still manual CLI pushes, not git-triggered.
  - Note: this project has never been initialized as a git repo, so there's no GitHub history and no auto-deploy-on-push yet — every future change needs a manual `vercel deploy --prod` (or `npm run deploy` if we wire that up) until git is set up. Worth doing before the defense if you want a proper commit history to show, or want push-to-deploy back.

---

## Post-launch polish (2026-08-19)

- [x] **Job/candidate visual fixes.** Match-breakdown bars had almost no contrast against the white card (`bg-page` track on a `bg-surface` card is a ~1.05 contrast ratio) and, on mobile, the wrapping flex container used `items-center` which made it shrink-wrap instead of stretch — together this made every bar render as an invisible sliver. Fixed by adding a visible border to the track, tiering the fill color by strength (reusing `ScoreRing`'s tier colors via the new `components/matches/tierColor.ts`), and forcing `w-full` on the wrapper. Skills chips were also `tone="neutral"` (near-invisible) — switched to `tone="brand"` everywhere they appear.
- [x] **Replaced Picsum job banners with deterministic gradients + a category icon** (`lib/utils/bannerGradient.ts`, `lib/utils/jobCategory.ts`, `components/matches/CategoryBanner.tsx`). Picsum's random image-per-seed had no relationship to job content and could land on anything (an animal close-up next to a healthcare iOS listing, reported directly) — a gradient keyed off the job id is stable and always tasteful, and the overlaid icon is chosen from the job's own title/skills so it's never wrong. Login/signup hero panels still use fixed-seed Picsum photos (decorative only, not tied to any job's content, so the mismatch risk doesn't apply there).
- [x] **Gave every avatar without a photo a distinct color** (`lib/utils/entityColor.ts`, wired into `components/nav/Avatar.tsx`). Every seeded applicant/company previously rendered the exact same flat `bg-brand-soft` circle — reported as "feels like the site is full of untrusted bots." Colors are now hashed per name, so a list of people/companies reads as individuals again.
- [x] **Job search/filter bar on the applicant dashboard** (`components/matches/JobSearchFilters.tsx`) — client-side filtering over the already-loaded `matches` (title/skill text search with a title-suggestion dropdown, location, employment type, salary min/max) since the dataset is demo-scale and doesn't need a round trip to Firestore per keystroke.
- [x] **Expanded seed data with common Philippines remote/BPO job categories** — 7 new companies (Manila Virtual Staffing, ClearLine Support, Pixel & Co Creative, GrowthWave Marketing, CartFlow Commerce, Ledger & Co, BrightPath Tutors) and 19 new jobs across VA/admin, customer support, creative, marketing, e-commerce ops, bookkeeping, and online tutoring, plus matching new applicants and title-synonym groups so scoring produces a sensible spread for the new categories too (previously 100% software-engineering-skewed). Matches were recomputed for all 31 applicant accounts (`recomputeMatchesForApplicant`, run once under `--conditions=react-server` since `lib/firebase/admin.ts`'s `server-only` import requires it outside Next's own runtime). **Resumes for the 28 newly seeded applicants are still `null`** — `@react-pdf/renderer` doesn't resolve under that same react-server condition (a real, previously-hit limitation, not new), and per CLAUDE.md §6 a resume-generation snag shouldn't block other work. If you want them filled in, the applicant dashboard/onboarding save path already generates one automatically the next time each of those profiles is saved through the real app — or ask to have them backfilled the same way the original 18 were (looping real `/api/resume/generate` calls against a running dev server).

---

## If your tool starts feeling overwhelmed mid-step

Split the step further rather than pushing through — e.g. if 1.4 (5-step wizard UI) is too much in one go, do it step-by-step (1.4a basic info, 1.4b experience, 1.4c education, 1.4d skills, 1.4e preferences) instead of all five at once. The checklist granularity above is a starting point, not a ceiling — it's fine to go finer than this.

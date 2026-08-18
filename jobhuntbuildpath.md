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

- [x] **3.3 Recruiter dashboard.** *("Candidate count" = matched candidates (matches for that job), not applications — applications don't exist until Phase 4.*
  > "Build /recruiter/dashboard: list this recruiter's posted jobs with applicant/candidate counts."

- [x] **3.4 Recruiter candidate list.** *(Also needs the matches(jobId, score desc) composite index — same Phase 5.3 caveat as 3.1. Resume preview uses a short-lived signed URL from the private Supabase `resumes` bucket, generated server-side — matches the §8 relationship rule since reaching this page already proves the recruiter owns the job.)*
  > "Build /recruiter/jobs/[jobId]/candidates: query matches where jobId == this job, order by score desc, show each candidate's match % breakdown and a resume preview link."

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

- [x] **5.1 Firestore security rules** per CLAUDE.md §8 — written (firestore.rules), not deployed yet (needs 0.2). **Worth reading before your defense:** the relationship-scoped "recruiter reads a matched applicant's profile" rule turned out to be *not expressible* as a plain Firestore rule — rules can't loop over "does the recruiter own any job this applicant matched" without either an unbounded scan or extra denormalized lookup docs invented solely for rules (schema drift from §4). Instead, that relationship check is enforced in server code (`recruiterOwnsJob()` in lib/auth/company.ts + the query helpers in lib/matching/queries.ts, lib/applications/queries.ts), which every recruiter-facing page already goes through via the Admin SDK — and `applicantProfiles` denies all client-side reads except by the owner. This is arguably a stronger guarantee than the rule CLAUDE.md envisioned, not a shortcut: the client Firestore SDK is never used for cross-user data anywhere in this app (confirmed — `getFirebaseDb()` in lib/firebase/client.ts is defined but unused).
- [x] **5.2 Storage security rules** per CLAUDE.md §8 — N/A as originally scoped (that assumed Firebase Storage; storage is Supabase now, see CLAUDE.md §3). No bucket policy needed for the same reason as 5.1: the Supabase service-role key is never sent to the client, and every upload/signed-URL read already goes through a Route Handler that calls `requireSession()` plus the matching relationship check (app/api/uploads/public-asset/route.ts, lib/resume/signedUrl.ts). The anon/public key is never used at all in this codebase.
- [ ] **5.3 Composite indexes** per CLAUDE.md §4 — written (firestore.indexes.json + firebase.json), confirmed genuinely required (hit the exact `FAILED_PRECONDITION` on both /applicant/dashboard and /recruiter/jobs/[jobId]/candidates against live data), **still not deployed**. Tried deploying non-interactively using the Admin SDK service account — it doesn't have enough IAM permission (`serviceusage.services.get` denied), only interactive `firebase login` has enough access. Two options, whichever's easier for you:
  1. Run `firebase login` then `firebase deploy --only firestore --project jobhunt-aadc0` from a terminal on your machine (deploys both rules and indexes in one shot).
  2. Click these two links (pre-filled from the real errors, one per required `matches` index — console asks you to confirm, ~30s each): [matches(applicantUid, score)](https://console.firebase.google.com/v1/r/project/jobhunt-aadc0/firestore/indexes?create_composite=Ck1wcm9qZWN0cy9qb2JodW50LWFhZGMwL2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy9tYXRjaGVzL2luZGV4ZXMvXxABGhAKDGFwcGxpY2FudFVpZBABGgkKBXNjb3JlEAIaDAoIX19uYW1lX18QAg) and [matches(jobId, score)](https://console.firebase.google.com/v1/r/project/jobhunt-aadc0/firestore/indexes?create_composite=Ck1wcm9qZWN0cy9qb2JodW50LWFhZGMwL2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy9tYXRjaGVzL2luZGV4ZXMvXxABGgkKBWpvYklkEAEaCQoFc2NvcmUQAhoMCghfX25hbWVfXxAC). (The `jobs(status, postedAt)` and `applications(applicantUid, status)` indexes from firestore.indexes.json aren't hit by any query yet, but deploying via option 1 covers them too.)
- [ ] **5.1 rules deployment** — same permission blocker as 5.3 (`firestore.rules` is written but not pushed to the live project). Covered by the same `firebase deploy --only firestore` command above.
- [x] **5.4 Re-run/expand the seed script** if the score spread across the app doesn't look convincing yet. *(Not needed — verified spread is already good, see 1.5.2.)*
- [ ] **5.5 Full demo dry run**, both roles, start to finish, before your defense. *(I ran an automated version of this — signed in as a seeded applicant and recruiter via the Firebase Auth REST API and hit the dashboard, job detail, applications tracker, and candidate list pages directly, confirming real data renders correctly end-to-end. Still worth doing yourself in an actual browser before your defense, especially to click through the UI flows I can't easily automate: onboarding wizard, apply button, status-control clicks.)*

- [x] **Deployed to Vercel** — live at **https://jobhunt-lime-eight.vercel.app**. Deployed via the Vercel CLI directly from local files (not through GitHub — this repo isn't under git yet, see note below), all 10 Firebase/Supabase env vars pushed to the production environment. Verified live: landing/login pages render, `proxy.ts` role-redirect works, sign-in works. The `/applicant/dashboard` and candidate-list pages 500 on the live site for the exact same reason as locally — confirmed via `vercel logs`, it's the identical `FAILED_PRECONDITION` missing-index error from 5.3, not a new deployment bug. **This resolves the moment the Firestore indexes are deployed.**
  - Note: this project has never been initialized as a git repo, so there's no GitHub history and no auto-deploy-on-push yet — every future change needs a manual `vercel deploy --prod` (or `npm run deploy` if we wire that up) until git is set up. Worth doing before the defense if you want a proper commit history to show, or want push-to-deploy back.

---

## If your tool starts feeling overwhelmed mid-step

Split the step further rather than pushing through — e.g. if 1.4 (5-step wizard UI) is too much in one go, do it step-by-step (1.4a basic info, 1.4b experience, 1.4c education, 1.4d skills, 1.4e preferences) instead of all five at once. The checklist granularity above is a starting point, not a ceiling — it's fine to go finer than this.

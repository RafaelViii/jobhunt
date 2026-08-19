// Second half of seeding, run separately from scripts/seed.mjs because it
// needs TypeScript (tsx) to import the *real* matching/resume logic —
// reusing recomputeMatchesForApplicant and generateAndStoreResume rather
// than re-implementing scoring here, per CLAUDE.md §5.2/§7 ("call the shared
// function, don't duplicate it").
//
// Run with: npm run seed:matches (after npm run seed)

import { adminDb } from "../lib/firebase/admin";
import { recomputeMatchesForApplicant } from "../lib/matching/recompute";
import { generateAndStoreResume } from "../lib/resume/generateResumePdf";
import type { ApplicantProfileDoc } from "../lib/types";

async function main() {
  const profilesSnap = await adminDb()
    .collection("applicantProfiles")
    .where("onboardingComplete", "==", true)
    .get();

  console.log(`Computing matches + resumes for ${profilesSnap.size} applicants…`);

  for (const doc of profilesSnap.docs) {
    const uid = doc.id;
    const profile = doc.data() as ApplicantProfileDoc;
    const userDoc = await adminDb().collection("users").doc(uid).get();
    const email = (userDoc.data()?.email as string | undefined) ?? "";

    await recomputeMatchesForApplicant(uid);
    const resumePath = await generateAndStoreResume(uid, profile, email);

    console.log(`  ${profile.basicInfo.name}: matches computed, resume ${resumePath ? "generated" : "FAILED"}`);
  }

  console.log("\nDone.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

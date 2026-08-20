// One-off export of the `matches` collection for thesis documentation —
// not part of the app, run manually, output goes to /exports (gitignored).
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { writeFileSync } from "fs";

const app = initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, "\n"),
  }),
});
const db = getFirestore(app);

function csvEscape(value) {
  const s = String(value ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

async function main() {
  console.log("Fetching matches…");
  const matchesSnap = await db.collection("matches").orderBy("score", "desc").get();
  console.log(`  ${matchesSnap.size} match documents`);

  console.log("Fetching jobs, companies, applicant profiles for joins…");
  const [jobsSnap, companiesSnap, profilesSnap] = await Promise.all([
    db.collection("jobs").get(),
    db.collection("companies").get(),
    db.collection("applicantProfiles").get(),
  ]);

  const jobsById = new Map(jobsSnap.docs.map((d) => [d.id, d.data()]));
  const companiesById = new Map(companiesSnap.docs.map((d) => [d.id, d.data()]));
  const profilesByUid = new Map(profilesSnap.docs.map((d) => [d.id, d.data()]));

  const columns = [
    "matchId",
    "applicantUid",
    "applicantName",
    "jobId",
    "jobTitle",
    "companyId",
    "companyName",
    "score",
    "breakdown_title",
    "breakdown_skills",
    "breakdown_location",
    "breakdown_salary",
    "breakdown_type",
    "breakdown_seniority",
    "computedAt",
  ];

  const rows = matchesSnap.docs.map((doc) => {
    const m = doc.data();
    const job = jobsById.get(m.jobId);
    const company = companiesById.get(m.companyId);
    const applicant = profilesByUid.get(m.applicantUid);
    const b = m.breakdown ?? {};

    return [
      doc.id,
      m.applicantUid ?? "",
      applicant?.basicInfo?.name ?? "",
      m.jobId ?? "",
      job?.title ?? "",
      m.companyId ?? "",
      company?.name ?? "",
      m.score ?? "",
      b.title ?? "",
      b.skills ?? "",
      b.location ?? "",
      b.salary ?? "",
      b.type ?? "",
      b.seniority ?? "",
      m.computedAt ? new Date(m.computedAt).toISOString() : "",
    ];
  });

  const csv = [columns.join(","), ...rows.map((row) => row.map(csvEscape).join(","))].join("\n");

  const outPath = new URL("../exports/matches-export.csv", import.meta.url);
  writeFileSync(outPath, csv, "utf8");
  console.log(`\nWrote ${rows.length} rows to exports/matches-export.csv`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

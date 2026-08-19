import "server-only";

import { adminDb } from "@/lib/firebase/admin";
import type { CompanyDoc, JobDoc } from "@/lib/types";

export async function recruiterOwnsJob(job: JobDoc, recruiterUid: string): Promise<boolean> {
  const companySnap = await adminDb().collection("companies").doc(job.companyId).get();
  const company = companySnap.data() as CompanyDoc | undefined;
  return company !== undefined && company.recruiterUids.includes(recruiterUid);
}

export async function getCompanyForRecruiter(
  recruiterUid: string,
): Promise<(CompanyDoc & { id: string }) | null> {
  const snap = await adminDb()
    .collection("companies")
    .where("recruiterUids", "array-contains", recruiterUid)
    .limit(1)
    .get();

  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...(snap.docs[0].data() as CompanyDoc) };
}

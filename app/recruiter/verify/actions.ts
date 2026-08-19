"use server";

import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/dal";
import { getCompanyForRecruiter } from "@/lib/auth/company";
import { adminDb } from "@/lib/firebase/admin";
import type { VerificationDocumentType } from "@/lib/types";

// Not a real verification integration — see CLAUDE.md §11. Always succeeds
// once a document is uploaded; the animated "processing" sequence lives
// client-side in VerificationForm, this just persists the outcome.
export async function submitVerification(documentType: VerificationDocumentType, documentPath: string): Promise<void> {
  const session = await requireSession("recruiter");

  const company = await getCompanyForRecruiter(session.uid);
  if (!company) redirect("/recruiter/onboarding");

  const now = Date.now();
  await adminDb()
    .collection("companies")
    .doc(company.id)
    .update({
      verification: {
        status: "verified",
        documentType,
        documentPath,
        submittedAt: now,
        verifiedAt: now,
      },
    });
}

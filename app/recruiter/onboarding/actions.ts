"use server";

import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/dal";
import { adminDb } from "@/lib/firebase/admin";
import type { CompanyDoc } from "@/lib/types";

export type CreateCompanyInput = Omit<CompanyDoc, "recruiterUids" | "verification">;

export async function createCompany(input: CreateCompanyInput): Promise<void> {
  const session = await requireSession("recruiter");

  const companyDoc: CompanyDoc = {
    ...input,
    recruiterUids: [session.uid],
    verification: { status: "unverified", documentType: null, documentPath: null, submittedAt: null, verifiedAt: null },
  };

  await adminDb().collection("companies").doc().set(companyDoc);

  redirect("/recruiter/dashboard");
}

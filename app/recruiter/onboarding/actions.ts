"use server";

import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/dal";
import { adminDb } from "@/lib/firebase/admin";
import type { CompanyDoc } from "@/lib/types";

export type CreateCompanyInput = Omit<CompanyDoc, "recruiterUids">;

export async function createCompany(input: CreateCompanyInput): Promise<void> {
  const session = await requireSession("recruiter");

  const companyDoc: CompanyDoc = {
    ...input,
    recruiterUids: [session.uid],
  };

  await adminDb().collection("companies").doc().set(companyDoc);

  redirect("/recruiter/dashboard");
}

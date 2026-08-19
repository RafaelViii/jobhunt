import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/dal";
import { getCompanyForRecruiter } from "@/lib/auth/company";
import { VerificationForm } from "@/components/verification/VerificationForm";

export default async function RecruiterVerifyPage() {
  const session = await requireSession("recruiter");

  const company = await getCompanyForRecruiter(session.uid);
  if (!company) redirect("/recruiter/onboarding");
  if (company.verification?.status === "verified") redirect("/recruiter/jobs/new");

  return <VerificationForm />;
}

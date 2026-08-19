import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/dal";
import { getCompanyForRecruiter } from "@/lib/auth/company";
import { CompanyOnboardingForm } from "@/components/onboarding/CompanyOnboardingForm";

export default async function RecruiterOnboardingPage() {
  const session = await requireSession("recruiter");

  // A recruiter should belong to exactly one company in this demo — guard
  // against creating a second one if they land back on this page.
  const existing = await getCompanyForRecruiter(session.uid);
  if (existing) {
    redirect("/recruiter/dashboard");
  }

  return <CompanyOnboardingForm />;
}

import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/dal";
import { adminDb } from "@/lib/firebase/admin";
import { ProfileEditForm } from "@/components/onboarding/ProfileEditForm";
import type { ApplicantProfileDoc } from "@/lib/types";

export default async function ApplicantProfilePage() {
  const session = await requireSession("applicant");

  const snapshot = await adminDb().collection("applicantProfiles").doc(session.uid).get();
  if (!snapshot.exists) {
    redirect("/applicant/onboarding");
  }

  const profile = snapshot.data() as ApplicantProfileDoc;

  return (
    <ProfileEditForm
      initialData={{
        basicInfo: profile.basicInfo,
        experience: profile.experience,
        education: profile.education,
        skills: profile.skills,
        preferences: profile.preferences,
      }}
    />
  );
}

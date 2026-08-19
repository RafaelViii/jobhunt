import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/dal";
import { adminDb } from "@/lib/firebase/admin";
import { getSignedResumeUrl } from "@/lib/resume/signedUrl";
import { ProfileEditForm } from "@/components/onboarding/ProfileEditForm";
import type { ApplicantProfileDoc } from "@/lib/types";

// Longer-lived than the default 5 minutes — this link sits on a form page
// someone may sit on editing fields for a while before clicking it.
const RESUME_PREVIEW_EXPIRY_SECONDS = 15 * 60;

export default async function ApplicantProfilePage() {
  const session = await requireSession("applicant");

  const snapshot = await adminDb().collection("applicantProfiles").doc(session.uid).get();
  if (!snapshot.exists) {
    redirect("/applicant/onboarding");
  }

  const profile = snapshot.data() as ApplicantProfileDoc;
  const resumeHref = profile.resumeUrl
    ? await getSignedResumeUrl(profile.resumeUrl, RESUME_PREVIEW_EXPIRY_SECONDS)
    : null;

  return (
    <ProfileEditForm
      initialData={{
        basicInfo: profile.basicInfo,
        experience: profile.experience,
        education: profile.education,
        skills: profile.skills,
        preferences: profile.preferences,
      }}
      resumeHref={resumeHref}
    />
  );
}

import { requireSession } from "@/lib/auth/dal";
import { adminDb } from "@/lib/firebase/admin";
import { AppNav } from "@/components/nav/AppNav";
import { GlobalBackButton } from "@/components/nav/GlobalBackButton";
import { BriefcaseIcon, InboxIcon } from "@/components/ui/icons";
import type { ApplicantProfileDoc } from "@/lib/types";

export default async function ApplicantLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession("applicant");

  const profileSnap = await adminDb().collection("applicantProfiles").doc(session.uid).get();
  const profile = profileSnap.exists ? (profileSnap.data() as ApplicantProfileDoc) : null;

  return (
    <>
      <AppNav
        homeHref="/applicant/dashboard"
        navLinks={[
          { href: "/applicant/dashboard", label: "Dashboard", icon: BriefcaseIcon },
          { href: "/applicant/applications", label: "My applications", icon: InboxIcon },
        ]}
        name={profile?.basicInfo.name || session.email || "Account"}
        photoUrl={profile?.basicInfo.photoUrl}
        profileHref="/applicant/profile"
      />
      {children}
      <GlobalBackButton dashboardHref="/applicant/dashboard" />
    </>
  );
}

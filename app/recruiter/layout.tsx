import { requireSession } from "@/lib/auth/dal";
import { getCompanyForRecruiter } from "@/lib/auth/company";
import { AppNav } from "@/components/nav/AppNav";
import { GlobalBackButton } from "@/components/nav/GlobalBackButton";
import { BriefcaseIcon, PlusIcon } from "@/components/ui/icons";

export default async function RecruiterLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession("recruiter");
  const company = await getCompanyForRecruiter(session.uid);

  return (
    <>
      <AppNav
        homeHref="/recruiter/dashboard"
        navLinks={[
          { href: "/recruiter/dashboard", label: "Dashboard", icon: BriefcaseIcon },
          { href: "/recruiter/jobs/new", label: "Post a job", icon: PlusIcon },
        ]}
        name={company?.name || session.email || "Account"}
        photoUrl={company?.logoUrl}
      />
      {children}
      <GlobalBackButton dashboardHref="/recruiter/dashboard" />
    </>
  );
}

import { requireSession } from "@/lib/auth/dal";
import { getCompanyForRecruiter } from "@/lib/auth/company";
import { AppNav } from "@/components/nav/AppNav";

export default async function RecruiterLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession("recruiter");
  const company = await getCompanyForRecruiter(session.uid);

  return (
    <>
      <AppNav
        homeHref="/recruiter/dashboard"
        navLinks={[
          { href: "/recruiter/dashboard", label: "Dashboard" },
          { href: "/recruiter/jobs/new", label: "Post a job" },
        ]}
        name={company?.name || session.email || "Account"}
        photoUrl={company?.logoUrl}
      />
      {children}
    </>
  );
}

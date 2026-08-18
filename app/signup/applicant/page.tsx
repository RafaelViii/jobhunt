import { SignupForm } from "@/components/auth/SignupForm";

export default function ApplicantSignupPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Sign up as an applicant</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Build your profile and get matched to open roles.
        </p>
      </div>
      <SignupForm role="applicant" />
      <p className="text-center text-sm text-zinc-500">
        Already have an account?{" "}
        <a href="/login" className="underline">
          Log in
        </a>
      </p>
    </main>
  );
}

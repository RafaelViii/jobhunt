import { SignupForm } from "@/components/auth/SignupForm";

export default function RecruiterSignupPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Sign up as a recruiter</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Post jobs and get a ranked list of matching candidates.
        </p>
      </div>
      <SignupForm role="recruiter" />
      <p className="text-center text-sm text-zinc-500">
        Already have an account?{" "}
        <a href="/login" className="underline">
          Log in
        </a>
      </p>
    </main>
  );
}

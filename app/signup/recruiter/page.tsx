import { SignupForm } from "@/components/auth/SignupForm";

export default function RecruiterSignupPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="flex w-full max-w-4xl overflow-hidden rounded-xl border border-line bg-surface shadow-sm">
        <div
          className="relative hidden w-1/2 shrink-0 md:block"
          style={{
            backgroundImage: "url(https://picsum.photos/seed/jobhunt-recruiter/800/1000)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/90 via-brand-dark/40 to-transparent" />
          <div className="absolute bottom-0 left-0 p-8 text-white">
            <p className="text-2xl font-bold leading-snug">Skip the resume pile.</p>
            <p className="mt-2 text-sm text-white/80">
              Post a job and get a ranked, transparent candidate list — no black-box scoring.
            </p>
          </div>
        </div>

        <div className="flex w-full flex-col justify-center p-8 md:w-1/2">
          <h1 className="mb-1 text-2xl font-bold tracking-tight text-brand">JobHunt</h1>
          <h2 className="mt-4 text-lg font-semibold text-ink">Sign up as a recruiter</h2>
          <p className="mb-5 mt-1 text-sm text-muted">Post jobs and get a ranked list of matching candidates.</p>
          <SignupForm role="recruiter" />
          <p className="mt-5 text-center text-sm text-muted">
            Already have an account?{" "}
            <a href="/login" className="font-medium text-brand hover:underline">
              Log in
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}

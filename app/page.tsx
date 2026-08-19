export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-3xl font-bold tracking-tight text-brand">JobHunt</h1>
      <p className="max-w-md text-sm text-muted">
        Thesis demo — applicants get a matched job list and an auto-built resume;
        recruiters post a job and get a ranked candidate list.
      </p>
    </main>
  );
}

import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/dal";
import { recruiterOwnsJob } from "@/lib/auth/company";
import { adminDb } from "@/lib/firebase/admin";
import { JobPostForm } from "@/components/jobs/JobPostForm";
import { updateJob } from "@/app/recruiter/jobs/[jobId]/edit/actions";
import type { JobDoc } from "@/lib/types";

export default async function EditJobPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  const session = await requireSession("recruiter");

  const snapshot = await adminDb().collection("jobs").doc(jobId).get();
  if (!snapshot.exists) {
    redirect("/recruiter/dashboard");
  }

  const job = snapshot.data() as JobDoc;
  if (!(await recruiterOwnsJob(job, session.uid))) {
    redirect("/recruiter/dashboard");
  }

  return (
    <JobPostForm
      initialData={{
        title: job.title,
        description: job.description,
        skills: job.skills,
        location: job.location,
        remote: job.remote,
        salaryMin: job.salaryMin,
        salaryMax: job.salaryMax,
        employmentType: job.employmentType,
        seniority: job.seniority,
      }}
      heading="Edit job"
      submitLabel="Save changes"
      submittingLabel="Saving…"
      onSubmit={updateJob.bind(null, jobId)}
    />
  );
}

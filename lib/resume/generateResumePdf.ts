import "server-only";

import { renderToBuffer } from "@react-pdf/renderer";
import { adminDb } from "@/lib/firebase/admin";
import { RESUMES_BUCKET, supabaseAdmin } from "@/lib/supabase/admin";
import { ResumeDocument } from "@/lib/resume/ResumeDocument";
import type { ApplicantProfileDoc } from "@/lib/types";

function resumePathFor(uid: string): string {
  return `${uid}/resume.pdf`;
}

// CLAUDE.md §6: one canonical resume per applicant (§2 — no multi-resume
// management), so this overwrites the same storage path rather than
// versioning/timestamping. Never blocks the caller: a rendering or upload
// failure is logged and returns null instead of throwing, so a flaky PDF
// render can't stall onboarding or a profile save (§6's explicit fallback).
export async function generateAndStoreResume(
  uid: string,
  profile: ApplicantProfileDoc,
): Promise<string | null> {
  try {
    const buffer = await renderToBuffer(ResumeDocument({ profile }));
    const path = resumePathFor(uid);

    const { error } = await supabaseAdmin()
      .storage.from(RESUMES_BUCKET)
      .upload(path, buffer, { contentType: "application/pdf", upsert: true });

    if (error) throw error;

    await adminDb().collection("applicantProfiles").doc(uid).update({ resumeUrl: path });
    return path;
  } catch (err) {
    console.error(`Resume generation failed for ${uid}:`, err);
    return null;
  }
}

import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/dal";
import { adminDb } from "@/lib/firebase/admin";
import { generateAndStoreResume } from "@/lib/resume/generateResumePdf";
import type { ApplicantProfileDoc } from "@/lib/types";

// CLAUDE.md §6: rendering happens in a Vercel Route Handler (works in
// serverless without a headless browser). The onboarding/profile-edit Server
// Actions call generateAndStoreResume directly rather than hitting this over
// HTTP — same serverless runtime, no need for a self-referential fetch. This
// route exists as the addressable entry point (e.g. a future manual
// "regenerate resume" trigger).
export async function POST() {
  const session = await requireSession("applicant");

  const profileSnap = await adminDb().collection("applicantProfiles").doc(session.uid).get();
  if (!profileSnap.exists) {
    return NextResponse.json({ error: "No profile found" }, { status: 404 });
  }

  const path = await generateAndStoreResume(session.uid, profileSnap.data() as ApplicantProfileDoc, session.email ?? "");
  if (!path) {
    return NextResponse.json({ error: "Resume generation failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, path });
}

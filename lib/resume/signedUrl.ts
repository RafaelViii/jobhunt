import "server-only";

import { RESUMES_BUCKET, supabaseAdmin } from "@/lib/supabase/admin";

const DEFAULT_EXPIRY_SECONDS = 5 * 60;

// Callers are responsible for having already verified the relationship rule
// from CLAUDE.md §8 (owning applicant, or a recruiter with a qualifying
// match/application to that applicant) before calling this — it does not
// re-check anything itself.
export async function getSignedResumeUrl(
  path: string,
  expiresInSeconds = DEFAULT_EXPIRY_SECONDS,
): Promise<string | null> {
  const { data, error } = await supabaseAdmin()
    .storage.from(RESUMES_BUCKET)
    .createSignedUrl(path, expiresInSeconds);

  if (error || !data) return null;
  return data.signedUrl;
}

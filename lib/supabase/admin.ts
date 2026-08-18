import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Server-only: holds the service-role key, which bypasses row/bucket policies.
// Never import this file from client components — "server-only" throws if you try.
// All Storage reads/writes (uploads, signed URLs) go through this client from a
// Route Handler — never a client-side Supabase SDK. See CLAUDE.md §3 and §8.
//
// Initialization is lazy (deferred to first call) rather than run at module
// load — see the matching comment in lib/firebase/admin.ts for why.

export const RESUMES_BUCKET = "resumes";
export const PUBLIC_ASSETS_BUCKET = "public-assets";

let cachedClient: SupabaseClient | undefined;

export function supabaseAdmin(): SupabaseClient {
  if (cachedClient) return cachedClient;

  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars");
  }

  cachedClient = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return cachedClient;
}

import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { decodedTokenToSessionUser, SESSION_COOKIE_NAME, verifySessionCookie, type SessionUser } from "@/lib/firebase/session";
import type { Role } from "@/lib/types";

// Data Access Layer (Next.js's own recommended pattern for centralizing
// session checks — see node_modules/next/dist/docs/.../authentication.md).
// Server Actions and Route Handlers should call requireSession() rather than
// re-reading the cookie themselves.
export const getSession = cache(async (): Promise<SessionUser | null> => {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!cookie) return null;

  const decoded = await verifySessionCookie(cookie);
  return decoded ? decodedTokenToSessionUser(decoded) : null;
});

export async function requireSession(role?: Role): Promise<SessionUser> {
  const session = await getSession();
  if (!session) redirect("/login");
  if (role && session.role !== role) redirect("/login");
  return session;
}

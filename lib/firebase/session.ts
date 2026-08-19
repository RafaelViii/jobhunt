import "server-only";

import type { DecodedIdToken } from "firebase-admin/auth";
import { adminAuth } from "@/lib/firebase/admin";
import type { Role } from "@/lib/types";

export const SESSION_COOKIE_NAME = "session";
export const SESSION_MAX_AGE_SECONDS = 14 * 24 * 60 * 60; // Firebase session cookies cap out at 14 days.

export type SessionUser = {
  uid: string;
  email: string | null;
  role: Role | null;
  emailVerified: boolean;
};

// idToken is the short-lived token from the client SDK right after sign-in/sign-up.
// The resulting cookie is a long-lived, independently verifiable Firebase session cookie.
export async function createSessionCookie(idToken: string): Promise<string> {
  return adminAuth().createSessionCookie(idToken, {
    expiresIn: SESSION_MAX_AGE_SECONDS * 1000,
  });
}

// checkRevoked defaults to false: this is an "optimistic" check (see Next.js Proxy
// auth guide) used on every request in proxy.ts, so it must stay cheap — no per-request
// Firestore/Auth-backend round trip. Pass checkRevoked: true only for sensitive,
// low-frequency server-side checks where a just-revoked session must be caught immediately.
export async function verifySessionCookie(
  cookie: string,
  { checkRevoked = false }: { checkRevoked?: boolean } = {},
): Promise<DecodedIdToken | null> {
  try {
    return await adminAuth().verifySessionCookie(cookie, checkRevoked);
  } catch {
    return null;
  }
}

export function decodedTokenToSessionUser(decoded: DecodedIdToken): SessionUser {
  const role = decoded.role;
  return {
    uid: decoded.uid,
    email: decoded.email ?? null,
    role: role === "applicant" || role === "recruiter" ? role : null,
    emailVerified: decoded.email_verified ?? false,
  };
}

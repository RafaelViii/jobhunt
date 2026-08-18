import { signOut, type User } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase/client";
import type { Role } from "@/lib/types";

// Exchanges the client SDK's short-lived ID token for the server-set session
// cookie that proxy.ts and server-side code rely on, then reads the role back
// off the token's custom claims (set server-side at signup — see /api/auth/register).
export async function establishSession(user: User): Promise<Role | null> {
  const idToken = await user.getIdToken();
  const res = await fetch("/api/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });

  if (!res.ok) {
    throw new Error("Failed to establish session");
  }

  const tokenResult = await user.getIdTokenResult();
  const role = tokenResult.claims.role;
  return role === "applicant" || role === "recruiter" ? role : null;
}

export async function clearSession(): Promise<void> {
  await fetch("/api/auth/session", { method: "DELETE" });
  await signOut(getFirebaseAuth());
}

export function dashboardPathForRole(role: Role): string {
  return role === "recruiter" ? "/recruiter/dashboard" : "/applicant/dashboard";
}

export function onboardingPathForRole(role: Role): string {
  return role === "recruiter" ? "/recruiter/onboarding" : "/applicant/onboarding";
}

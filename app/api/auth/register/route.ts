import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import type { Role, UserDoc } from "@/lib/types";

// Called once, immediately after Firebase client-side signup creates the Auth
// user. Writes the users/{uid} doc and sets the "role" custom claim (only the
// Admin SDK can set claims — this is why registration can't be a pure client
// write, per CLAUDE.md §3's "server-privileged writes" rule).
export async function POST(request: Request) {
  const { idToken, role, displayName } = (await request.json()) as {
    idToken?: string;
    role?: Role;
    displayName?: string;
  };

  if (!idToken || (role !== "applicant" && role !== "recruiter")) {
    return NextResponse.json({ error: "Missing idToken or invalid role" }, { status: 400 });
  }

  let uid: string;
  let email: string | null;
  try {
    const decoded = await adminAuth().verifyIdToken(idToken);
    uid = decoded.uid;
    email = decoded.email ?? null;
  } catch {
    return NextResponse.json({ error: "Invalid idToken" }, { status: 401 });
  }

  const userRef = adminDb().collection("users").doc(uid);
  const existing = await userRef.get();
  if (existing.exists) {
    // Role is fixed at first registration — reject silent role switching.
    return NextResponse.json({ error: "User already registered" }, { status: 409 });
  }

  const userDoc: UserDoc = {
    role,
    email: email ?? "",
    displayName: displayName?.trim() || email || "New user",
    createdAt: Date.now(),
  };

  await Promise.all([
    userRef.set(userDoc),
    adminAuth().setCustomUserClaims(uid, { role }),
  ]);

  return NextResponse.json({ ok: true });
}

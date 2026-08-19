import "server-only";

import { type App, cert, getApps, initializeApp } from "firebase-admin/app";
import { type Auth, getAuth } from "firebase-admin/auth";
import { type Firestore, getFirestore } from "firebase-admin/firestore";

// Server-only: relies on a service account. Never import this file from
// client components — the "server-only" import above will throw if you try.
// Storage lives on Supabase, not Firebase — see lib/supabase/admin.ts and CLAUDE.md §3.
//
// Initialization is lazy (deferred to first call) rather than run at module
// load: Next.js imports route handler modules during `next build` to collect
// page data, which would otherwise throw before a real request ever comes in
// when env vars aren't set yet (e.g. before Firebase project setup is done).
function getAdminApp(): App {
  if (getApps().length) return getApps()[0];

  return initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      // Vercel/`.env` files store the key with literal "\n" sequences.
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

export function adminAuth(): Auth {
  return getAuth(getAdminApp());
}

export function adminDb(): Firestore {
  return getFirestore(getAdminApp());
}

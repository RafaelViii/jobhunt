import { type FirebaseApp, getApp, getApps, initializeApp } from "firebase/app";
import { type Auth, getAuth } from "firebase/auth";
import { type Firestore, getFirestore } from "firebase/firestore";

// Storage lives on Supabase, not Firebase — see lib/supabase/admin.ts and CLAUDE.md §3.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function getFirebaseApp(): FirebaseApp {
  return getApps().length ? getApp() : initializeApp(firebaseConfig);
}

// getAuth() throws synchronously if the config is invalid (e.g. no API key
// yet). Deferring it to first call — rather than module load — keeps pages
// that merely import this file prerenderable before Firebase env vars exist.
let cachedAuth: Auth | undefined;
let cachedDb: Firestore | undefined;

export function getFirebaseAuth(): Auth {
  return (cachedAuth ??= getAuth(getFirebaseApp()));
}

export function getFirebaseDb(): Firestore {
  return (cachedDb ??= getFirestore(getFirebaseApp()));
}

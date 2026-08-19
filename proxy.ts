import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decodedTokenToSessionUser, SESSION_COOKIE_NAME, verifySessionCookie } from "@/lib/firebase/session";

// Next.js 16 renamed middleware -> proxy (same runtime, defaults to Node.js —
// see node_modules/next/dist/docs/.../proxy.md). That's what makes it safe to
// call the Firebase Admin SDK here at all.
//
// This is an *optimistic* check per Next's auth guide: verifySessionCookie
// cryptographically verifies the cookie but (checkRevoked: false, the default)
// does not hit the Auth backend, so it's cheap enough to run on every request.
// Real authorization still happens server-side in each Server Action/Route
// Handler and in Firestore/Storage security rules — this only redirects.

const APPLICANT_PREFIX = "/applicant";
const RECRUITER_PREFIX = "/recruiter";
const AUTH_PAGES = new Set(["/login", "/signup/applicant", "/signup/recruiter"]);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const cookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const decoded = cookie ? await verifySessionCookie(cookie) : null;
  const session = decoded ? decodedTokenToSessionUser(decoded) : null;

  const isApplicantRoute = pathname.startsWith(APPLICANT_PREFIX);
  const isRecruiterRoute = pathname.startsWith(RECRUITER_PREFIX);
  const isAuthPage = AUTH_PAGES.has(pathname);

  if ((isApplicantRoute || isRecruiterRoute) && !session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isApplicantRoute && session && session.role !== "applicant") {
    return NextResponse.redirect(new URL("/recruiter/dashboard", request.url));
  }

  if (isRecruiterRoute && session && session.role !== "recruiter") {
    return NextResponse.redirect(new URL("/applicant/dashboard", request.url));
  }

  if (isAuthPage && session?.role) {
    const destination = session.role === "recruiter" ? "/recruiter/dashboard" : "/applicant/dashboard";
    return NextResponse.redirect(new URL(destination, request.url));
  }

  // Root always redirects — signed in goes to the role dashboard, signed out
  // goes straight to login. There's no standalone landing page in this app.
  if (pathname === "/") {
    const destination = session?.role
      ? session.role === "recruiter"
        ? "/recruiter/dashboard"
        : "/applicant/dashboard"
      : "/login";
    return NextResponse.redirect(new URL(destination, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};

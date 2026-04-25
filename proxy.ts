import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config";
import { getDashboardPath, hasAccess } from "@/lib/roles";
import { Role } from "@/app/generated/prisma/enums";

// Edge-safe auth instance — uses only authConfig (no DB, no Node.js modules)
const { auth } = NextAuth(authConfig);

const PUBLIC_PATHS = ["/login", "/signup", "/verify-email", "/forgot-password", "/reset-password", "/setup-account"];

export default auth((req) => {
  const { nextUrl, auth: session } = req;
  const pathname = nextUrl.pathname;

  // Allow public paths — if already logged in, bounce to their dashboard
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    if (session?.user) {
      const dest = getDashboardPath(session.user.role, session.user.covenantSigned);
      return NextResponse.redirect(new URL(dest, req.url));
    }
    return NextResponse.next();
  }

  // Welcome page — shown to logged-in participants who haven't signed the covenant yet
  if (pathname.startsWith("/welcome")) {
    if (!session?.user) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    if (session.user.covenantSigned) {
      return NextResponse.redirect(new URL("/participant", req.url));
    }
    return NextResponse.next();
  }

  // Problem Sightings onboarding page — after covenant, before dashboard
  if (pathname.startsWith("/problem-sightings")) {
    if (!session?.user) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    if (!session.user.covenantSigned) {
      return NextResponse.redirect(new URL("/welcome", req.url));
    }
    return NextResponse.next();
  }

  // Covenant page — participants who haven't signed
  if (pathname.startsWith("/covenant")) {
    if (!session?.user) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    if (session.user.role !== Role.PARTICIPANT) {
      return NextResponse.redirect(new URL(getDashboardPath(session.user.role, true), req.url));
    }
    if (session.user.covenantSigned) {
      return NextResponse.redirect(new URL("/participant", req.url));
    }
    return NextResponse.next();
  }

  // Root → redirect to appropriate dashboard
  if (pathname === "/") {
    if (!session?.user) return NextResponse.redirect(new URL("/login", req.url));
    return NextResponse.redirect(
      new URL(getDashboardPath(session.user.role, session.user.covenantSigned), req.url)
    );
  }

  // Protected routes — require auth
  if (!session?.user) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const user = session.user;

  // Participant must visit welcome/covenant before accessing the dashboard
  if (user.role === Role.PARTICIPANT && !user.covenantSigned) {
    // Allow /welcome and /covenant through; everything else goes to /welcome
    if (!pathname.startsWith("/welcome") && !pathname.startsWith("/covenant") && !pathname.startsWith("/problem-sightings")) {
      return NextResponse.redirect(new URL("/welcome", req.url));
    }
  }

  // Role-based route protection
  if (pathname.startsWith("/participant") && !hasAccess(user.role, Role.PARTICIPANT)) {
    return NextResponse.redirect(
      new URL(getDashboardPath(user.role, user.covenantSigned), req.url)
    );
  }
  if (pathname.startsWith("/facilitator") && !hasAccess(user.role, Role.FACILITATOR)) {
    return NextResponse.redirect(
      new URL(getDashboardPath(user.role, user.covenantSigned), req.url)
    );
  }
  if (pathname.startsWith("/program-admin") && !hasAccess(user.role, Role.PROGRAM_ADMIN)) {
    return NextResponse.redirect(
      new URL(getDashboardPath(user.role, user.covenantSigned), req.url)
    );
  }
  if (pathname.startsWith("/super-admin") && !hasAccess(user.role, Role.SUPER_ADMIN)) {
    return NextResponse.redirect(
      new URL(getDashboardPath(user.role, user.covenantSigned), req.url)
    );
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|images|favicon.ico|.*\\.svg|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.webp).*)"],
};

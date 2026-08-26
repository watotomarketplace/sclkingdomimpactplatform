import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config";
import { getDashboardPath, hasAccess } from "@/lib/roles";
import { Role } from "@/app/generated/prisma/enums";

const { auth } = NextAuth(authConfig);

// Public auth pages (signup is suspended for the 2026 cohort but the page still routes)
const PUBLIC_PATHS = [
  "/login",
  "/signup",
  "/verify-email",
  "/forgot-password",
  "/reset-password",
  "/setup-account",
];

export default auth((req) => {
  const { nextUrl, auth: session } = req;
  const pathname = nextUrl.pathname;

  // Public auth pages — bounce signed-in users to their dashboard
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    if (session?.user) {
      const dest = getDashboardPath(session.user.role, session.user.onboardingComplete);
      return NextResponse.redirect(new URL(dest, req.url));
    }
    return NextResponse.next();
  }

  // Onboarding (MVI Brief) — Addendum 3
  // Reachable even after completion so participants can go back and edit their brief.
  if (pathname.startsWith("/onboarding")) {
    if (!session?.user) return NextResponse.redirect(new URL("/login", req.url));
    return NextResponse.next();
  }

  // Root → role-appropriate dashboard
  if (pathname === "/") {
    if (!session?.user) return NextResponse.redirect(new URL("/login", req.url));
    return NextResponse.redirect(
      new URL(getDashboardPath(session.user.role, session.user.onboardingComplete), req.url)
    );
  }

  // All other routes require auth
  if (!session?.user) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const user = session.user;

  // Force participants/group-leaders to complete onboarding before accessing the app
  if (
    (user.role === Role.PARTICIPANT || user.role === Role.GROUP_LEADER) &&
    !user.onboardingComplete &&
    !pathname.startsWith("/onboarding")
  ) {
    return NextResponse.redirect(new URL("/onboarding", req.url));
  }

  // Legacy redirects — these onboarding pages are retired in Addendum 3
  if (
    pathname.startsWith("/welcome") ||
    pathname.startsWith("/covenant") ||
    pathname.startsWith("/problem-sightings")
  ) {
    return NextResponse.redirect(
      new URL(getDashboardPath(user.role, user.onboardingComplete), req.url)
    );
  }

  // Role-based route protection
  if (pathname.startsWith("/participant") && !hasAccess(user.role, Role.PARTICIPANT)) {
    return NextResponse.redirect(
      new URL(getDashboardPath(user.role, user.onboardingComplete), req.url)
    );
  }
  if (pathname.startsWith("/group-leader") && !hasAccess(user.role, Role.GROUP_LEADER)) {
    return NextResponse.redirect(
      new URL(getDashboardPath(user.role, user.onboardingComplete), req.url)
    );
  }
  if (pathname.startsWith("/facilitator") && !hasAccess(user.role, Role.FACILITATOR)) {
    return NextResponse.redirect(
      new URL(getDashboardPath(user.role, user.onboardingComplete), req.url)
    );
  }
  if (pathname.startsWith("/program-admin") && !hasAccess(user.role, Role.PROGRAM_ADMIN)) {
    return NextResponse.redirect(
      new URL(getDashboardPath(user.role, user.onboardingComplete), req.url)
    );
  }
  if (pathname.startsWith("/super-admin") && !hasAccess(user.role, Role.SUPER_ADMIN)) {
    return NextResponse.redirect(
      new URL(getDashboardPath(user.role, user.onboardingComplete), req.url)
    );
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|images|favicon.ico|.*\\.svg|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.webp).*)",
  ],
};

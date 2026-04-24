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

  // Allow public paths
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    if (session?.user) {
      const dest = getDashboardPath(
        session.user.role,
        session.user.covenantSigned,
        session.user.readinessComplete
      );
      return NextResponse.redirect(new URL(dest, req.url));
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
      // Covenant done — send to readiness if not complete, else dashboard
      const dest = session.user.readinessComplete ? "/participant" : "/readiness-assessment";
      return NextResponse.redirect(new URL(dest, req.url));
    }
    return NextResponse.next();
  }

  // Readiness Assessment onboarding page
  if (pathname.startsWith("/readiness-assessment")) {
    if (!session?.user) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    if (session.user.role !== Role.PARTICIPANT) {
      return NextResponse.redirect(new URL(getDashboardPath(session.user.role, true), req.url));
    }
    // Must have signed covenant first
    if (!session.user.covenantSigned) {
      return NextResponse.redirect(new URL("/covenant", req.url));
    }
    // If already complete, send to dashboard
    if (session.user.readinessComplete) {
      return NextResponse.redirect(new URL("/participant", req.url));
    }
    return NextResponse.next();
  }

  // Root → redirect to appropriate dashboard
  if (pathname === "/") {
    if (!session?.user) return NextResponse.redirect(new URL("/login", req.url));
    return NextResponse.redirect(
      new URL(
        getDashboardPath(session.user.role, session.user.covenantSigned, session.user.readinessComplete),
        req.url
      )
    );
  }

  // Protected routes — require auth
  if (!session?.user) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const user = session.user;

  // Participant must sign covenant first
  if (user.role === Role.PARTICIPANT && !user.covenantSigned && !pathname.startsWith("/covenant")) {
    return NextResponse.redirect(new URL("/covenant", req.url));
  }

  // Participant must complete readiness assessment before accessing the dashboard
  if (
    user.role === Role.PARTICIPANT &&
    user.covenantSigned &&
    !user.readinessComplete &&
    !pathname.startsWith("/readiness-assessment")
  ) {
    return NextResponse.redirect(new URL("/readiness-assessment", req.url));
  }

  // Role-based route protection
  if (pathname.startsWith("/participant") && !hasAccess(user.role, Role.PARTICIPANT)) {
    return NextResponse.redirect(
      new URL(getDashboardPath(user.role, user.covenantSigned, user.readinessComplete), req.url)
    );
  }
  if (pathname.startsWith("/facilitator") && !hasAccess(user.role, Role.FACILITATOR)) {
    return NextResponse.redirect(
      new URL(getDashboardPath(user.role, user.covenantSigned, user.readinessComplete), req.url)
    );
  }
  if (pathname.startsWith("/program-admin") && !hasAccess(user.role, Role.PROGRAM_ADMIN)) {
    return NextResponse.redirect(
      new URL(getDashboardPath(user.role, user.covenantSigned, user.readinessComplete), req.url)
    );
  }
  if (pathname.startsWith("/super-admin") && !hasAccess(user.role, Role.SUPER_ADMIN)) {
    return NextResponse.redirect(
      new URL(getDashboardPath(user.role, user.covenantSigned, user.readinessComplete), req.url)
    );
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|images|favicon.ico|.*\\.svg|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.webp).*)"],
};

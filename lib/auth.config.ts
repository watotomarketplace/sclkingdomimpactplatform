import type { NextAuthConfig } from "next-auth";
import type { Role } from "@/app/generated/prisma/enums";

/**
 * Edge-safe auth config — no Node.js modules, no DB imports.
 * Used by middleware. Full auth (with Credentials provider) is in lib/auth.ts.
 */
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  callbacks: {
    async jwt({ token, user, session, trigger }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role: Role }).role;
        token.covenantSigned = (user as { covenantSigned: boolean }).covenantSigned;
        token.readinessComplete = (user as { readinessComplete: boolean }).readinessComplete;
        token.onboardingComplete = (user as { onboardingComplete: boolean }).onboardingComplete;
      }
      // Handle session.update() calls — merge any fields passed
      if (trigger === "update" && session) {
        if (session.covenantSigned !== undefined) token.covenantSigned = session.covenantSigned;
        if (session.readinessComplete !== undefined) token.readinessComplete = session.readinessComplete;
        if (session.onboardingComplete !== undefined) token.onboardingComplete = session.onboardingComplete;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
        session.user.covenantSigned = token.covenantSigned as boolean;
        session.user.readinessComplete = token.readinessComplete as boolean;
        session.user.onboardingComplete = token.onboardingComplete as boolean;
      }
      return session;
    },
  },
  providers: [], // Credentials provider added in lib/auth.ts
};

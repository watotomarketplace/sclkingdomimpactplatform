import { Role } from "@/app/generated/prisma/enums";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      covenantSigned: boolean;
      readinessComplete: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    role: Role;
    covenantSigned: boolean;
    readinessComplete: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
    covenantSigned: boolean;
    readinessComplete: boolean;
  }
}

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createVerificationToken } from "@/lib/tokens";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    const user = await db.user.findUnique({ where: { email } });

    if (user && user.emailVerified) {
      const token = await createVerificationToken(email, "password_reset");
      const { devUrl } = await sendPasswordResetEmail(email, user.name, token.token);
      // In dev mode, surface the link so the user can complete the flow
      if (devUrl) {
        return NextResponse.json({ success: true, devUrl });
      }
    }

    // Always return success in production (don't reveal if email exists)
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: true }); // Never reveal errors
  }
}

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateVerificationToken } from "@/lib/tokens";

export async function POST(req: Request) {
  try {
    const { token } = await req.json();
    const record = await validateVerificationToken(token, "email_verification");
    if (!record) {
      return NextResponse.json({ error: "Invalid or expired token." }, { status: 400 });
    }

    await db.user.update({
      where: { email: record.email },
      data: { emailVerified: new Date() },
    });

    await db.verificationToken.delete({ where: { token } });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

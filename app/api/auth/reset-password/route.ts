import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { validateVerificationToken } from "@/lib/tokens";

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json();
    const record = await validateVerificationToken(token, "password_reset");
    if (!record) {
      return NextResponse.json({ error: "Invalid or expired link." }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await db.user.update({
      where: { email: record.email },
      data: { passwordHash },
    });

    await db.verificationToken.delete({ where: { token } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

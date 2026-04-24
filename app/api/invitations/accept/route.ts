import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json();

    const invitation = await db.invitation.findUnique({ where: { token } });
    if (!invitation || invitation.status !== "PENDING" || invitation.expiresAt < new Date()) {
      return NextResponse.json({ error: "Invalid or expired invitation." }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await db.user.create({
      data: {
        email: invitation.email,
        name: invitation.name,
        passwordHash,
        role: invitation.role,
        emailVerified: new Date(), // Invitation means email is verified
        isActive: true,
      },
    });

    await db.invitation.update({
      where: { token },
      data: { status: "ACCEPTED", userId: user.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Accept invitation error:", error);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (!token) return NextResponse.json({ error: "Token required." }, { status: 400 });

  const invitation = await db.invitation.findUnique({ where: { token } });
  if (!invitation) return NextResponse.json({ error: "Invitation not found." }, { status: 404 });
  if (invitation.status === "ACCEPTED") return NextResponse.json({ error: "This invitation has already been used." }, { status: 400 });
  if (invitation.status === "EXPIRED" || invitation.expiresAt < new Date()) {
    return NextResponse.json({ error: "This invitation has expired." }, { status: 400 });
  }

  return NextResponse.json({
    name: invitation.name,
    email: invitation.email,
    role: invitation.role,
  });
}

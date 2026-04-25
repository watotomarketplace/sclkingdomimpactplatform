import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import bcrypt from "bcryptjs";

const schema = z.object({
  name: z.string().min(2).optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8).max(64).optional(),
  category: z.enum(["ENTREPRENEUR", "INTRAPRENEUR"]).optional(),
  calendlyLink: z.string().url().optional().or(z.literal("")),
});

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const data = schema.parse(body);

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, passwordHash: true, role: true },
    });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const userUpdate: Record<string, unknown> = {};
    const profileUpdate: Record<string, unknown> = {};

    // Name update
    if (data.name) {
      userUpdate.name = data.name.trim();
    }

    // Password change — requires current password verification
    if (data.newPassword) {
      if (!data.currentPassword) {
        return NextResponse.json({ error: "Current password is required to set a new password." }, { status: 400 });
      }
      if (!user.passwordHash) {
        return NextResponse.json({ error: "No password set on this account." }, { status: 400 });
      }
      const valid = await bcrypt.compare(data.currentPassword, user.passwordHash);
      if (!valid) {
        return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });
      }
      userUpdate.passwordHash = await bcrypt.hash(data.newPassword, 12);
    }

    // Calendly link (facilitators, admins)
    if (data.calendlyLink !== undefined) {
      userUpdate.calendlyLink = data.calendlyLink || null;
    }

    // Category — participants only
    if (data.category && user.role === "PARTICIPANT") {
      profileUpdate.category = data.category;
    }

    // Apply updates
    const updatedUser = Object.keys(userUpdate).length > 0
      ? await db.user.update({
          where: { id: session.user.id },
          data: userUpdate,
          select: { id: true, name: true, email: true, role: true },
        })
      : await db.user.findUnique({
          where: { id: session.user.id },
          select: { id: true, name: true, email: true, role: true },
        });

    if (Object.keys(profileUpdate).length > 0 && user.role === "PARTICIPANT") {
      await db.participantProfile.update({
        where: { userId: session.user.id },
        data: profileUpdate,
      });
    }

    return NextResponse.json({ user: updatedUser, success: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input." }, { status: 400 });
    }
    console.error("Settings update error:", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

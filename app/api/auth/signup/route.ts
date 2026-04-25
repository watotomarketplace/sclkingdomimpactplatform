import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8).max(64),
  category: z.enum(["ENTREPRENEUR", "INTRAPRENEUR"]).optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = schema.parse(body);

    // Check for existing user
    const existing = await db.user.findUnique({ where: { email: data.email } });
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    // Create account immediately — no email verification required
    await db.user.create({
      data: {
        email: data.email,
        name: data.name,
        passwordHash,
        role: "PARTICIPANT",
        emailVerified: new Date(), // mark verified right away
        participantProfile: {
          create: {
            ...(data.category ? { category: data.category } : {}),
          },
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input." }, { status: 400 });
    }
    console.error("Signup error:", error);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

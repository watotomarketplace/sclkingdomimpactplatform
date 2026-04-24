import { nanoid } from "nanoid";
import { db } from "@/lib/db";

export function generateToken(length = 32): string {
  return nanoid(length);
}

export async function createVerificationToken(email: string, type: "email_verification" | "password_reset") {
  const token = generateToken();
  const expiresAt = new Date(
    Date.now() + (type === "password_reset" ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000)
  ); // 1 hour for reset, 24 hours for verification

  // Delete any existing tokens for this email/type
  await db.verificationToken.deleteMany({ where: { email, type } });

  return db.verificationToken.create({
    data: { email, token, type, expiresAt },
  });
}

export async function validateVerificationToken(token: string, type: string) {
  const record = await db.verificationToken.findUnique({ where: { token } });
  if (!record) return null;
  if (record.type !== type) return null;
  if (record.expiresAt < new Date()) {
    await db.verificationToken.delete({ where: { token } });
    return null;
  }
  return record;
}

export async function createInvitationToken(
  email: string,
  name: string,
  role: "FACILITATOR" | "PROGRAM_ADMIN",
  invitedById: string
) {
  const token = generateToken(48);
  const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000); // 72 hours

  // Expire any previous pending invitations for this email
  await db.invitation.updateMany({
    where: { email, status: "PENDING" },
    data: { status: "EXPIRED" },
  });

  return db.invitation.create({
    data: {
      email,
      name,
      role,
      token,
      invitedById,
      expiresAt,
    },
  });
}

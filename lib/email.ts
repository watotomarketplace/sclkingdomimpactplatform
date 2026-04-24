import { Resend } from "resend";

const FROM = "SCL Platform <onboarding@resend.dev>"; // use resend.dev until custom domain is verified
const APP_URL = process.env.AUTH_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";

type EmailResult = { devUrl?: string };

async function trySend(to: string, subject: string, html: string, devUrl: string): Promise<EmailResult> {
  const key = process.env.RESEND_API_KEY;

  // Dev mode: no key, placeholder key, or empty string
  const isDevMode = !key || key === "re_REPLACE_WITH_RESEND_KEY" || key.trim() === "";

  if (isDevMode) {
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📧 [DEV EMAIL] To: ${to}`);
    console.log(`   Subject: ${subject}`);
    console.log(`   Link: ${devUrl}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
    return { devUrl };
  }

  // Lazy-initialize Resend only at runtime, never at module evaluation time
  const resend = new Resend(key);

  try {
    await resend.emails.send({ from: FROM, to, subject, html });
    return {};
  } catch (err) {
    console.error("[Email send failed]", err);
    // Fallback: return the URL so the caller can surface it
    return { devUrl };
  }
}

// ─── Email templates ─────────────────────────────────────────────────────────

export async function sendVerificationEmail(
  email: string,
  name: string,
  token: string
): Promise<EmailResult> {
  const verifyUrl = `${APP_URL}/verify-email?token=${token}`;
  return trySend(
    email,
    "Verify your SCL Platform account",
    `
    <div style="font-family:'DM Sans',Arial,sans-serif;max-width:560px;margin:0 auto;background:#fff;border:1px solid #E5E5E5;border-radius:10px;padding:40px;">
      <div style="width:36px;height:36px;background:#0A0A0A;border-radius:8px;display:flex;align-items:center;justify-content:center;margin-bottom:20px;">
        <span style="color:#fff;font-size:16px;font-weight:700;">S</span>
      </div>
      <h2 style="font-family:Georgia,serif;color:#0A0A0A;margin-top:0;font-size:22px;">Welcome to SCL, ${name.split(" ")[0]}.</h2>
      <p style="color:#6B6B67;line-height:1.6;">You're almost ready to begin your Kingdom Impact Work journey. Please verify your email address to activate your account.</p>
      <a href="${verifyUrl}" style="display:inline-block;background:#0A0A0A;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:500;margin:24px 0;">Verify Email Address</a>
      <p style="color:#9CA3AF;font-size:13px;">This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.</p>
    </div>
    `,
    verifyUrl
  );
}

export async function sendPasswordResetEmail(
  email: string,
  name: string,
  token: string
): Promise<EmailResult> {
  const resetUrl = `${APP_URL}/reset-password?token=${token}`;
  return trySend(
    email,
    "Reset your SCL Platform password",
    `
    <div style="font-family:'DM Sans',Arial,sans-serif;max-width:560px;margin:0 auto;background:#fff;border:1px solid #E5E5E5;border-radius:10px;padding:40px;">
      <div style="width:36px;height:36px;background:#0A0A0A;border-radius:8px;display:flex;align-items:center;justify-content:center;margin-bottom:20px;">
        <span style="color:#fff;font-size:16px;font-weight:700;">S</span>
      </div>
      <h2 style="font-family:Georgia,serif;color:#0A0A0A;margin-top:0;font-size:22px;">Password Reset</h2>
      <p style="color:#6B6B67;line-height:1.6;">Hi ${name.split(" ")[0]}, we received a request to reset your password.</p>
      <a href="${resetUrl}" style="display:inline-block;background:#0A0A0A;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:500;margin:24px 0;">Reset Password</a>
      <p style="color:#9CA3AF;font-size:13px;">This link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email.</p>
    </div>
    `,
    resetUrl
  );
}

export async function sendInvitationEmail(
  email: string,
  name: string,
  role: string,
  token: string,
  invitedByName: string
): Promise<EmailResult> {
  const setupUrl = `${APP_URL}/setup-account?token=${token}`;
  const roleLabel = role === "FACILITATOR" ? "Facilitator" : "Program Admin";
  return trySend(
    email,
    `You've been invited to join SCL as a ${roleLabel}`,
    `
    <div style="font-family:'DM Sans',Arial,sans-serif;max-width:560px;margin:0 auto;background:#fff;border:1px solid #E5E5E5;border-radius:10px;padding:40px;">
      <div style="width:36px;height:36px;background:#0A0A0A;border-radius:8px;display:flex;align-items:center;justify-content:center;margin-bottom:20px;">
        <span style="color:#fff;font-size:16px;font-weight:700;">S</span>
      </div>
      <h2 style="font-family:Georgia,serif;color:#0A0A0A;margin-top:0;font-size:22px;">You're Invited</h2>
      <p style="color:#6B6B67;line-height:1.6;">Hi ${name.split(" ")[0]}, <strong>${invitedByName}</strong> has invited you to join the SCL Kingdom Impact Work Platform as a <strong>${roleLabel}</strong>.</p>
      <a href="${setupUrl}" style="display:inline-block;background:#0A0A0A;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:500;margin:24px 0;">Set Up Your Account</a>
      <p style="color:#9CA3AF;font-size:13px;">This invitation expires in 72 hours.</p>
    </div>
    `,
    setupUrl
  );
}

export async function sendGateApprovedEmail(
  email: string,
  name: string,
  month: number
): Promise<EmailResult> {
  const url = `${APP_URL}/participant`;
  return trySend(
    email,
    `Gate ${month} approved — Month ${month + 1} is now unlocked`,
    `
    <div style="font-family:'DM Sans',Arial,sans-serif;max-width:560px;margin:0 auto;background:#fff;border:1px solid #E5E5E5;border-radius:10px;padding:40px;">
      <h2 style="font-family:Georgia,serif;color:#0A0A0A;margin-top:0;font-size:22px;">Gate ${month} Approved</h2>
      <p style="color:#6B6B67;line-height:1.6;">Well done, ${name.split(" ")[0]}. Your Gate ${month} submission has been approved. Month ${month + 1} is now unlocked and ready for you.</p>
      <a href="${url}" style="display:inline-block;background:#0A0A0A;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:500;margin:24px 0;">Continue Your Journey</a>
    </div>
    `,
    url
  );
}

export async function sendGateRevisionEmail(
  email: string,
  name: string,
  month: number,
  feedback: string
): Promise<EmailResult> {
  const url = `${APP_URL}/participant`;
  return trySend(
    email,
    `Revision requested for Gate ${month}`,
    `
    <div style="font-family:'DM Sans',Arial,sans-serif;max-width:560px;margin:0 auto;background:#fff;border:1px solid #E5E5E5;border-radius:10px;padding:40px;">
      <h2 style="font-family:Georgia,serif;color:#0A0A0A;margin-top:0;font-size:22px;">Revision Requested</h2>
      <p style="color:#6B6B67;line-height:1.6;">Hi ${name.split(" ")[0]}, your facilitator has reviewed your Gate ${month} submission and requested some revisions.</p>
      <div style="background:#F7F7F5;border-left:3px solid #C8973A;padding:16px;border-radius:0 8px 8px 0;margin:24px 0;">
        <p style="color:#0A0A0A;margin:0;font-size:14px;">${feedback}</p>
      </div>
      <a href="${url}" style="display:inline-block;background:#0A0A0A;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:500;margin:24px 0;">Review and Resubmit</a>
    </div>
    `,
    url
  );
}

export async function sendGateSlaReminderEmail(
  facilitatorEmail: string,
  facilitatorName: string,
  participantName: string,
  month: number,
  daysPending: number
): Promise<EmailResult> {
  const url = `${APP_URL}/facilitator/gate-reviews`;
  return trySend(
    facilitatorEmail,
    `Reminder: Gate ${month} review pending for ${participantName} (${daysPending} days)`,
    `
    <div style="font-family:'DM Sans',Arial,sans-serif;max-width:560px;margin:0 auto;background:#fff;border:1px solid #E5E5E5;border-radius:10px;padding:40px;">
      <h2 style="font-family:Georgia,serif;color:#0A0A0A;margin-top:0;font-size:22px;">Gate Review Reminder</h2>
      <p style="color:#6B6B67;line-height:1.6;">Hi ${facilitatorName.split(" ")[0]}, a gate review has been waiting for your attention for <strong>${daysPending} days</strong>.</p>
      <div style="background:#F7F7F5;border-left:3px solid #C8973A;padding:16px;border-radius:0 8px 8px 0;margin:24px 0;">
        <p style="color:#0A0A0A;margin:0;font-size:14px;"><strong>${participantName}</strong> — Gate ${month} Review</p>
      </div>
      <a href="${url}" style="display:inline-block;background:#0A0A0A;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:500;margin:24px 0;">Review Now</a>
    </div>
    `,
    url
  );
}

export async function sendGateSlaEscalationEmail(
  adminEmail: string,
  adminName: string,
  participantName: string,
  facilitatorName: string,
  month: number,
  daysPending: number
): Promise<EmailResult> {
  const url = `${APP_URL}/program-admin/gate-reviews`;
  return trySend(
    adminEmail,
    `Escalation: Gate ${month} review overdue for ${participantName} (${daysPending} days)`,
    `
    <div style="font-family:'DM Sans',Arial,sans-serif;max-width:560px;margin:0 auto;background:#fff;border:1px solid #E5E5E5;border-radius:10px;padding:40px;">
      <h2 style="font-family:Georgia,serif;color:#DC2626;margin-top:0;font-size:22px;">Gate Review Overdue</h2>
      <p style="color:#6B6B67;line-height:1.6;">Hi ${adminName.split(" ")[0]}, a gate review has been overdue for <strong>${daysPending} days</strong> and requires your attention.</p>
      <div style="background:#F7F7F5;border-left:3px solid #DC2626;padding:16px;border-radius:0 8px 8px 0;margin:24px 0;">
        <p style="color:#0A0A0A;margin:0;font-size:14px;"><strong>${participantName}</strong> — Gate ${month} Review</p>
        <p style="color:#6B6B67;margin:4px 0 0;font-size:13px;">Assigned facilitator: ${facilitatorName}</p>
      </div>
      <a href="${url}" style="display:inline-block;background:#DC2626;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:500;margin:24px 0;">View Gate Reviews</a>
    </div>
    `,
    url
  );
}

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { hasAccess } from "@/lib/roles";
import { Role } from "@/app/generated/prisma/client";
import { Card, CardLabel } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { InviteFacilitatorForm } from "@/components/program-admin/invite-facilitator-form";
import { ResendInviteButton } from "@/components/program-admin/resend-invite-button";
import { ProgressBar } from "@/components/ui/progress";
import { Tooltip } from "@/components/ui/tooltip";

export default async function ProgramAdminsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!hasAccess(session.user.role, Role.SUPER_ADMIN)) redirect("/");

  const programAdmins = await db.user.findMany({
    where: { role: "PROGRAM_ADMIN" },
    orderBy: { createdAt: "desc" },
  });

  const [pendingInvites, expiredInvites] = await Promise.all([
    db.invitation.findMany({
      where: { role: "PROGRAM_ADMIN", status: "PENDING" },
      orderBy: { createdAt: "desc" },
    }),
    db.invitation.findMany({
      where: { role: "PROGRAM_ADMIN", status: "EXPIRED" },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const count = programAdmins.length;
  const MAX = 5;

  return (
    <div className="px-6 py-6 max-w-[780px]">
      <div className="mb-6">
        <h1 className="font-display text-[28px] font-semibold text-text-primary">Program Admins</h1>
        <p className="text-text-secondary text-sm mt-1">{count} of {MAX} accounts used</p>
      </div>

      {/* Usage indicator */}
      <Card className="mb-6">
        <CardLabel>PROGRAM ADMIN ACCOUNTS</CardLabel>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <ProgressBar value={count} max={MAX} showLabel />
          </div>
          <span className="text-[13px] text-text-secondary font-mono">{count}/{MAX}</span>
        </div>
        {count >= MAX && (
          <p className="text-xs text-accent-warning mt-2">Maximum of 5 Program Admin accounts reached. Deactivate one to create another.</p>
        )}
      </Card>

      {/* Invite form — disabled if at cap */}
      {count < MAX ? (
        <InviteFacilitatorForm role="PROGRAM_ADMIN" />
      ) : (
        <Card className="mb-6 opacity-60">
          <p className="text-sm text-text-secondary text-center py-4">
            Program Admin limit reached (5/5). Deactivate an account to invite a new one.
          </p>
        </Card>
      )}

      {/* Pending invitations */}
      {pendingInvites.length > 0 && (
        <div className="mb-6">
          <p className="section-label mb-3">PENDING INVITATIONS</p>
          <div className="space-y-2">
            {pendingInvites.map((inv) => (
              <Card key={inv.id} padding="sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[14px] font-medium text-text-primary">{inv.name}</p>
                    <p className="text-xs text-text-secondary">
                      {inv.email} · Invited {formatDate(inv.createdAt)} · Expires {formatDate(inv.expiresAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <ResendInviteButton invitationId={inv.id} />
                    <Badge variant="gold">Pending</Badge>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Expired invitations */}
      {expiredInvites.length > 0 && (
        <div className="mb-6">
          <p className="section-label mb-3">EXPIRED INVITATIONS</p>
          <div className="space-y-2">
            {expiredInvites.map((inv) => (
              <Card key={inv.id} padding="sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[14px] font-medium text-text-primary">{inv.name}</p>
                    <p className="text-xs text-text-secondary">{inv.email} · Expired {formatDate(inv.expiresAt)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <ResendInviteButton invitationId={inv.id} />
                    <Badge variant="locked">Expired</Badge>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Active accounts */}
      <p className="section-label mb-3">PROGRAM ADMINS</p>
      {programAdmins.length === 0 ? (
        <Card className="py-8 text-center">
          <p className="text-text-secondary text-sm">No Program Admins yet.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {programAdmins.map((pa) => (
            <Card key={pa.id} padding="sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[14px] font-medium text-text-primary">{pa.name}</p>
                  <p className="text-xs text-text-secondary">{pa.email} · Joined {formatDate(pa.createdAt)}</p>
                </div>
                <Badge variant={pa.isActive ? "on-track" : "locked"}>
                  {pa.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

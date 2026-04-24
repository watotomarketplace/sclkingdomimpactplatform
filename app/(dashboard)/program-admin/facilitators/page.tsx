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
import Link from "next/link";

export default async function FacilitatorsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!hasAccess(session.user.role, Role.PROGRAM_ADMIN)) redirect("/");

  const facilitators = await db.user.findMany({
    where: { role: "FACILITATOR" },
    include: { facilitatedPods: { include: { members: true } } },
    orderBy: { createdAt: "desc" },
  });

  const [pendingInvites, expiredInvites] = await Promise.all([
    db.invitation.findMany({
      where: { role: "FACILITATOR", status: "PENDING" },
      orderBy: { createdAt: "desc" },
    }),
    db.invitation.findMany({
      where: { role: "FACILITATOR", status: "EXPIRED" },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  return (
    <div className="px-6 py-6 max-w-[780px]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-[28px] font-semibold text-text-primary">Facilitators</h1>
          <p className="text-text-secondary text-sm mt-1">{facilitators.length} facilitators</p>
        </div>
      </div>

      {/* Invite form */}
      <InviteFacilitatorForm />

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

      {/* Active facilitators */}
      <p className="section-label mb-3">ACTIVE FACILITATORS</p>
      {facilitators.length === 0 ? (
        <Card className="py-8 text-center">
          <p className="text-text-secondary text-sm">No facilitators yet. Invite one above.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {facilitators.map((f) => (
            <Card key={f.id} padding="sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[14px] font-medium text-text-primary">{f.name}</p>
                  <p className="text-xs text-text-secondary">{f.email}</p>
                  <p className="text-xs text-text-secondary mt-0.5">
                    {f.facilitatedPods.length} pod(s) · {f.facilitatedPods.reduce((sum, p) => sum + p.members.length, 0)} participants
                  </p>
                </div>
                <Badge variant="on-track">Active</Badge>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

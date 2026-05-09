import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { hasAccess } from "@/lib/roles";
import { Role } from "@/app/generated/prisma/enums";
import { Bell } from "lucide-react";

export default async function NotificationsLogPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!hasAccess(session.user.role, Role.SUPER_ADMIN)) redirect("/");

  const notifications = await db.notification.findMany({
    include: { user: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="min-h-full px-4 py-5 md:px-6 md:py-6 max-w-[820px]">
      <div className="flex items-start gap-4 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-bg-base border border-border flex items-center justify-center shrink-0">
          <Bell size={22} className="text-text-secondary" />
        </div>
        <div>
          <h1 className="font-display text-[22px] md:text-[26px] font-semibold text-text-primary">Notifications Log</h1>
          <p className="text-text-secondary text-[13px] mt-1">
            {notifications.length} total · {unreadCount} unread
          </p>
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="glass-2 p-8 text-center">
          <Bell size={28} className="text-[#A3A3A3] mx-auto mb-3" />
          <p className="text-text-secondary text-[14px]">No notifications sent yet.</p>
        </div>
      ) : (
        <div className="glass-2 overflow-hidden">
          <div className="divide-y divide-white/[0.05]">
            {notifications.map((n) => (
              <div key={n.id} className={`px-4 py-3 flex items-start gap-3 ${!n.isRead ? "bg-bg-base" : ""}`}>
                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${!n.isRead ? "bg-[#C8973A]" : "bg-bg-base"}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className="text-[13px] font-medium text-text-primary truncate">
                      {n.user.name ?? n.user.email}
                    </span>
                    <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-bg-base text-[#A3A3A3]">
                      {n.type}
                    </span>
                  </div>
                  <p className="text-[12px] text-text-secondary leading-relaxed">{n.message}</p>
                  {n.link && (
                    <a href={n.link} className="text-[11px] text-[#C8973A] hover:underline mt-0.5 inline-block">
                      {n.link}
                    </a>
                  )}
                </div>
                <span className="text-[10px] text-[#A3A3A3] shrink-0 whitespace-nowrap">
                  {new Date(n.createdAt).toLocaleDateString("en-GB", {
                    day: "numeric", month: "short",
                  })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { Topbar } from "@/components/layout/topbar";
import { Sidebar } from "@/components/layout/sidebar";
import { BottomTabNav } from "@/components/layout/bottom-tab-nav";
import { Role, MilestoneType } from "@/app/generated/prisma/enums";

interface DashboardShellProps {
  children: React.ReactNode;
  // Topbar
  userName: string;
  userRole: string;
  notificationCount?: number;
  // Sidebar
  role: Role;
  unlockedMilestones?: MilestoneType[];
  pendingGates?: number;
  redFlags?: number;
}

export function DashboardShell({
  children,
  userName,
  userRole,
  notificationCount = 0,
  role,
  unlockedMilestones = [MilestoneType.ONBOARDING],
  pendingGates = 0,
  redFlags = 0,
}: DashboardShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close sidebar when route changes
  useEffect(() => {
    const close = () => setMobileOpen(false);
    window.addEventListener("popstate", close);
    return () => window.removeEventListener("popstate", close);
  }, []);

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const showBottomNav = role === Role.PARTICIPANT || role === Role.GROUP_LEADER;

  return (
    <div className="h-full flex flex-col bg-bg-base">
      <Topbar
        userName={userName}
        userRole={userRole}
        notificationCount={notificationCount}
        // Participant-family users use bottom nav on mobile — no hamburger
        onMenuToggle={!showBottomNav ? () => setMobileOpen(prev => !prev) : undefined}
        mobileMenuOpen={mobileOpen}
      />

      <div className="flex flex-1 overflow-hidden relative">
        {/* Mobile overlay backdrop with blur — Addendum 3 */}
        {mobileOpen && (
          <div
            className="fixed inset-0 bg-black/30 z-20 md:hidden fade-in"
            onClick={() => setMobileOpen(false)}
          />
        )}

        <Sidebar
          role={role}
          unlockedMilestones={unlockedMilestones}
          pendingGates={pendingGates}
          redFlags={redFlags}
          mobileOpen={mobileOpen}
          onClose={() => setMobileOpen(false)}
        />

        <main className={`flex-1 overflow-y-auto ${showBottomNav ? "pb-20 md:pb-0" : ""}`}>
          {children}
        </main>
      </div>

      {/* Bottom tab nav — participants/group leaders only, mobile only */}
      {showBottomNav && <BottomTabNav role={role} />}
    </div>
  );
}

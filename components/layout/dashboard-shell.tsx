"use client";

import { useState, useEffect } from "react";
import { Topbar } from "@/components/layout/topbar";
import { Sidebar } from "@/components/layout/sidebar";
import { BottomTabNav } from "@/components/layout/bottom-tab-nav";
import { Role } from "@/app/generated/prisma/enums";

interface DashboardShellProps {
  children: React.ReactNode;
  // Topbar
  userName: string;
  userRole: string;
  notificationCount?: number;
  // Sidebar
  role: Role;
  currentMonth?: number;
  unlockedMonths?: number[];
  pendingGates?: number;
  redFlags?: number;
}

export function DashboardShell({
  children,
  userName,
  userRole,
  notificationCount = 0,
  role,
  currentMonth = 1,
  unlockedMonths = [1],
  pendingGates = 0,
  redFlags = 0,
}: DashboardShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close sidebar when route changes (listens for popstate / Next.js nav)
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

  return (
    <div className="h-full flex flex-col">
      <Topbar
        userName={userName}
        userRole={userRole}
        notificationCount={notificationCount}
        // Participants use bottom tab nav on mobile — no hamburger needed
        onMenuToggle={role !== Role.PARTICIPANT ? () => setMobileOpen(prev => !prev) : undefined}
        mobileMenuOpen={mobileOpen}
      />

      <div className="flex flex-1 overflow-hidden relative">
        {/* Mobile overlay backdrop */}
        {mobileOpen && (
          <div
            className="fixed inset-0 bg-black/60 z-20 md:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}

        <Sidebar
          role={role}
          currentMonth={currentMonth}
          unlockedMonths={unlockedMonths}
          pendingGates={pendingGates}
          redFlags={redFlags}
          mobileOpen={mobileOpen}
          onClose={() => setMobileOpen(false)}
        />

        <main className={`flex-1 overflow-y-auto ${role === Role.PARTICIPANT ? "pb-16 md:pb-0" : ""}`}>
          {children}
        </main>
      </div>

      {/* Bottom tab nav — participants only, mobile only */}
      {role === Role.PARTICIPANT && <BottomTabNav />}
    </div>
  );
}

"use client";

import { useState } from "react";
import { Settings, LogOut, ChevronDown } from "lucide-react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { NotificationPanel } from "@/components/layout/notification-panel";

interface TopbarProps {
  pageTitle?: string;
  userName: string;
  userRole: string;
  notificationCount?: number;
}

export function Topbar({ pageTitle, userName, userRole, notificationCount = 0 }: TopbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const initials = userName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  void notificationCount; // prop kept for backward compatibility

  return (
    <header className="h-13 bg-white border-b border-border flex items-center px-5 gap-4 shrink-0 z-10">
      {/* Spacer where sidebar logo lives */}
      <div className="w-[196px] shrink-0 hidden md:block" />

      {/* Page title */}
      {pageTitle && (
        <h1 className="text-[15px] font-semibold text-text-primary flex-1 truncate">{pageTitle}</h1>
      )}
      {!pageTitle && <div className="flex-1" />}

      {/* Actions */}
      <div className="flex items-center gap-1">
        {/* Notifications */}
        <NotificationPanel />

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-md hover:bg-bg-base transition-colors"
          >
            <div className="w-7 h-7 bg-[#0A0A0A] rounded-full flex items-center justify-center">
              <span className="text-white text-[11px] font-semibold">{initials}</span>
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-[13px] font-medium text-text-primary leading-none">{userName.split(" ")[0]}</p>
              <p className="text-[11px] text-text-secondary">{userRole}</p>
            </div>
            <ChevronDown size={14} className="text-text-secondary" />
          </button>

          {menuOpen && (
            <div
              className="absolute right-0 top-full mt-1 w-48 bg-white border border-border rounded-lg shadow-lg py-1 z-50"
              onMouseLeave={() => setMenuOpen(false)}
            >
              <div className="px-3 py-2 border-b border-border">
                <p className="text-[13px] font-medium text-text-primary">{userName}</p>
                <p className="text-[11px] text-text-secondary">{userRole}</p>
              </div>
              <Link
                href="/settings"
                className="flex items-center gap-2 px-3 py-2 text-[13px] text-text-primary hover:bg-bg-base transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                <Settings size={14} />
                Settings
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="flex items-center gap-2 w-full px-3 py-2 text-[13px] text-accent-danger hover:bg-bg-base transition-colors"
              >
                <LogOut size={14} />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

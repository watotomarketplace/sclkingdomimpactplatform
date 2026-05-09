"use client";

import { useState } from "react";
import { Settings, LogOut, ChevronDown, Menu, X } from "lucide-react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { NotificationPanel } from "@/components/layout/notification-panel";

interface TopbarProps {
  pageTitle?: string;
  userName: string;
  userRole: string;
  notificationCount?: number;
  onMenuToggle?: () => void;
  mobileMenuOpen?: boolean;
}

export function Topbar({
  pageTitle,
  userName,
  userRole,
  notificationCount = 0,
  onMenuToggle,
  mobileMenuOpen = false,
}: TopbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const initials = userName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  void notificationCount;

  return (
    <header className="h-14 bg-white border-b border-border flex items-center px-3 md:px-5 gap-2 md:gap-4 shrink-0 z-10">

      {onMenuToggle && (
        <button
          onClick={onMenuToggle}
          className="md:hidden flex items-center justify-center w-9 h-9 rounded-md text-text-secondary hover:bg-bg-base hover:text-text-primary transition-colors shrink-0"
          aria-label="Toggle navigation"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      )}

      {/* Desktop: spacer aligned with sidebar */}
      <div className="w-[196px] shrink-0 hidden md:block" />

      {pageTitle ? (
        <h1 className="text-[15px] font-semibold text-text-primary flex-1 truncate">{pageTitle}</h1>
      ) : (
        <div className="flex-1" />
      )}

      <div className="flex items-center gap-1">
        <NotificationPanel />

        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-1.5 md:gap-2 pl-1.5 pr-1 py-1 rounded-md hover:bg-bg-base transition-colors"
          >
            <div className="w-7 h-7 bg-[#0A0A0A] rounded-full flex items-center justify-center shrink-0">
              <span className="text-white text-[11px] font-semibold">{initials}</span>
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-[13px] font-medium text-text-primary leading-none">{userName.split(" ")[0]}</p>
              <p className="text-[11px] text-text-secondary">{userRole}</p>
            </div>
            <ChevronDown size={13} className="text-text-secondary hidden sm:block" />
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-border rounded-xl shadow-lg py-1 z-50 scale-in">
                <div className="px-3 py-2 border-b border-border">
                  <p className="text-[13px] font-medium text-text-primary truncate">{userName}</p>
                  <p className="text-[11px] text-text-secondary">{userRole}</p>
                </div>
                <Link
                  href="/settings"
                  className="flex items-center gap-2 px-3 py-2.5 text-[13px] text-text-primary hover:bg-bg-base transition-colors"
                  onClick={() => setMenuOpen(false)}
                >
                  <Settings size={14} />
                  Settings
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="flex items-center gap-2 w-full px-3 py-2.5 text-[13px] text-accent-danger hover:bg-bg-base transition-colors"
                >
                  <LogOut size={14} />
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

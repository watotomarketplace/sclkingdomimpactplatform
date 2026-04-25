"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, BookOpen, Users, Video, User } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS: { label: string; href: string; icon: React.ElementType; exact?: boolean }[] = [
  { label: "Home", href: "/participant", icon: LayoutDashboard, exact: true },
  { label: "Journey", href: "/participant/journey", icon: BookOpen },
  { label: "Group", href: "/participant/pod", icon: Users },
  { label: "Coaching", href: "/participant/coaching", icon: Video },
  { label: "Profile", href: "/participant/scorecard", icon: User },
];

export function BottomTabNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-border safe-bottom">
      <div className="flex items-stretch h-[56px]">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.exact
            ? pathname === tab.href
            : pathname.startsWith(tab.href);

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors",
                isActive ? "text-accent-primary" : "text-text-secondary"
              )}
            >
              <Icon
                size={20}
                className={cn(
                  "transition-colors",
                  isActive ? "text-accent-primary" : "text-text-secondary"
                )}
                strokeWidth={isActive ? 2.5 : 1.8}
              />
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

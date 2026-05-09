"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Compass, Users, Video, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Role } from "@/app/generated/prisma/enums";

interface BottomTabNavProps {
  role: Role;
}

/**
 * Addendum 3: 5-tab mobile bottom navigation for Participants and Group Leaders.
 * Glass tier 1 fixed at the bottom of the viewport.
 */
export function BottomTabNav({ role }: BottomTabNavProps) {
  const pathname = usePathname();

  const isGroupLeader = role === Role.GROUP_LEADER;

  const TABS: { label: string; href: string; icon: React.ElementType; exact?: boolean }[] = [
    { label: "Home", href: isGroupLeader ? "/group-leader" : "/participant", icon: LayoutDashboard, exact: true },
    { label: "Journey", href: "/participant/journey/onboarding", icon: Compass },
    {
      label: "Group",
      href: isGroupLeader ? "/group-leader/meeting-summary" : "/participant/problem-log",
      icon: Users,
    },
    { label: "Coaching", href: "/participant/coaching", icon: Video },
    { label: "Profile", href: "/settings", icon: User },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 glass-1 border-t border-border safe-bottom">
      <div className="flex items-stretch h-[56px]">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.exact
            ? pathname === tab.href
            : pathname.startsWith(tab.href.split("?")[0]);

          return (
            <Link
              key={tab.href + tab.label}
              href={tab.href}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors",
                isActive ? "text-[#C8973A]" : "text-text-secondary"
              )}
            >
              <Icon
                size={20}
                className={cn(
                  "transition-colors",
                  isActive ? "text-[#C8973A]" : "text-text-secondary"
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

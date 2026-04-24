"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, BookOpen, Target, BookMarked, Users,
  ClipboardCheck, MessageSquare, AlertTriangle, BarChart3,
  UserCheck, Building2, Shield, Settings, ScrollText,
  ChevronRight, Lock, CheckCircle2, FileText, PlusCircle,
  Layers, CalendarDays, ClipboardList
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Role } from "@/app/generated/prisma/enums";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
  locked?: boolean;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

function getParticipantNav(currentMonth: number, unlockedMonths: number[]): NavGroup[] {
  const months = [
    { num: 1, label: "Discovery" },
    { num: 2, label: "MVP Design" },
    { num: 3, label: "Prototype" },
    { num: 4, label: "Pilot" },
    { num: 5, label: "Launch" },
    { num: 6, label: "Impact" },
  ];

  return [
    {
      label: "MY JOURNEY",
      items: [
        { label: "Dashboard", href: "/participant", icon: LayoutDashboard },
        ...months.map((m) => ({
          label: `Month ${m.num} — ${m.label}`,
          href: `/participant/journey/month-${m.num}`,
          icon: m.num <= (currentMonth) ? BookOpen : Lock,
          locked: !unlockedMonths.includes(m.num) && m.num !== 1,
        })),
      ],
    },
    {
      label: "TOOLS",
      items: [
        { label: "My Scorecard", href: "/participant/scorecard", icon: Target },
        { label: "Kingdom Journal", href: "/participant/journal", icon: BookMarked },
        { label: "Pod Accountability", href: "/participant/pod", icon: Users },
        { label: "Readiness Assessment", href: "/participant/readiness-assessment", icon: ClipboardList },
      ],
    },
  ];
}

function getFacilitatorNav(pendingGates: number, redFlags: number): NavGroup[] {
  return [
    {
      label: "MY PODS",
      items: [
        { label: "Pod Overview", href: "/facilitator", icon: LayoutDashboard },
        { label: "Gate Reviews", href: "/facilitator/gate-reviews", icon: ClipboardCheck, badge: pendingGates },
        { label: "Coaching Notes", href: "/facilitator/coaching-notes", icon: MessageSquare },
      ],
    },
    {
      label: "PROGRAM",
      items: [
        { label: "Cohort Progress", href: "/facilitator/cohort-progress", icon: BarChart3 },
        { label: "Scorecards", href: "/facilitator/scorecards", icon: Target },
        { label: "Red Flags", href: "/facilitator/red-flags", icon: AlertTriangle, badge: redFlags },
      ],
    },
  ];
}

function getProgramAdminNav(pendingGates: number, redFlags: number): NavGroup[] {
  return [
    {
      label: "MY PODS",
      items: [
        { label: "Pod Overview", href: "/program-admin/pods-overview", icon: LayoutDashboard },
        { label: "Gate Reviews", href: "/program-admin/gate-reviews", icon: ClipboardCheck, badge: pendingGates },
        { label: "Coaching Notes", href: "/program-admin/coaching-notes", icon: MessageSquare },
        { label: "Cohort Progress", href: "/program-admin/cohort-progress", icon: BarChart3 },
        { label: "Scorecards", href: "/program-admin/scorecards", icon: Target },
        { label: "Red Flags", href: "/program-admin/red-flags", icon: AlertTriangle, badge: redFlags },
      ],
    },
    {
      label: "PROGRAM MANAGEMENT",
      items: [
        { label: "Cohort Dashboard", href: "/program-admin", icon: Layers },
        { label: "Participants", href: "/program-admin/participants", icon: Users },
        { label: "Facilitators", href: "/program-admin/facilitators", icon: UserCheck },
        { label: "Pods", href: "/program-admin/pods", icon: Building2 },
        { label: "Cohorts", href: "/program-admin/cohorts", icon: CalendarDays },
      ],
    },
    {
      label: "ACCOUNTS",
      items: [
        { label: "Create Facilitator", href: "/program-admin/facilitators/new", icon: PlusCircle },
        { label: "Manage Users", href: "/program-admin/users", icon: Settings },
      ],
    },
    {
      label: "REPORTS",
      items: [
        { label: "Progress Report", href: "/program-admin/reports/progress", icon: BarChart3 },
        { label: "Gate Summary", href: "/program-admin/reports/gates", icon: FileText },
      ],
    },
  ];
}

function getSuperAdminNav(pendingGates: number, redFlags: number): NavGroup[] {
  return [
    ...getProgramAdminNav(pendingGates, redFlags),
    {
      label: "PLATFORM",
      items: [
        { label: "Overview", href: "/super-admin", icon: Shield },
        { label: "Program Admins", href: "/super-admin/program-admins", icon: UserCheck },
        { label: "All Users", href: "/super-admin/all-users", icon: Users },
        { label: "System Settings", href: "/super-admin/settings", icon: Settings },
        { label: "Audit Log", href: "/super-admin/audit-log", icon: ScrollText },
      ],
    },
  ];
}

interface SidebarProps {
  role: Role;
  currentMonth?: number;
  unlockedMonths?: number[];
  pendingGates?: number;
  redFlags?: number;
}

export function Sidebar({ role, currentMonth = 1, unlockedMonths = [1], pendingGates = 0, redFlags = 0 }: SidebarProps) {
  const pathname = usePathname();

  const navGroups = (() => {
    switch (role) {
      case Role.PARTICIPANT:
        return getParticipantNav(currentMonth, unlockedMonths);
      case Role.FACILITATOR:
        return getFacilitatorNav(pendingGates, redFlags);
      case Role.PROGRAM_ADMIN:
        return getProgramAdminNav(pendingGates, redFlags);
      case Role.SUPER_ADMIN:
        return getSuperAdminNav(pendingGates, redFlags);
      default:
        return [];
    }
  })();

  return (
    <aside className="w-[196px] shrink-0 bg-[#0A0A0A] h-full flex flex-col pt-5 pb-4 overflow-y-auto">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 mb-6">
        <div className="w-7 h-7 bg-white rounded-md flex items-center justify-center">
          <span className="text-[#0A0A0A] text-xs font-bold font-display">S</span>
        </div>
        <span className="text-[13px] font-semibold text-white/90">SCL Platform</span>
      </div>

      {navGroups.map((group) => (
        <div key={group.label} className="mb-5">
          <p className="px-4 mb-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-white/30">
            {group.label}
          </p>
          {group.items.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href + "/") && item.href !== "/participant" && item.href !== "/facilitator" && item.href !== "/program-admin" && item.href !== "/super-admin");
            const isExactActive = pathname === item.href;
            const active = isActive || isExactActive;

            return (
              <Link
                key={item.href}
                href={item.locked ? "#" : item.href}
                className={cn(
                  "flex items-center gap-2.5 px-4 h-8 text-[13px] transition-colors relative mx-2 rounded-md",
                  active
                    ? "bg-white/10 text-white font-medium"
                    : "text-white/55 hover:text-white/90 hover:bg-white/[0.04]",
                  item.locked && "cursor-not-allowed opacity-30 pointer-events-none",
                )}
                onClick={item.locked ? (e) => e.preventDefault() : undefined}
              >
                <Icon size={14} className="shrink-0" />
                <span className="truncate flex-1">{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="bg-accent-danger text-white text-[10px] font-semibold rounded-full px-1.5 py-0.5 min-w-[18px] text-center leading-none">
                    {item.badge}
                  </span>
                )}
                {item.locked && <Lock size={10} className="shrink-0 opacity-60" />}
              </Link>
            );
          })}
        </div>
      ))}
    </aside>
  );
}

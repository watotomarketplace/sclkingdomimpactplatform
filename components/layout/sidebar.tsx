"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, BookOpen, Target, BookMarked, Users,
  AlertTriangle, BarChart3, UserCheck, Settings, ScrollText,
  Lock, FileText, ClipboardList, Compass, Eye, Search,
  Lightbulb, Hammer, Sparkles, MessageSquare, CalendarDays,
  Upload, Download, Bell, Database, ListChecks, FileCheck,
  Video,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Role, MilestoneType } from "@/app/generated/prisma/enums";

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

/* ──────────────────────────────────────────────────────────────────── */
/* Addendum 3 — Navigation per Section 10                                */
/* ──────────────────────────────────────────────────────────────────── */

function getParticipantNav(unlockedMilestones: MilestoneType[]): NavGroup[] {
  const milestoneIcons: Record<string, React.ElementType> = {
    ONBOARDING: Compass,
    MILESTONE_1: Search,         // UNDERSTAND
    MILESTONE_2: Hammer,         // BUILD
    MILESTONE_3: Hammer,         // BUILD continues
    MILESTONE_4: Sparkles,       // LAUNCH & MEASURE
  };
  const milestoneLabels: Record<string, string> = {
    ONBOARDING: "Onboarding",
    MILESTONE_1: "Milestone 1 — Validation",
    MILESTONE_2: "Milestone 2 — Build & Test",
    MILESTONE_3: "Milestone 3 — Implementation",
    MILESTONE_4: "Milestone 4 — Final",
  };
  const milestoneOrder: MilestoneType[] = [
    MilestoneType.ONBOARDING,
    MilestoneType.MILESTONE_1,
    MilestoneType.MILESTONE_2,
    MilestoneType.MILESTONE_3,
    MilestoneType.MILESTONE_4,
  ];
  const slugFor: Record<string, string> = {
    ONBOARDING: "onboarding",
    MILESTONE_1: "milestone-1",
    MILESTONE_2: "milestone-2",
    MILESTONE_3: "milestone-3",
    MILESTONE_4: "milestone-4",
  };

  return [
    {
      label: "MY JOURNEY",
      items: [
        { label: "Dashboard", href: "/participant", icon: LayoutDashboard },
        { label: "Problem Log", href: "/participant/problem-log", icon: ClipboardList },
        ...milestoneOrder.map((m) => ({
          label: milestoneLabels[m],
          href: `/participant/journey/${slugFor[m]}`,
          icon: unlockedMilestones.includes(m) ? milestoneIcons[m] : Lock,
          locked: !unlockedMilestones.includes(m),
        })),
      ],
    },
    {
      label: "TOOLS",
      items: [
        { label: "My Scorecard", href: "/participant/scorecard", icon: Target },
        { label: "Kingdom Journal", href: "/participant/journal", icon: BookMarked },
      ],
    },
    {
      label: "COACHING",
      items: [
        { label: "Book a session", href: "/participant/coaching/book", icon: CalendarDays },
        { label: "My sessions", href: "/participant/coaching", icon: Video },
      ],
    },
  ];
}

function getGroupLeaderNav(unlockedMilestones: MilestoneType[]): NavGroup[] {
  // Group Leaders see participant nav + their own group section
  return [
    ...getParticipantNav(unlockedMilestones),
    {
      label: "MY GROUP",
      items: [
        { label: "Group Status", href: "/group-leader", icon: Users },
        { label: "Submit Meeting Summary", href: "/group-leader/meeting-summary", icon: FileText },
      ],
    },
  ];
}

function getFacilitatorNav(pendingReviews: number, atRiskCount: number): NavGroup[] {
  return [
    {
      label: "COHORT",
      items: [
        { label: "Overview", href: "/facilitator", icon: LayoutDashboard },
        { label: "Participant List", href: "/facilitator/participants", icon: Users },
        { label: "Late & At Risk", href: "/facilitator/red-flags", icon: AlertTriangle, badge: atRiskCount },
        { label: "Group Summaries", href: "/facilitator/group-summaries", icon: ListChecks },
      ],
    },
    {
      label: "COACHING",
      items: [
        { label: "Upcoming sessions", href: "/facilitator/coaching/upcoming", icon: CalendarDays },
        { label: "Session log", href: "/facilitator/coaching-notes", icon: MessageSquare },
      ],
    },
    {
      label: "MILESTONE REVIEWS",
      items: [
        { label: "Onboarding Reviews", href: "/facilitator/reviews/onboarding", icon: FileCheck, badge: pendingReviews },
        { label: "Milestone 1 Reviews", href: "/facilitator/reviews/milestone-1", icon: Search },
        { label: "Milestone 2 Reviews", href: "/facilitator/reviews/milestone-2", icon: Hammer },
        { label: "Milestone 3 Reviews", href: "/facilitator/reviews/milestone-3", icon: Hammer },
        { label: "Milestone 4 Reviews", href: "/facilitator/reviews/milestone-4", icon: Sparkles },
      ],
    },
  ];
}

function getSuperAdminNav(pendingReviews: number, atRiskCount: number): NavGroup[] {
  return [
    ...getFacilitatorNav(pendingReviews, atRiskCount),
    {
      label: "ADMIN",
      items: [
        { label: "User Management", href: "/super-admin/all-users", icon: Users },
        { label: "Import Participants", href: "/super-admin/import", icon: Upload },
        { label: "Group Assignment", href: "/super-admin/groups", icon: UserCheck },
        { label: "System Settings", href: "/super-admin/settings", icon: Settings },
        { label: "Notifications Log", href: "/super-admin/notifications", icon: Bell },
        { label: "Data Export", href: "/super-admin/export", icon: Download },
        { label: "Presentation Schedule", href: "/super-admin/schedule", icon: CalendarDays },
        { label: "Audit Log", href: "/super-admin/audit-log", icon: ScrollText },
      ],
    },
  ];
}

/* ──────────────────────────────────────────────────────────────────── */

interface SidebarProps {
  role: Role;
  currentMonth?: number;          // legacy prop
  unlockedMonths?: number[];      // legacy prop (months 1-6)
  unlockedMilestones?: MilestoneType[];  // Addendum 3
  pendingGates?: number;
  redFlags?: number;
  mobileOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({
  role,
  unlockedMilestones,
  pendingGates = 0,
  redFlags = 0,
  mobileOpen = false,
  onClose,
}: SidebarProps) {
  const pathname = usePathname();

  // Default: only ONBOARDING is unlocked for new participants
  const milestonesUnlocked: MilestoneType[] =
    unlockedMilestones && unlockedMilestones.length > 0
      ? unlockedMilestones
      : [MilestoneType.ONBOARDING];

  const navGroups = (() => {
    switch (role) {
      case Role.PARTICIPANT:
        return getParticipantNav(milestonesUnlocked);
      case Role.GROUP_LEADER:
        return getGroupLeaderNav(milestonesUnlocked);
      case Role.FACILITATOR:
        return getFacilitatorNav(pendingGates, redFlags);
      case Role.PROGRAM_ADMIN:
      case Role.SUPER_ADMIN:
        return getSuperAdminNav(pendingGates, redFlags);
      default:
        return [];
    }
  })();

  return (
    <aside
      className={cn(
        // Glass tier 1 — Addendum 3
        "bg-bg-sidebar flex flex-col pt-5 pb-4 overflow-y-auto z-30 border-r border-[rgba(255,255,255,0.08)]",
        // Desktop: in normal flex flow
        "md:relative md:w-[196px] md:shrink-0 md:h-full md:translate-x-0 md:transition-none",
        // Mobile: fixed drawer sliding from left
        "fixed top-14 left-0 bottom-0 w-[240px] transition-transform duration-300 ease-in-out",
        mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 mb-6">
        <div className="w-7 h-7 bg-gradient-to-br from-[#C8973A] to-[#A87B2A] rounded-md flex items-center justify-center shadow-lg shadow-[#C8973A]/30">
          <span className="text-white text-xs font-bold font-display">S</span>
        </div>
        <span className="text-[13px] font-semibold text-white">SCL Platform</span>
      </div>

      {navGroups.map((group) => (
        <div key={group.label} className="mb-5">
          <p className="px-4 mb-1.5 text-[10px] font-semibold uppercase tracking-[0.10em] text-white/35">
            {group.label}
          </p>
          {group.items.map((item) => {
            const Icon = item.icon;
            const isExact = pathname === item.href;
            const isActive =
              isExact ||
              (item.href !== "/" &&
                pathname.startsWith(item.href + "/") &&
                ![
                  "/participant",
                  "/group-leader",
                  "/facilitator",
                  "/program-admin",
                  "/super-admin",
                ].includes(item.href));

            return (
              <Link
                key={item.href}
                href={item.locked ? "#" : item.href}
                className={cn(
                  "flex items-center gap-2.5 px-3 h-9 text-[13px] transition-all relative mx-2 rounded-lg",
                  isActive
                    ? "bg-[rgba(200,151,58,0.15)] text-white font-medium border-l-2 border-[#C8973A]"
                    : "text-white/65 hover:text-white hover:bg-white/[0.06]",
                  item.locked && "cursor-not-allowed opacity-30 pointer-events-none"
                )}
                onClick={item.locked ? (e) => e.preventDefault() : () => onClose?.()}
              >
                <Icon size={14} className="shrink-0" />
                <span className="truncate flex-1">{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="bg-[rgba(220,38,38,0.85)] text-white text-[10px] font-semibold rounded-full px-1.5 py-0.5 min-w-[18px] text-center leading-none">
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

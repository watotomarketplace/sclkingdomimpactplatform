"use client";

import { useState } from "react";
import { Card, CardLabel, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CheckCircle2, Lock, User, Link as LinkIcon, Tag } from "lucide-react";

type Category = "ENTREPRENEUR" | "INTRAPRENEUR";

interface SettingsFormProps {
  userId: string;
  initialName: string;
  email: string;
  role: string;
  initialCalendlyLink: string;
  initialCategory: Category | null;
}

function SectionHeader({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) {
  return (
    <div className="flex items-start gap-3 mb-4">
      <div className="w-8 h-8 rounded-lg bg-bg-base border border-border flex items-center justify-center shrink-0 mt-0.5">
        <Icon size={15} className="text-text-secondary" />
      </div>
      <div>
        <h2 className="text-[15px] font-semibold text-text-primary">{title}</h2>
        <p className="text-[13px] text-text-secondary">{description}</p>
      </div>
    </div>
  );
}

function SavedBanner({ message = "Changes saved" }: { message?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[12px] text-emerald-700 font-medium">
      <CheckCircle2 size={13} />
      {message}
    </span>
  );
}

export function SettingsForm({
  initialName,
  email,
  role,
  initialCalendlyLink,
  initialCategory,
}: SettingsFormProps) {
  // Profile section
  const [name, setName] = useState(initialName);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState("");

  // Password section
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  // Category section (participants)
  const [category, setCategory] = useState<Category | null>(initialCategory);
  const [categorySaving, setCategorySaving] = useState(false);
  const [categorySaved, setCategorySaved] = useState(false);

  // Calendly section (non-participants)
  const [calendlyLink, setCalendlyLink] = useState(initialCalendlyLink);
  const [calendlySaving, setCalendlySaving] = useState(false);
  const [calendlySaved, setCalendlySaved] = useState(false);
  const [calendlyError, setCalendlyError] = useState("");

  const patch = async (payload: Record<string, unknown>) => {
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return res;
  };

  const saveProfile = async () => {
    setProfileError("");
    setProfileSaving(true);
    try {
      const res = await patch({ name: name.trim() });
      if (!res.ok) {
        const d = await res.json();
        setProfileError(d.error ?? "Something went wrong.");
      } else {
        setProfileSaved(true);
        setTimeout(() => setProfileSaved(false), 3000);
      }
    } finally {
      setProfileSaving(false);
    }
  };

  const savePassword = async () => {
    setPasswordError("");
    if (!currentPassword || !newPassword) {
      setPasswordError("Please fill in all password fields.");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }
    setPasswordSaving(true);
    try {
      const res = await patch({ currentPassword, newPassword });
      if (!res.ok) {
        const d = await res.json();
        setPasswordError(d.error ?? "Something went wrong.");
      } else {
        setPasswordSaved(true);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => setPasswordSaved(false), 3000);
      }
    } finally {
      setPasswordSaving(false);
    }
  };

  const saveCategory = async () => {
    if (!category) return;
    setCategorySaving(true);
    try {
      await patch({ category });
      setCategorySaved(true);
      setTimeout(() => setCategorySaved(false), 3000);
    } finally {
      setCategorySaving(false);
    }
  };

  const saveCalendly = async () => {
    setCalendlyError("");
    if (calendlyLink && !calendlyLink.startsWith("https://")) {
      setCalendlyError("Please enter a valid https:// URL.");
      return;
    }
    setCalendlySaving(true);
    try {
      const res = await patch({ calendlyLink });
      if (!res.ok) {
        const d = await res.json();
        setCalendlyError(d.error ?? "Something went wrong.");
      } else {
        setCalendlySaved(true);
        setTimeout(() => setCalendlySaved(false), 3000);
      }
    } finally {
      setCalendlySaving(false);
    }
  };

  const isParticipant = role === "PARTICIPANT";
  const showCalendly = ["FACILITATOR", "PROGRAM_ADMIN", "SUPER_ADMIN"].includes(role);

  return (
    <div className="px-4 py-5 md:px-6 md:py-6 max-w-[640px]">
      <div className="mb-7">
        <h1 className="font-display text-[26px] md:text-[28px] font-semibold text-text-primary">
          Settings
        </h1>
        <p className="text-text-secondary text-sm mt-1">Manage your account preferences</p>
      </div>

      {/* ── Profile ── */}
      <Card className="mb-5">
        <SectionHeader
          icon={User}
          title="Profile"
          description="Update your display name"
        />
        <div className="space-y-4">
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary mb-1 block">
              Full name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-10 px-3 bg-bg-base border border-border rounded-lg text-[14px] text-text-primary outline-none focus:border-accent-primary"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary mb-1 block">
              Email address
            </label>
            <input
              type="email"
              value={email}
              disabled
              className="w-full h-10 px-3 bg-bg-base border border-border rounded-lg text-[14px] text-text-secondary cursor-not-allowed opacity-70"
            />
            <p className="text-[11px] text-text-secondary mt-1">
              Email cannot be changed. Contact your administrator if needed.
            </p>
          </div>
          {profileError && (
            <p className="text-[13px] text-accent-danger bg-[rgba(220,38,38,0.08)] px-3 py-2 rounded-lg">
              {profileError}
            </p>
          )}
          <div className="flex items-center justify-end gap-3">
            {profileSaved && <SavedBanner />}
            <Button
              size="sm"
              onClick={saveProfile}
              loading={profileSaving}
              disabled={!name.trim() || name.trim() === initialName}
            >
              Save name
            </Button>
          </div>
        </div>
      </Card>

      {/* ── Password ── */}
      <Card className="mb-5">
        <SectionHeader
          icon={Lock}
          title="Password"
          description="Change your login password"
        />
        <div className="space-y-3">
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary mb-1 block">
              Current password
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
              className="w-full h-10 px-3 bg-bg-base border border-border rounded-lg text-[14px] text-text-primary outline-none focus:border-accent-primary"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary mb-1 block">
              New password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              className="w-full h-10 px-3 bg-bg-base border border-border rounded-lg text-[14px] text-text-primary outline-none focus:border-accent-primary"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary mb-1 block">
              Confirm new password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              className="w-full h-10 px-3 bg-bg-base border border-border rounded-lg text-[14px] text-text-primary outline-none focus:border-accent-primary"
            />
          </div>
          {passwordError && (
            <p className="text-[13px] text-accent-danger bg-[rgba(220,38,38,0.08)] px-3 py-2 rounded-lg">
              {passwordError}
            </p>
          )}
          <div className="flex items-center justify-end gap-3">
            {passwordSaved && <SavedBanner message="Password updated" />}
            <Button
              size="sm"
              onClick={savePassword}
              loading={passwordSaving}
              disabled={!currentPassword || !newPassword || !confirmPassword}
            >
              Update password
            </Button>
          </div>
        </div>
      </Card>

      {/* ── Category — participants only ── */}
      {isParticipant && (
        <Card className="mb-5">
          <SectionHeader
            icon={Tag}
            title="My Context"
            description="Are you building an entrepreneurial venture or working within an organisation?"
          />
          <div className="space-y-2 mb-4">
            {(
              [
                {
                  value: "ENTREPRENEUR" as Category,
                  emoji: "🌱",
                  headline: "An entrepreneurial venture",
                  description: "I am building or want to build my own business or social enterprise.",
                },
                {
                  value: "INTRAPRENEUR" as Category,
                  emoji: "🏢",
                  headline: "An intrapreneurial project",
                  description: "I am employed and working on an innovation within my organisation.",
                },
              ] as const
            ).map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setCategory(opt.value)}
                className={cn(
                  "w-full text-left p-3 rounded-xl border-2 transition-all",
                  category === opt.value
                    ? "border-accent-primary bg-[rgba(10,10,10,0.04)]"
                    : "border-border hover:border-border-strong bg-white"
                )}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{opt.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-text-primary">{opt.headline}</p>
                    <p className="text-[12px] text-text-secondary">{opt.description}</p>
                  </div>
                  <span
                    className={cn(
                      "w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center",
                      category === opt.value ? "border-accent-primary" : "border-border-strong"
                    )}
                  >
                    {category === opt.value && (
                      <span className="w-2 h-2 rounded-full bg-accent-primary block" />
                    )}
                  </span>
                </div>
              </button>
            ))}
          </div>
          <div className="flex items-center justify-end gap-3">
            {categorySaved && <SavedBanner message="Context saved" />}
            <Button
              size="sm"
              onClick={saveCategory}
              loading={categorySaving}
              disabled={!category || category === initialCategory}
            >
              Save
            </Button>
          </div>
        </Card>
      )}

      {/* ── Calendly link — facilitators/admins ── */}
      {showCalendly && (
        <Card className="mb-5">
          <SectionHeader
            icon={LinkIcon}
            title="Booking Link"
            description="Your Calendly or booking URL — participants can use this to schedule sessions with you"
          />
          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary mb-1 block">
                Calendly URL
              </label>
              <input
                type="url"
                value={calendlyLink}
                onChange={(e) => setCalendlyLink(e.target.value)}
                placeholder="https://calendly.com/your-name"
                className="w-full h-10 px-3 bg-bg-base border border-border rounded-lg text-[14px] text-text-primary outline-none focus:border-accent-primary"
              />
            </div>
            {calendlyError && (
              <p className="text-[13px] text-accent-danger bg-[rgba(220,38,38,0.08)] px-3 py-2 rounded-lg">
                {calendlyError}
              </p>
            )}
            <div className="flex items-center justify-end gap-3">
              {calendlySaved && <SavedBanner message="Link saved" />}
              <Button
                size="sm"
                onClick={saveCalendly}
                loading={calendlySaving}
              >
                Save link
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* ── Danger zone ── */}
      <Card className="border-border">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-text-secondary mb-3">
          Account
        </p>
        <p className="text-[13px] text-text-secondary mb-1">
          <span className="font-medium text-text-primary">Signed in as</span> {email}
        </p>
        <p className="text-[12px] text-text-secondary">
          To deactivate or delete your account, contact your programme administrator.
        </p>
      </Card>
    </div>
  );
}

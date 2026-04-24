"use client";

import { useState } from "react";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Mail, Clock, CheckCircle2 } from "lucide-react";

interface Settings {
  platformName: string;
  supportEmail: string;
  sessionTimeoutMin: number;
  invitationExpiryH: number;
}

interface SettingsFormProps {
  settings: Settings;
}

export function SettingsForm({ settings: initial }: SettingsFormProps) {
  const [form, setForm] = useState<Settings>({
    platformName: initial.platformName,
    supportEmail: initial.supportEmail,
    sessionTimeoutMin: initial.sessionTimeoutMin,
    invitationExpiryH: initial.invitationExpiryH,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to save settings.");
        return;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full px-3 py-2 bg-bg-base border border-border rounded-lg text-sm text-text-primary outline-none focus:border-accent-primary";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Platform */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Shield size={15} className="text-accent-primary" />
          <CardTitle>Platform</CardTitle>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">Platform Name</label>
            <input
              type="text"
              value={form.platformName}
              onChange={(e) => setForm((f) => ({ ...f, platformName: e.target.value }))}
              className={inputClass}
              placeholder="SCL Kingdom Impact Work Platform"
            />
          </div>
        </div>
      </Card>

      {/* Email */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Mail size={15} className="text-accent-primary" />
          <CardTitle>Email</CardTitle>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">Support Email</label>
            <input
              type="email"
              value={form.supportEmail}
              onChange={(e) => setForm((f) => ({ ...f, supportEmail: e.target.value }))}
              className={inputClass}
              placeholder="support@scl-platform.org"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">
              Invitation Expiry (hours)
            </label>
            <input
              type="number"
              min={1}
              max={168}
              value={form.invitationExpiryH}
              onChange={(e) => setForm((f) => ({ ...f, invitationExpiryH: Number(e.target.value) }))}
              className={inputClass}
            />
            <p className="text-xs text-text-secondary mt-1">
              How long invitation links remain valid. Default: 72 hours.
            </p>
          </div>
        </div>
      </Card>

      {/* Authentication */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Clock size={15} className="text-accent-primary" />
          <CardTitle>Authentication</CardTitle>
        </div>
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1.5">
            Session Timeout (minutes)
          </label>
          <input
            type="number"
            min={15}
            max={1440}
            value={form.sessionTimeoutMin}
            onChange={(e) => setForm((f) => ({ ...f, sessionTimeoutMin: Number(e.target.value) }))}
            className={inputClass}
          />
          <p className="text-xs text-text-secondary mt-1">
            How long before inactive sessions expire. Default: 60 minutes.
          </p>
        </div>
      </Card>

      {/* Save */}
      {error && <p className="text-sm text-accent-danger">{error}</p>}
      <div className="flex items-center gap-3">
        <Button type="submit" size="sm" loading={saving}>
          Save Settings
        </Button>
        {saved && (
          <div className="flex items-center gap-1.5 text-accent-primary text-sm">
            <CheckCircle2 size={14} />
            <span>Settings saved</span>
          </div>
        )}
      </div>
    </form>
  );
}

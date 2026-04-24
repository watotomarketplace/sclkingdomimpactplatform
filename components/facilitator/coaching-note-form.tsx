"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface CoachingNoteFormProps {
  recipientId: string;
  recipientName: string;
}

export function CoachingNoteForm({ recipientId, recipientName }: CoachingNoteFormProps) {
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setSaving(true);
    await fetch("/api/coaching-notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipientId, content }),
    });
    setContent("");
    setSaving(false);
    router.refresh();
  };

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <p className="text-[13px] font-medium text-text-primary mb-2">Add a note for {recipientName}</p>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          placeholder="Write a coaching note..."
          className="w-full px-4 py-3 bg-bg-base border border-border rounded-lg text-[14px] text-text-primary outline-none focus:border-accent-primary resize-y"
        />
        <div className="flex justify-end mt-3">
          <Button type="submit" size="sm" loading={saving} disabled={!content.trim()}>
            Add Note
          </Button>
        </div>
      </form>
    </Card>
  );
}

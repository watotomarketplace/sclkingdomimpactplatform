"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronRight, CheckCircle2 } from "lucide-react";

interface Member {
  id: string;
  name: string;
}

interface MeetingSummaryFormProps {
  podId: string;
  members: Member[];
}

const FORMAT_OPTIONS = [
  { value: "IN_PERSON", label: "In Person" },
  { value: "ONLINE", label: "Online" },
  { value: "HYBRID", label: "Hybrid" },
];

/**
 * Addendum 3 — Group Leader meeting summary submission form.
 * Submits to POST /api/meeting-summaries.
 */
export function MeetingSummaryForm({ podId, members }: MeetingSummaryFormProps) {
  const router = useRouter();
  const [meetingDate, setMeetingDate] = useState("");
  const [format, setFormat] = useState("IN_PERSON");
  const [attendeeIds, setAttendeeIds] = useState<string[]>([]);
  const [summary, setSummary] = useState("");
  const [concerns, setConcerns] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const toggleAttendee = (id: string) => {
    setAttendeeIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!meetingDate) { setError("Please select a meeting date."); return; }
    if (attendeeIds.length === 0) { setError("Please select at least one attendee."); return; }
    if (!summary.trim()) { setError("Please write a meeting summary."); return; }

    setSubmitting(true);
    try {
      const res = await fetch("/api/meeting-summaries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ podId, meetingDate, format, attendeeIds, summary, concerns }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        setSubmitting(false);
        return;
      }
      setSuccess(true);
      router.refresh();
    } catch {
      setError("Network error — try again.");
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="glass-2 p-8 text-center fade-in">
        <div className="w-14 h-14 rounded-full bg-[rgba(45,90,61,0.6)] border border-[rgba(134,239,172,0.5)] flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 size={28} className="text-[#86EFAC]" />
        </div>
        <h2 className="font-display text-[20px] font-semibold text-white mb-2">
          Meeting summary submitted!
        </h2>
        <p className="text-white/60 text-[13px] mb-5">
          Your facilitator will be able to see this summary in the cohort view.
        </p>
        <Button variant="ghost" onClick={() => { setSuccess(false); setSummary(""); setConcerns(""); setMeetingDate(""); setAttendeeIds([]); }}>
          Submit another
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Date */}
      <div className="glass-2 p-5">
        <label className="block mb-1">
          <span className="text-[14px] font-semibold text-white">Meeting date</span>
          <span className="text-[#FCA5A5] ml-1">*</span>
        </label>
        <input
          type="date"
          value={meetingDate}
          onChange={(e) => setMeetingDate(e.target.value)}
          max={new Date().toISOString().split("T")[0]}
          className="input-on-glass w-full px-3 h-10 text-[14px]"
        />
      </div>

      {/* Format */}
      <div className="glass-2 p-5">
        <label className="block mb-3">
          <span className="text-[14px] font-semibold text-white">Meeting format</span>
          <span className="text-[#FCA5A5] ml-1">*</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {FORMAT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setFormat(opt.value)}
              className={`px-4 py-2 rounded-lg text-[13px] font-medium transition-all border ${
                format === opt.value
                  ? "bg-[rgba(200,151,58,0.25)] border-[#C8973A] text-[#FCD34D]"
                  : "bg-white/[0.06] border-white/15 text-white/65 hover:bg-white/[0.10] hover:text-white"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Attendees */}
      <div className="glass-2 p-5">
        <label className="block mb-1">
          <span className="text-[14px] font-semibold text-white">Who attended?</span>
          <span className="text-[#FCA5A5] ml-1">*</span>
        </label>
        <p className="text-[12px] text-white/55 mb-3">Select all members who were present.</p>
        <div className="space-y-2">
          {members.map((m) => (
            <label
              key={m.id}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all border ${
                attendeeIds.includes(m.id)
                  ? "bg-[rgba(200,151,58,0.12)] border-[#C8973A]/40"
                  : "bg-white/[0.04] border-white/10 hover:bg-white/[0.07]"
              }`}
            >
              <div
                className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                  attendeeIds.includes(m.id)
                    ? "bg-[#C8973A] border-[#C8973A]"
                    : "border-white/30"
                }`}
              >
                {attendeeIds.includes(m.id) && (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
              <input
                type="checkbox"
                className="sr-only"
                checked={attendeeIds.includes(m.id)}
                onChange={() => toggleAttendee(m.id)}
              />
              <span className="text-[13px] font-medium text-white/85">{m.name}</span>
            </label>
          ))}
        </div>
        <p className="text-[11px] text-white/40 mt-2">{attendeeIds.length} of {members.length} selected</p>
      </div>

      {/* Summary */}
      <div className="glass-2 p-5">
        <label htmlFor="summary" className="block mb-1">
          <span className="text-[14px] font-semibold text-white">Meeting summary</span>
          <span className="text-[#FCA5A5] ml-1">*</span>
        </label>
        <p className="text-[12px] text-white/55 mb-3">
          What did your group discuss? What was the main focus? What decisions were made?
        </p>
        <textarea
          id="summary"
          rows={4}
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="Summarise the meeting…"
          className="input-on-glass w-full px-3 py-2.5 text-[14px] resize-y min-h-[100px]"
        />
      </div>

      {/* Concerns */}
      <div className="glass-2 p-5">
        <label htmlFor="concerns" className="block mb-1">
          <span className="text-[14px] font-semibold text-white">Concerns or escalations</span>
          <span className="text-white/35 text-[12px] ml-2">(optional)</span>
        </label>
        <p className="text-[12px] text-white/55 mb-3">
          Is anyone struggling? Any issues that need your facilitator's attention?
        </p>
        <textarea
          id="concerns"
          rows={2}
          value={concerns}
          onChange={(e) => setConcerns(e.target.value)}
          placeholder="Any concerns to flag…"
          className="input-on-glass w-full px-3 py-2.5 text-[14px] resize-y min-h-[70px]"
        />
      </div>

      {error && (
        <div className="callout-warning fade-in">
          <p className="text-[14px] font-medium">{error}</p>
        </div>
      )}

      <div className="flex justify-end pt-2">
        <Button type="submit" variant="gold" loading={submitting}>
          Submit Summary
          <ChevronRight size={16} />
        </Button>
      </div>
    </form>
  );
}

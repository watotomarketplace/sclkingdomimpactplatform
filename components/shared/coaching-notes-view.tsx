"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { CoachingNoteForm } from "@/components/facilitator/coaching-note-form";

interface NoteItem {
  id: string;
  content: string;
  createdAt: Date | string;
  author: { name: string };
  recipient: { id: string; name: string };
}

interface CoachingNotesViewProps {
  notes: NoteItem[];
  participants: Array<{ id: string; name: string }>;
  showAuthorColumn?: boolean;
  facilitatorId?: string;
}

export function CoachingNotesView({ notes, participants, showAuthorColumn = false, facilitatorId }: CoachingNotesViewProps) {
  const [selectedParticipantId, setSelectedParticipantId] = useState("");

  const filteredNotes = selectedParticipantId
    ? notes.filter(n => n.recipient.id === selectedParticipantId)
    : notes;

  const selectedParticipant = participants.find(p => p.id === selectedParticipantId);

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex items-center gap-3">
        <select
          value={selectedParticipantId}
          onChange={e => setSelectedParticipantId(e.target.value)}
          className="px-3 py-2 bg-bg-base border border-border rounded-lg text-sm text-text-primary outline-none focus:border-accent-primary"
        >
          <option value="">All participants</option>
          {participants.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <span className="text-sm text-text-secondary">{filteredNotes.length} note{filteredNotes.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Add note form if facilitator is logged in and participant is selected */}
      {facilitatorId && selectedParticipant && (
        <CoachingNoteForm recipientId={selectedParticipant.id} recipientName={selectedParticipant.name} />
      )}

      {/* Notes list */}
      {filteredNotes.length === 0 ? (
        <Card className="py-12 text-center">
          <p className="text-text-secondary text-sm">No coaching notes yet.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredNotes.map(note => (
            <Card key={note.id} padding="sm">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-[14px] font-medium text-text-primary">{note.recipient.name}</p>
                  {showAuthorColumn && (
                    <p className="text-xs text-text-secondary">By {note.author.name}</p>
                  )}
                </div>
                <p className="text-xs text-text-secondary shrink-0 ml-2">{formatDate(note.createdAt)}</p>
              </div>
              <p className="text-sm text-text-primary leading-relaxed">{note.content}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

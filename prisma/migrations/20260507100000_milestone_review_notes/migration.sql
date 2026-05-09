-- Add reviewNotes column to milestone_submissions
ALTER TABLE "milestone_submissions" ADD COLUMN IF NOT EXISTS "reviewNotes" TEXT;

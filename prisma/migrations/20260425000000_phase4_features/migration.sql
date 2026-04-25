-- Phase 4: Entrepreneur/Intrapreneur category, M0 attendance, coaching sessions, calendly link

-- CreateEnum
CREATE TYPE "ParticipantCategory" AS ENUM ('ENTREPRENEUR', 'INTRAPRENEUR');

-- AlterTable: add category and attendanceConfirmed to participant_profiles
ALTER TABLE "participant_profiles"
  ADD COLUMN IF NOT EXISTS "category" "ParticipantCategory",
  ADD COLUMN IF NOT EXISTS "attendanceConfirmed" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable: add calendlyLink to users
ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "calendlyLink" TEXT;

-- CreateTable: coaching_sessions
CREATE TABLE IF NOT EXISTS "coaching_sessions" (
  "id"              TEXT NOT NULL,
  "participantId"   TEXT NOT NULL,
  "month"           INTEGER NOT NULL,
  "sessionDate"     TIMESTAMP(3) NOT NULL,
  "notes"           TEXT,
  "calendlyEventId" TEXT,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "coaching_sessions_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "coaching_sessions"
  ADD CONSTRAINT "coaching_sessions_participantId_fkey"
  FOREIGN KEY ("participantId") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

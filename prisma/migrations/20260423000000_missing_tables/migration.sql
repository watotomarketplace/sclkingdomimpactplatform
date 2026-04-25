-- Migration: add columns and tables missing from the init migration

-- AlterTable users: add readinessComplete
ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "readinessComplete" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable: system_settings
CREATE TABLE IF NOT EXISTS "system_settings" (
  "id"                TEXT NOT NULL DEFAULT 'singleton',
  "platformName"      TEXT NOT NULL DEFAULT 'SCL Kingdom Impact Work Platform',
  "supportEmail"      TEXT NOT NULL DEFAULT 'support@scl-platform.org',
  "sessionTimeoutMin" INTEGER NOT NULL DEFAULT 60,
  "invitationExpiryH" INTEGER NOT NULL DEFAULT 72,
  "updatedAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedById"       TEXT,

  CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey for system_settings
ALTER TABLE "system_settings"
  ADD CONSTRAINT "system_settings_updatedById_fkey"
  FOREIGN KEY ("updatedById") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable: readiness_assessments
CREATE TABLE IF NOT EXISTS "readiness_assessments" (
  "id"             TEXT NOT NULL,
  "userId"         TEXT NOT NULL,
  "questionNumber" INTEGER NOT NULL,
  "currentAnswer"  TEXT NOT NULL DEFAULT '',
  "actionToTake"   TEXT,
  "submittedAt"    TIMESTAMP(3),
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "readiness_assessments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex for readiness_assessments
CREATE UNIQUE INDEX IF NOT EXISTS "readiness_assessments_userId_questionNumber_key"
  ON "readiness_assessments"("userId", "questionNumber");

-- AddForeignKey for readiness_assessments
ALTER TABLE "readiness_assessments"
  ADD CONSTRAINT "readiness_assessments_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: problem_entries
CREATE TABLE IF NOT EXISTS "problem_entries" (
  "id"          TEXT NOT NULL,
  "userId"      TEXT NOT NULL,
  "observation" TEXT NOT NULL,
  "sphere"      TEXT NOT NULL,
  "affected"    TEXT,
  "observedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "problem_entries_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey for problem_entries
ALTER TABLE "problem_entries"
  ADD CONSTRAINT "problem_entries_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

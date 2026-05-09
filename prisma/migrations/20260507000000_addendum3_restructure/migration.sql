-- Addendum 3: Program restructure, Group Leader role, 5-stage healing framework, glassmorphism era

-- ── New enum values on Role ────────────────────────────────────
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'GROUP_LEADER';

-- ── New enums ──────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE "MilestoneType" AS ENUM ('ONBOARDING', 'MILESTONE_1', 'MILESTONE_2', 'MILESTONE_3', 'MILESTONE_4');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "MilestoneStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'SUBMITTED', 'LATE', 'AT_RISK');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "MeetingFormat" AS ENUM ('IN_PERSON', 'ONLINE', 'HYBRID');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "InitiativeType" AS ENUM ('NEW_BUSINESS', 'WORKPLACE_SOLUTION');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "SphereOfInfluence" AS ENUM ('BUSINESS', 'EDUCATION', 'GOVERNMENT', 'CHURCH', 'MEDIA', 'HEALTH', 'ARTS', 'FAMILY');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ── User: profile + onboarding + initiative type fields ────────
ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "phone"                  TEXT,
  ADD COLUMN IF NOT EXISTS "campus"                 TEXT,
  ADD COLUMN IF NOT EXISTS "sphereOfInfluence"      "SphereOfInfluence",
  ADD COLUMN IF NOT EXISTS "onboardingComplete"     BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "onboardingCompletedAt"  TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "mviBriefData"           JSONB,
  ADD COLUMN IF NOT EXISTS "initiativeType"         "InitiativeType";

-- ── PodMember: Group Leader flag ───────────────────────────────
ALTER TABLE "pod_members"
  ADD COLUMN IF NOT EXISTS "isLeader" BOOLEAN NOT NULL DEFAULT false;

-- ── milestone_submissions table ────────────────────────────────
CREATE TABLE IF NOT EXISTS "milestone_submissions" (
  "id"            TEXT             NOT NULL,
  "userId"        TEXT             NOT NULL,
  "milestoneType" "MilestoneType"  NOT NULL,
  "status"        "MilestoneStatus" NOT NULL DEFAULT 'IN_PROGRESS',
  "formData"      JSONB            NOT NULL DEFAULT '{}',
  "fileUrls"      JSONB,
  "submittedAt"   TIMESTAMP(3),
  "deadline"      TIMESTAMP(3),
  "reviewedAt"    TIMESTAMP(3),
  "reviewedById"  TEXT,
  "createdAt"     TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "milestone_submissions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "milestone_submissions_userId_milestoneType_key"
  ON "milestone_submissions"("userId", "milestoneType");

ALTER TABLE "milestone_submissions"
  ADD CONSTRAINT "milestone_submissions_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "milestone_submissions"
  ADD CONSTRAINT "milestone_submissions_reviewedById_fkey"
  FOREIGN KEY ("reviewedById") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- ── group_meeting_summaries table ──────────────────────────────
CREATE TABLE IF NOT EXISTS "group_meeting_summaries" (
  "id"          TEXT             NOT NULL,
  "podId"       TEXT             NOT NULL,
  "authorId"    TEXT             NOT NULL,
  "meetingDate" TIMESTAMP(3)     NOT NULL,
  "format"      "MeetingFormat"  NOT NULL,
  "attendeeIds" JSONB            NOT NULL,
  "summary"     TEXT             NOT NULL,
  "concerns"    TEXT,
  "createdAt"   TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "group_meeting_summaries_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "group_meeting_summaries"
  ADD CONSTRAINT "group_meeting_summaries_podId_fkey"
  FOREIGN KEY ("podId") REFERENCES "pods"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "group_meeting_summaries"
  ADD CONSTRAINT "group_meeting_summaries_authorId_fkey"
  FOREIGN KEY ("authorId") REFERENCES "users"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

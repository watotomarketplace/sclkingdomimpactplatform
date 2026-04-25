#!/usr/bin/env bash
# =============================================================
# SCL Platform — One-time Vercel environment variable setup
#
# Run this ONCE after:
#   1. Creating a Neon database in Vercel Storage (auto-injects POSTGRES_* vars)
#   2. Installing Vercel CLI: npm i -g vercel
#   3. Logging in: vercel login
#
# Usage:
#   chmod +x scripts/setup-vercel-env.sh
#   ./scripts/setup-vercel-env.sh
# =============================================================

set -e

echo ""
echo "=================================================="
echo "  SCL Platform — Vercel Environment Setup"
echo "=================================================="
echo ""

# ── 1. Check Vercel CLI is installed ──────────────────────────
if ! command -v vercel &> /dev/null; then
  echo "❌  Vercel CLI not found. Install it first:"
  echo "    npm install -g vercel"
  exit 1
fi

# ── 2. Get app URL ────────────────────────────────────────────
echo "Enter your Vercel app URL (e.g. https://scl-platform.vercel.app):"
read -r APP_URL
APP_URL="${APP_URL%/}"   # strip trailing slash

# ── 3. Optional: Resend API key ───────────────────────────────
echo ""
echo "Enter your Resend API key (press Enter to skip — emails will log to console):"
read -r RESEND_KEY
RESEND_KEY="${RESEND_KEY:-re_dev_mode_no_emails}"

# ── 4. Generate shared secret ─────────────────────────────────
echo ""
echo "⚙️   Generating AUTH_SECRET..."
SECRET=$(openssl rand -base64 32)

# ── 5. Push env vars to Vercel ────────────────────────────────
echo ""
echo "📤  Setting environment variables on Vercel..."

# AUTH_SECRET — used by NextAuth v5
echo "$SECRET" | vercel env add AUTH_SECRET production --force
echo "$SECRET" | vercel env add AUTH_SECRET preview --force

# NEXTAUTH_SECRET — legacy NextAuth compat key (same value)
echo "$SECRET" | vercel env add NEXTAUTH_SECRET production --force
echo "$SECRET" | vercel env add NEXTAUTH_SECRET preview --force

# App URL
echo "$APP_URL" | vercel env add AUTH_URL production --force
echo "$APP_URL" | vercel env add NEXTAUTH_URL production --force

# Resend
echo "$RESEND_KEY" | vercel env add RESEND_API_KEY production --force
echo "$RESEND_KEY" | vercel env add RESEND_API_KEY preview --force

# ── 6. Super admin seed defaults (user can update in Vercel dashboard) ────
echo "admin@sclplatform.org" | vercel env add SUPER_ADMIN_EMAIL_1 production --force
echo "SCL Super Admin"       | vercel env add SUPER_ADMIN_NAME_1  production --force
echo "ChangeMe2026!"         | vercel env add SUPER_ADMIN_PASSWORD_1 production --force

echo ""
echo "✅  Done! Environment variables set:"
echo "    AUTH_SECRET         → (generated)"
echo "    NEXTAUTH_SECRET     → (same as AUTH_SECRET)"
echo "    AUTH_URL            → $APP_URL"
echo "    NEXTAUTH_URL        → $APP_URL"
echo "    RESEND_API_KEY      → ${RESEND_KEY:0:8}..."
echo ""
echo "⚠️   Remember to update SUPER_ADMIN_* defaults in Vercel → Environment Variables"
echo ""
echo "🚀  Now push your code to GitHub — Vercel will build and migrate automatically."
echo ""

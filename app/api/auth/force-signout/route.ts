import { signOut } from "@/lib/auth";

/**
 * GET /api/auth/force-signout
 *
 * Called when a server component detects the JWT userId no longer exists in
 * the database (e.g. after a DB reset). We must clear the session cookie here
 * in a Route Handler — signOut() cannot be called from a Server Component.
 */
export async function GET() {
  await signOut({ redirectTo: "/login" });
}

import { redirect } from "@tanstack/react-router";
import type { SessionUser } from "#/server/session";

/**
 * Guard for `beforeLoad` on routes that require a *registered* (non-anonymous)
 * account. Redirects anonymous or signed-out visitors to the sign-in surface,
 * preserving where they came from.
 *
 * Note: this protects route UX only. Server functions that touch private data
 * must still enforce auth in their own handler (see `requireUser`).
 */
export function requireRegisteredUser(
  user: SessionUser | null,
  redirectFrom?: string,
): SessionUser {
  if (!user || user.isAnonymous) {
    throw redirect({ to: "/auth", search: { redirect: redirectFrom } });
  }
  return user;
}

import { anonymousClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

/**
 * Browser auth client. Talks to the `/api/auth/*` routes on the same origin,
 * so no baseURL is needed. The `anonymousClient` plugin mirrors the server's
 * `anonymous()` plugin, exposing `signIn.anonymous()`.
 */
export const authClient = createAuthClient({
  plugins: [anonymousClient()],
});

export const { signIn, signUp, signOut, useSession } = authClient;

/**
 * Anonymous-first: ensure the visitor has *some* session before an action that
 * needs an owner (e.g. creating their first todo). Creates an anonymous account
 * on demand and returns whether a session now exists.
 */
export async function ensureAnonymousSession(): Promise<boolean> {
  const { data } = await authClient.getSession();
  if (data?.user) return true;
  const { data: signedIn } = await authClient.signIn.anonymous();
  return Boolean(signedIn);
}

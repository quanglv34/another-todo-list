import { Link, useRouter } from "@tanstack/react-router";
import { signOut, useSession } from "#/lib/auth-client";

/**
 * Header indicator of the current identity: a sign-in link for guests
 * (anonymous or signed-out), or the user's name plus sign-out when registered.
 */
export default function AuthStatus() {
  const { data, isPending } = useSession();
  const router = useRouter();

  if (isPending) return null;

  const user = data?.user;
  const isRegistered = user && !user.isAnonymous;

  if (!isRegistered) {
    return (
      <div className="flex items-center gap-2">
        {user?.isAnonymous && (
          <span className="hidden text-xs font-medium text-[var(--sea-ink-soft)] sm:inline">
            Guest
          </span>
        )}
        <Link
          to="/auth"
          className="rounded-full border border-[var(--chip-line)] bg-[var(--chip-bg)] px-3 py-1.5 text-sm font-semibold text-[var(--sea-ink)] no-underline transition hover:-translate-y-0.5"
        >
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="hidden max-w-[12ch] truncate text-sm font-medium text-[var(--sea-ink)] sm:inline">
        {user.name || user.email}
      </span>
      <button
        type="button"
        onClick={async () => {
          await signOut();
          await router.invalidate();
        }}
        className="rounded-full border border-[var(--chip-line)] bg-[var(--chip-bg)] px-3 py-1.5 text-sm font-semibold text-[var(--sea-ink-soft)] transition hover:-translate-y-0.5 hover:text-[var(--lagoon-deep)]"
      >
        Sign out
      </button>
    </div>
  );
}

import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { signIn, signUp } from "#/lib/auth-client";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>): { redirect?: string } =>
    typeof search.redirect === "string" ? { redirect: search.redirect } : {},
  component: AuthPage,
});

type Mode = "signin" | "signup";

function AuthPage() {
  const navigate = useNavigate();
  const router = useRouter();
  const { redirect } = Route.useSearch();

  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setPending(true);
    try {
      // When the visitor is anonymous, signUp links the new credentials to the
      // existing account (Better Auth anonymous plugin), keeping their todos.
      const result =
        mode === "signup"
          ? await signUp.email({ email, password, name: name.trim() || email })
          : await signIn.email({ email, password });

      if (result.error) {
        setError(result.error.message ?? "Something went wrong. Please try again.");
        return;
      }

      await router.invalidate();
      if (redirect) {
        router.history.push(redirect);
      } else {
        await navigate({ to: "/todos" });
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="page-wrap px-4 pb-8 pt-14">
      <section className="island-shell rise-in mx-auto max-w-md rounded-[2rem] px-6 py-10 sm:px-10 sm:py-12">
        <p className="island-kicker mb-3">
          {mode === "signup" ? "Create an account" : "Welcome back"}
        </p>
        <h1 className="display-title mb-6 text-3xl font-bold tracking-tight text-[var(--sea-ink)] sm:text-4xl">
          {mode === "signup" ? "Sign up" : "Sign in"}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <label className="block">
              <span className="mb-1 block text-sm text-[var(--sea-ink-soft)]">Name</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                autoComplete="name"
                className="w-full rounded-xl border border-[rgba(23,58,64,0.2)] bg-white/60 px-4 py-2.5 text-sm text-[var(--sea-ink)] outline-none focus:border-[rgba(50,143,151,0.5)]"
              />
            </label>
          )}
          <label className="block">
            <span className="mb-1 block text-sm text-[var(--sea-ink-soft)]">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              className="w-full rounded-xl border border-[rgba(23,58,64,0.2)] bg-white/60 px-4 py-2.5 text-sm text-[var(--sea-ink)] outline-none focus:border-[rgba(50,143,151,0.5)]"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm text-[var(--sea-ink-soft)]">Password</span>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              className="w-full rounded-xl border border-[rgba(23,58,64,0.2)] bg-white/60 px-4 py-2.5 text-sm text-[var(--sea-ink)] outline-none focus:border-[rgba(50,143,151,0.5)]"
            />
          </label>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-full border border-[rgba(50,143,151,0.3)] bg-[rgba(79,184,178,0.16)] px-5 py-2.5 text-sm font-semibold text-[var(--lagoon-deep)] transition hover:-translate-y-0.5 hover:bg-[rgba(79,184,178,0.26)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "Please wait…" : mode === "signup" ? "Create account" : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--sea-ink-soft)]">
          {mode === "signup" ? "Already have an account?" : "New here?"}{" "}
          <button
            type="button"
            onClick={() => {
              setMode(mode === "signup" ? "signin" : "signup");
              setError(null);
            }}
            className="font-semibold text-[var(--lagoon-deep)] underline-offset-2 hover:underline"
          >
            {mode === "signup" ? "Sign in" : "Create one"}
          </button>
        </p>
      </section>
    </main>
  );
}

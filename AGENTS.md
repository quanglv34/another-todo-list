# TanStack Start — Project Context

## Scaffold Command

```
npx @tanstack/cli@latest create my-tanstack-app --agent
```

Run in a scratch directory (`/tmp/my-tanstack-app`), then merged into this repo.

## Stack

| Layer     | Choice                                                    |
| --------- | --------------------------------------------------------- |
| Framework | TanStack Start (React 19, SSR)                            |
| Router    | TanStack Router (file-based, `src/routes/`)               |
| Styling   | Tailwind CSS v4 + `@tailwindcss/typography`               |
| Build     | Vite 8 + `@tanstack/react-start/plugin/vite`              |
| Testing   | Vitest + @testing-library/react                           |
| Devtools  | TanStack Devtools (`@tanstack/devtools-vite` Vite plugin) |

## Development

```bash
pnpm install
pnpm dev          # http://localhost:3000
pnpm build        # production build
pnpm preview      # preview production build
pnpm test         # run vitest
pnpm generate-routes  # re-generate routeTree.gen.ts (normally auto)
```

## TanStack Intent

After scaffolding, TanStack Intent was configured automatically. Consult skill
guidance before making router, SSR, or Start-specific changes:

```bash
npx @tanstack/intent@latest install
npx @tanstack/intent@latest list
npx @tanstack/intent@latest load <skill-id>   # e.g. @tanstack/react-start#react-start
```

Skill mappings live in the `tanstackIntent:` block at the top of this file
(injected by the CLI — see the full AGENTS.md generated in `/tmp/my-tanstack-app`
for the complete skill list).

## Key Architecture

- **Document shell**: `src/routes/__root.tsx` — renders the full `<html>` document
  via `shellComponent: RootDocument`. No `index.html` needed.
- **Router factory**: `src/router.tsx` → `getRouter()` — consumed by the TanStack
  Start Vite plugin to wire client and server entry points automatically.
- **Route tree**: `src/routeTree.gen.ts` — auto-generated; do NOT edit manually.
  Excluded from VSCode search/watcher via `.vscode/settings.json`.
- **Styles**: `src/styles.css` — Tailwind v4 entry with CSS custom property tokens.
- **Path alias**: `#/*` → `./src/*` (configured in `package.json` imports and `tsconfig.json`).

## Adding Routes

Drop a `.tsx` file in `src/routes/`. TanStack Router's Vite plugin regenerates
`routeTree.gen.ts` automatically on save during `pnpm dev`.

## Environment Variables

- Client-safe vars must be prefixed `VITE_` (bundled into the client bundle).
- Server-only vars use `process.env` directly in server functions / middleware.
- No `.env` file is committed; create `.env.local` for local overrides.

## Deployment Notes

TanStack Start supports Cloudflare Workers, Vercel, Netlify, Node.js, and Bun.
See `@tanstack/start-client-core#start-core/deployment` Intent skill for adapter setup.

<!-- intent-skills:start -->

## Skill Loading

Before editing files for a substantial task:

- Run `pnpm dlx @tanstack/intent@latest list` from the workspace root to see available local skills.
- If a listed skill matches the task, run `pnpm dlx @tanstack/intent@latest load <package>#<skill>` before changing files.
- Use the loaded `SKILL.md` guidance while making the change.
- Monorepos: when working across packages, run the skill check from the workspace root and prefer the local skill for the package being changed.
- Multiple matches: prefer the most specific local skill for the package or concern you are changing; load additional skills only when the task spans multiple packages or concerns.
<!-- intent-skills:end -->

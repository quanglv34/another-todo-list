# TanStack Start — Project Context

## Monorepo Layout

This is a **Vite+ (vite-plus) monorepo** managed with pnpm workspaces:

```
.                        # workspace root: pnpm-workspace.yaml, root vite.config.ts (lint/fmt/staged), tsconfig.json
├── apps/
│   └── web/             # the TanStack Start app (package name: "web")
└── packages/
    └── todo-list-core/  # framework-agnostic todo domain logic (package name: "todo-list-core")
```

- The workspace **catalog** (vite, vitest, vite-plus, typescript, @types/node) lives in `pnpm-workspace.yaml`.
- `apps/web` consumes the core package via the workspace dependency `"todo-list-core": "workspace:*"`.
- `packages/todo-list-core` is an internal package: its `exports` point at `./src/index.ts`, so the
  Vite app compiles it directly (no prebuild step needed for dev or build).

Scaffolded with Vite+: `vp create vite:monorepo` (root) and `vp create vite:library` (the core package).

## Scaffold Command (original app)

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

Run from the **workspace root**:

```bash
vp install                  # install all workspace deps (delegates to pnpm)
pnpm dev                    # web app at http://localhost:3000 (→ vp run web#dev)
pnpm build                  # build every package (vp run -r build)
pnpm test                   # test every package (vp run -r test)
vp check                    # workspace-wide format + lint + type-check
```

Per-package commands (run from `apps/web` or `packages/todo-list-core`):

```bash
vp dev / vp build / vp preview / vp test / vp check
pnpm --filter web generate-routes   # re-generate routeTree.gen.ts (normally auto)
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

All app paths below are under `apps/web/`:

- **Document shell**: `apps/web/src/routes/__root.tsx` — renders the full `<html>` document
  via `shellComponent: RootDocument`. No `index.html` needed.
- **Router factory**: `apps/web/src/router.tsx` → `getRouter()` — consumed by the TanStack
  Start Vite plugin to wire client and server entry points automatically.
- **Route tree**: `apps/web/src/routeTree.gen.ts` — auto-generated; do NOT edit manually.
  Excluded from VSCode search/watcher via `.vscode/settings.json`.
- **Styles**: `apps/web/src/styles.css` — Tailwind v4 entry with CSS custom property tokens.
- **Path alias**: `#/*` → `./src/*` (configured in `apps/web/package.json` imports and `apps/web/tsconfig.json`).
- **Core logic**: `packages/todo-list-core` — pure `Todo` types + functions, imported as `todo-list-core`
  (see `apps/web/src/routes/todos.tsx` for usage).

## Adding Routes

Drop a `.tsx` file in `apps/web/src/routes/`. TanStack Router's Vite plugin regenerates
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

<!--VITE PLUS START-->

# Using Vite+, the Unified Toolchain for the Web

This project is using Vite+, a unified toolchain built on top of Vite, Rolldown, Vitest, tsdown, Oxlint, Oxfmt, and Vite Task. Vite+ wraps runtime management, package management, and frontend tooling in a single global CLI called `vp`. Vite+ is distinct from Vite, and it invokes Vite through `vp dev` and `vp build`. Run `vp help` to print a list of commands and `vp <command> --help` for information about a specific command.

Docs are local at `node_modules/vite-plus/docs` or online at https://viteplus.dev/guide/.

## Review Checklist

- [ ] Run `vp install` after pulling remote changes and before getting started.
- [ ] Run `vp check` and `vp test` to format, lint, type check and test changes.
- [ ] Check if there are `vite.config.ts` tasks or `package.json` scripts necessary for validation, run via `vp run <script>`.
- [ ] If setup, runtime, or package-manager behavior looks wrong, run `vp env doctor` and include its output when asking for help.

<!--VITE PLUS END-->

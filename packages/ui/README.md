# @workspace/ui

Shared UI component library built on [Untitled UI React](https://www.untitledui.com/react)
(Tailwind CSS v4 + React Aria Components).

## Usage (from another workspace package)

Add it as a dependency:

```jsonc
// package.json
"dependencies": {
  "@workspace/ui": "workspace:*"
}
```

Import the global stylesheet once (so Tailwind processes the Untitled UI theme
tokens), then use components:

```ts
import "@workspace/ui/styles/globals.css";
import { Button } from "@workspace/ui";
```

## Adding more components

Components are vendored into `src/` via the Untitled UI CLI:

```bash
# run inside packages/ui
npx untitledui@latest add input -y --lib-version 8
```

The CLI's automatic `npm install` step fails in this pnpm + catalog workspace
(`Unsupported URL Type "catalog:"`). That is expected — the component files are
still written. Install any new runtime deps with pnpm from the repo root and
re-export the component from `src/index.ts`.

## Scripts

- `vp pack` — build the library (`dist/`)
- `vp test` — run unit tests
- `vp check` — lint / type-aware checks

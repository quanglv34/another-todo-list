import { cloudflare } from "@cloudflare/vite-plugin";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { defineConfig, lazyPlugins } from "vite-plus";

// The Cloudflare plugin runs the SSR environment as a Workers runtime, which
// breaks Vitest's worker runner at startup (`module is not defined`). Gate it
// out under Vitest so tests load in a plain environment. (Vitest sets VITEST=true
// before evaluating this config.)
const isVitest = process.env.VITEST === "true";

export default defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    // Cloudflare plugin must run the SSR environment as a Worker. Kept eager
    // (not inside lazyPlugins) so it can wire up the dev/build environments.
    !isVitest && cloudflare({ viteEnvironment: { name: "ssr" } }),
    // tanstackStart must also be eager and ordered right after the Cloudflare
    // plugin (matching Cloudflare's official guide). Lazy-loading it meant the
    // Cloudflare plugin's build hook ran before the `#tanstack-start-entry`
    // specifier was registered, failing with: Missing "#tanstack-start-entry"
    // specifier in "@tanstack/start-server-core".
    // `router` style options make the generated routeTree.gen.ts match oxfmt's
    // defaults (double quotes + semicolons), so `vp check` accepts it as-is
    // instead of needing the file excluded from formatting.
    tanstackStart({ router: { quoteStyle: "double", semicolons: true } }),
    lazyPlugins(async () => {
      const [{ devtools }, { default: viteReact }, { default: tailwindcss }] = await Promise.all([
        import("@tanstack/devtools-vite"),
        import("@vitejs/plugin-react"),
        import("@tailwindcss/vite"),
      ]);
      return [devtools(), tailwindcss(), viteReact()];
    }),
  ],
});

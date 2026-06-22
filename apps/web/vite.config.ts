import { cloudflare } from "@cloudflare/vite-plugin";
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
    lazyPlugins(async () => {
      const [{ devtools }, { tanstackStart }, { default: viteReact }, { default: tailwindcss }] =
        await Promise.all([
          import("@tanstack/devtools-vite"),
          import("@tanstack/react-start/plugin/vite"),
          import("@vitejs/plugin-react"),
          import("@tailwindcss/vite"),
        ]);
      return [devtools(), tailwindcss(), tanstackStart(), viteReact()];
    }),
  ],
});

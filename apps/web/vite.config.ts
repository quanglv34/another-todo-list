import { defineConfig, lazyPlugins } from "vite-plus";

export default defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: lazyPlugins(async () => {
    const [{ devtools }, { tanstackStart }, { default: viteReact }, { default: tailwindcss }] =
      await Promise.all([
        import("@tanstack/devtools-vite"),
        import("@tanstack/react-start/plugin/vite"),
        import("@vitejs/plugin-react"),
        import("@tailwindcss/vite"),
      ]);
    return [devtools(), tailwindcss(), tanstackStart(), viteReact()];
  }),
});

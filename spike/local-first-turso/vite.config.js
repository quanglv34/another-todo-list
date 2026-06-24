import { defineConfig } from "vite-plus";

// @tursodatabase/sync-wasm persists via OPFS sync-access-handles in a Web
// Worker, which require cross-origin isolation (SharedArrayBuffer). These
// headers enable it for both the dev server and `vite preview`. In production
// the same COOP/COEP headers must be served by the app (a real constraint to
// record: Cloudflare Workers must set them for the /todos route).
const crossOriginIsolation = {
  name: "cross-origin-isolation",
  configureServer(server) {
    server.middlewares.use((_req, res, next) => {
      res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
      res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
      next();
    });
  },
  configurePreviewServer(server) {
    server.middlewares.use((_req, res, next) => {
      res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
      res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
      next();
    });
  },
};

export default defineConfig({
  plugins: [crossOriginIsolation],
  // The wasm package pre-bundles its own .wasm; let it ship as an asset and
  // keep esbuild's dep-optimizer from trying to crawl the wasm binary.
  optimizeDeps: {
    exclude: ["@tursodatabase/sync-wasm"],
    // sync-wasm loads the wasm + worker via TOP-LEVEL AWAIT — the dep optimizer
    // and final build must target a TLA-capable environment.
    esbuildOptions: { target: "esnext" },
  },
  // FINDING: sync-wasm uses top-level await, so the build target must allow it
  // (esnext / es2022+). In production the app must ship a modern target too.
  build: { target: "esnext" },
  worker: { format: "es" },
});

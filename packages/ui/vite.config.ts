import { defineConfig } from "vite-plus";
import { resolve } from "path";

export default defineConfig({
  // No Vite plugins are needed to *pack* this library: rolldown handles TSX,
  // and the Tailwind stylesheet ships as source for the consumer's Tailwind to
  // process. (Adding @vitejs/plugin-react / @tailwindcss/vite here also blows
  // defineConfig's type-instantiation depth under type-aware lint.)
  // The `@` alias is still required so component imports like `@/utils/cx`
  // resolve during bundling.
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
  pack: {
    dts: {
      tsgo: true,
    },
    // Auto-generate JS exports from the entry, and additionally expose the
    // Tailwind v4 stylesheet from source so consumers' Tailwind can process
    // its `@theme`/`@plugin` directives.
    exports: {
      customExports(exports) {
        return {
          ...exports,
          "./styles/globals.css": "./src/styles/globals.css",
        };
      },
    },
  },
  lint: {
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
  fmt: {},
});

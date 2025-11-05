// apps/tiny-rts/vite.config.ts
import { defineConfig } from "vite";

export default defineConfig({
  server: { port: 5173 },
  build: { target: "esnext" },
  resolve: {
    alias: {
      "@core": "../../packages/core/src",
      "@engine-babylon": "../../packages/engine-babylon/src",
      "@sync": "../../packages/sync/src",
      "@net": "../../packages/net/src",
      "@io": "../../packages/io/src",
      "@worker": "../../packages/worker/src"
    }
  }
});
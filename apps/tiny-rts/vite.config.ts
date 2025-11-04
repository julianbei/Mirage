// apps/tiny-rts/vite.config.ts
import { defineConfig } from "vite";

export default defineConfig({
  server: { port: 5173 },
  build: { target: "esnext" }
});
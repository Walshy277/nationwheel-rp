import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { env } from "node:process";

import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  base: env.VITE_BASE_PATH || "/",
  plugins: [react(), cloudflare()],
  build: {
    chunkSizeWarningLimit: 650,
  },
});
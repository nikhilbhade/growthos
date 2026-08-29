import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

// GrowthOS multi-page build: `/` (landing) and `/app.html` (dashboard).
// Output goes to ../public-dist and is served by the Node server in production.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
  build: {
    outDir: path.resolve(__dirname, "../public-dist"),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        landing: path.resolve(__dirname, "index.html"),
        app: path.resolve(__dirname, "app.html"),
      },
    },
  },
});

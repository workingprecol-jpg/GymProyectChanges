import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  // The dashboard is served under /app/ so the landing page can own the root of
  // gymassist.online. This makes the built asset URLs /app/assets/..., which is
  // what the Nginx location block in the repo-root nginx.conf expects.
  base: "/app/",
  plugins: [react()],
  server: {
    // The legal pages are static files owned by the landing app. In production
    // the same Nginx serves both; in dev they live on the landing's port, so
    // proxy them across and keep the login screen's links working.
    proxy: {
      "^/(privacidad|terminos|_legal\\.css)$": {
        target: "http://localhost:5174",
        changeOrigin: true,
      },
    },
  },
});

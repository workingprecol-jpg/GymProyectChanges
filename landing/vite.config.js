import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const publicDir = resolve(dirname(fileURLToPath(import.meta.url)), "public");

/**
 * En produccion Nginx resuelve /privacidad -> privacidad.html gracias a
 * `try_files $uri $uri.html` (ver nginx.conf en la raiz del repo). El servidor
 * de desarrollo de Vite no hace eso: cae al index.html de la SPA, asi que los
 * enlaces legales del pie mostrarian la landing en vez de la pagina legal.
 * Este plugin replica esa unica regla, solo en desarrollo.
 */
function htmlExtensionFallback() {
  return {
    name: "html-extension-fallback",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        const [path] = (req.url ?? "").split("?");
        if (/^\/[\w-]+$/.test(path) && existsSync(resolve(publicDir, `${path.slice(1)}.html`))) {
          req.url = req.url.replace(path, `${path}.html`);
        }
        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), htmlExtensionFallback()],
  server: {
    // 5173 lo ocupa el dashboard (frontend/) en este repo.
    port: 5174,
    strictPort: true,
    // En produccion un solo Nginx sirve la landing en / y el dashboard en
    // /app/ (ver nginx.conf en la raiz). Este proxy reproduce ese enrutado en
    // desarrollo, para que el boton "Admin" se comporte igual en ambos.
    proxy: {
      "/app": { target: "http://localhost:5173", changeOrigin: true },
    },
  },
});

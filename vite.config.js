import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const raiz = path.dirname(fileURLToPath(import.meta.url));

// public/api/config.php tiene las credenciales de la base LOCAL: se quita del
// build para que nunca se suba al hosting (allá se usa config.production.php).
function sinConfigLocal() {
  let outDir;
  return {
    name: "sin-config-local",
    apply: "build",
    configResolved(cfg) {
      outDir = path.resolve(cfg.root, cfg.build.outDir);
    },
    closeBundle() {
      fs.rmSync(path.join(outDir, "api", "config.php"), { force: true });
    },
  };
}

export default defineConfig({
  plugins: [react(), sinConfigLocal()],
  build: {
    // Dos páginas: la landing (/) y el panel de administración (/admin/).
    rollupOptions: {
      input: {
        main: path.resolve(raiz, "index.html"),
        admin: path.resolve(raiz, "admin/index.html"),
      },
      output: {
        manualChunks: (id) => (id.includes("node_modules") ? "vendor" : undefined),
      },
    },
  },
  server: {
    port: 5180,
    // En desarrollo, /api/*.php va al servidor PHP local: php -S localhost:8000 -t public
    proxy: { "/api": "http://localhost:8000" },
  },
});

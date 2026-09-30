import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";

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
  server: {
    port: 5180,
    // En desarrollo, /api/*.php va al servidor PHP local: php -S localhost:8000 -t public
    proxy: { "/api": "http://localhost:8000" },
  },
});

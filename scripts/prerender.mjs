// Prerenderiza la landing: dibuja <App /> a HTML y lo inserta en dist/index.html,
// para que buscadores y vistas previas (LinkedIn, WhatsApp) vean el texto sin ejecutar JavaScript.
// Se ejecuta solo después de "vite build" (npm run build). En el navegador, main.jsx
// "hidrata" ese HTML y la página se vuelve interactiva igual que antes.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";
import { createElement } from "react";
import { renderToString } from "react-dom/server";

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const archivo = path.join(raiz, "dist", "index.html");
const MARCA = '<div id="root"></div>';

if (!fs.existsSync(archivo)) {
  console.error("No hay dist/index.html. Ejecuta primero: vite build");
  process.exit(1);
}

const html = fs.readFileSync(archivo, "utf8");
if (!html.includes(MARCA)) {
  console.error('dist/index.html no contiene <div id="root"></div> vacío (¿ya está prerenderizado?).');
  process.exit(1);
}

// Vite en modo "middleware" solo para cargar el JSX de src/ en Node (no abre ningún puerto).
const vite = await createServer({
  root: raiz,
  appType: "custom",
  server: { middlewareMode: true },
  logLevel: "error",
});

try {
  const { default: App } = await vite.ssrLoadModule("/src/App.jsx");
  const contenido = renderToString(createElement(App));
  fs.writeFileSync(archivo, html.replace(MARCA, `<div id="root">${contenido}</div>`));
  console.log(`Prerenderizado: ${contenido.length.toLocaleString("es-CL")} caracteres de HTML en dist/index.html`);
} finally {
  await vite.close();
}

// Prerenderiza las páginas públicas: dibuja cada componente a HTML y lo inserta en su index.html de dist/,
// para que buscadores y vistas previas (LinkedIn, WhatsApp) vean el texto sin ejecutar JavaScript.
// Se ejecuta solo después de "vite build" (npm run build). En el navegador, cada main.jsx
// "hidrata" ese HTML y la página se vuelve interactiva igual que antes.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";
import { createElement } from "react";
import { renderToString } from "react-dom/server";

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MARCA = '<div id="root"></div>';

// html: archivo en dist/; modulo: componente a dibujar; extra: HTML adicional para <head> (opcional).
const PAGINAS = [
  { html: "index.html", modulo: "/src/App.jsx" },
  {
    html: "proyectos/latido-pos/index.html",
    modulo: "/src/proyectos/LatidoPos.jsx",
    extra: async (cargar) => {
      // Preguntas frecuentes como datos estructurados, desde el mismo texto que se ve en la página.
      const { latidoPos } = await cargar("/src/data/contenido.js");
      const faq = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: latidoPos.preguntas.map((q) => ({
          "@type": "Question",
          name: q.p,
          acceptedAnswer: { "@type": "Answer", text: q.r },
        })),
      };
      return `<script type="application/ld+json">${JSON.stringify(faq).replace(/</g, "\\u003c")}</script>`;
    },
  },
];

// Vite en modo "middleware" solo para cargar el JSX de src/ en Node (no abre ningún puerto).
const vite = await createServer({
  root: raiz,
  appType: "custom",
  server: { middlewareMode: true },
  logLevel: "error",
});

let fallo = false;
try {
  for (const pagina of PAGINAS) {
    const archivo = path.join(raiz, "dist", pagina.html);
    if (!fs.existsSync(archivo)) {
      console.error(`No existe dist/${pagina.html}. Ejecuta primero: vite build`);
      fallo = true;
      continue;
    }
    let html = fs.readFileSync(archivo, "utf8");
    if (!html.includes(MARCA)) {
      console.error(`dist/${pagina.html} no contiene <div id="root"></div> vacío (¿ya está prerenderizado?).`);
      fallo = true;
      continue;
    }
    const { default: Componente } = await vite.ssrLoadModule(pagina.modulo);
    const contenido = renderToString(createElement(Componente));
    html = html.replace(MARCA, `<div id="root">${contenido}</div>`);
    if (pagina.extra) html = html.replace("</head>", `${await pagina.extra((m) => vite.ssrLoadModule(m))}</head>`);
    fs.writeFileSync(archivo, html);
    console.log(`Prerenderizado: ${contenido.length.toLocaleString("es-CL")} caracteres de HTML en dist/${pagina.html}`);
  }
} finally {
  await vite.close();
}
if (fallo) process.exit(1);

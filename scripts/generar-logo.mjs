// Genera los archivos de marca de dehotel.cl (isotipo "Chevron d").
// Uso: npm run logo  → reescribe public/favicon.svg, public/apple-touch-icon.png,
// public/og-image.png y public/brand/*. El texto se convierte en trazos (no depende de fuentes instaladas).
import opentype from "opentype.js";
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PROY = path.join(RAIZ, "public");
const BRAND = path.join(PROY, "brand");
fs.mkdirSync(BRAND, { recursive: true });

const fuente = (peso) => {
  const buf = fs.readFileSync(
    path.join(RAIZ, `node_modules/@fontsource/space-grotesk/files/space-grotesk-latin-${peso}-normal.woff`)
  );
  return opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
};
const f700 = fuente(700);
const f500 = fuente(500);

const C = { cian: "#22d3ee", indigo: "#6366f1", noche: "#0b1020", texto: "#0f172a" };

// Isotipo en una grilla de 64x64 (mismo trazo que la propuesta aprobada).
const isotipo = (id = "g") => `
  <defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${C.cian}"/><stop offset="1" stop-color="${C.indigo}"/></linearGradient></defs>
  <rect width="64" height="64" rx="15" fill="url(#${id})"/>
  <path d="M34 24 L21 35 L34 46" fill="none" stroke="${C.noche}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M43 13 V47" fill="none" stroke="${C.noche}" stroke-width="6" stroke-linecap="round"/>`;

// Convierte texto en trazos, con espaciado entre letras (em) y kerning.
function trazos(font, texto, size, x, baseline, tracking = 0) {
  const escala = size / font.unitsPerEm;
  const glifos = font.stringToGlyphs(texto);
  const path = new opentype.Path();
  let cx = x;
  glifos.forEach((g, i) => {
    path.extend(g.getPath(cx, baseline, size));
    cx += g.advanceWidth * escala + tracking * size;
    if (glifos[i + 1]) cx += font.getKerningValue(g, glifos[i + 1]) * escala;
  });
  return { d: path.toPathData(2), ancho: cx - x - tracking * size, bbox: path.getBoundingBox() };
}

// Logo horizontal: isotipo + "dehotel" + ".cl", centrado verticalmente en 64 px.
function horizontal(colorNombre, colorDominio) {
  const size = 44;
  const x0 = 80;
  const prueba = trazos(f700, "dehotel.cl", size, x0, 0, -0.03);
  const baseline = 32 - (prueba.bbox.y1 + prueba.bbox.y2) / 2;
  const nombre = trazos(f700, "dehotel", size, x0, baseline, -0.03);
  const dominio = trazos(f700, ".cl", size, x0 + nombre.ancho - 0.03 * size, baseline, -0.03);
  const ancho = Math.ceil(dominio.bbox.x2 + 2);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${ancho} 64" width="${ancho * 2}" height="128">
  <title>dehotel.cl</title>${isotipo()}
  <path fill="${colorNombre}" d="${nombre.d}"/>
  <path fill="${colorDominio}" d="${dominio.d}"/>
</svg>
`;
  return { svg, ancho, nombre, dominio, baseline };
}

const svgIsotipo = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <title>dehotel.cl</title>${isotipo()}
</svg>
`;

const claro = horizontal(C.texto, C.indigo);
const oscuro = horizontal("#ffffff", C.cian);

fs.writeFileSync(path.join(PROY, "favicon.svg"), svgIsotipo);
fs.writeFileSync(path.join(BRAND, "isotipo.svg"), svgIsotipo);
fs.writeFileSync(path.join(BRAND, "logo-horizontal.svg"), claro.svg);
fs.writeFileSync(path.join(BRAND, "logo-horizontal-blanco.svg"), oscuro.svg);

// PNG del isotipo (redes, WhatsApp, íconos de apps).
await sharp(Buffer.from(svgIsotipo), { density: 72 * (512 / 64) }).resize(512, 512).png().toFile(path.join(BRAND, "isotipo-512.png"));
await sharp(Buffer.from(svgIsotipo), { density: 72 * (180 / 64) }).resize(180, 180).png().toFile(path.join(PROY, "apple-touch-icon.png"));

// PNG del logo horizontal en ambas versiones (alto 256 px).
for (const [nombre, v] of [["logo-horizontal", claro], ["logo-horizontal-blanco", oscuro]]) {
  const alto = 256;
  await sharp(Buffer.from(v.svg), { density: 72 * (alto / 64) * 1.1 })
    .resize({ height: alto })
    .png()
    .toFile(path.join(BRAND, `${nombre}.png`));
}

// Imagen para compartir en redes (Open Graph, 1200x630).
{
  const escala = 2.6;
  const W = 1200, H = 630;
  const lw = oscuro.ancho * escala;
  const lx = (W - lw) / 2, ly = 215;
  const lema = trazos(f500, "Desarrollo de software, interfaces e integraciones", 34, 0, 0, -0.01);
  const lemaX = (W - lema.ancho) / 2;
  const lemaD = trazos(f500, "Desarrollo de software, interfaces e integraciones", 34, lemaX, 430, -0.01).d;
  const og = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="r1" cx="0.85" cy="0.15" r="0.6"><stop offset="0" stop-color="${C.indigo}" stop-opacity="0.45"/><stop offset="1" stop-color="${C.indigo}" stop-opacity="0"/></radialGradient>
    <radialGradient id="r2" cx="0.1" cy="0.95" r="0.55"><stop offset="0" stop-color="${C.cian}" stop-opacity="0.25"/><stop offset="1" stop-color="${C.cian}" stop-opacity="0"/></radialGradient>
    <pattern id="grid" width="56" height="56" patternUnits="userSpaceOnUse"><path d="M56 0H0V56" fill="none" stroke="#ffffff" stroke-opacity="0.05"/></pattern>
  </defs>
  <rect width="${W}" height="${H}" fill="${C.noche}"/>
  <rect width="${W}" height="${H}" fill="url(#grid)"/>
  <rect width="${W}" height="${H}" fill="url(#r1)"/>
  <rect width="${W}" height="${H}" fill="url(#r2)"/>
  <g transform="translate(${lx.toFixed(1)} ${ly}) scale(${escala})">${isotipo("og")}
    <path fill="#ffffff" d="${oscuro.nombre.d}"/>
    <path fill="${C.cian}" d="${oscuro.dominio.d}"/>
  </g>
  <path fill="#ffffff" fill-opacity="0.72" d="${lemaD}"/>
</svg>`;
  await sharp(Buffer.from(og)).png().toFile(path.join(PROY, "og-image.png"));
}

console.log("ancho logo horizontal:", claro.ancho, "· baseline:", claro.baseline.toFixed(2));
console.log("archivos:", fs.readdirSync(BRAND).join(", "));

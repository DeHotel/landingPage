// Publica dist/ en el hosting por FTP.
// Uso: npm run deploy   (compila y luego sube)
// Credenciales en .env.deploy (ver .env.deploy.example). Nunca se versiona.
import { Client } from "basic-ftp";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(raiz, "dist");
const configProd = path.join(raiz, "config.production.php");

function leerEnv(archivo) {
  if (!fs.existsSync(archivo)) {
    console.error(`No existe ${path.basename(archivo)}. Cópialo desde .env.deploy.example y complétalo.`);
    process.exit(1);
  }
  const env = {};
  for (const linea of fs.readFileSync(archivo, "utf8").split(/\r?\n/)) {
    const m = linea.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return env;
}

const env = leerEnv(path.join(raiz, ".env.deploy"));
const remoto = (env.FTP_REMOTE_DIR || "/public_html").replace(/\/$/, "");

if (!fs.existsSync(path.join(dist, "index.html"))) {
  console.error("No hay build en dist/. Ejecuta primero: npm run build");
  process.exit(1);
}

const client = new Client(30000);
try {
  await client.access({
    host: env.FTP_HOST,
    port: Number(env.FTP_PORT) || 21,
    user: env.FTP_USER,
    password: env.FTP_PASSWORD,
    secure: env.FTP_SECURE === "true",
    secureOptions: { rejectUnauthorized: env.FTP_INSECURE_TLS !== "true" },
  });
  console.log(`Conectado a ${env.FTP_HOST}. Subiendo dist/ a ${remoto} …`);

  // Los archivos de assets llevan hash en el nombre: se limpia la carpeta para no acumular versiones viejas.
  await client.ensureDir(remoto);
  try {
    await client.removeDir(`${remoto}/assets`);
  } catch {
    // no existía
  }

  await client.cd("/");
  await client.ensureDir(remoto);
  await client.uploadFromDir(dist);

  if (fs.existsSync(configProd)) {
    await client.cd("/");
    await client.ensureDir(`${remoto}/api`);
    await client.uploadFrom(configProd, "config.php");
    console.log("Subido config.production.php → api/config.php");
  } else {
    console.log("Aviso: no hay config.production.php; se mantiene el api/config.php que ya esté en el servidor.");
  }

  console.log("Publicación terminada.");
} catch (err) {
  console.error("Error al publicar:", err.message);
  process.exitCode = 1;
} finally {
  client.close();
}

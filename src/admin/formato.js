// Formatos de fecha/número. Las fechas vienen del servidor ya en hora de Chile
// ("YYYY-MM-DD HH:MM:SS"), así que se formatean como texto, sin convertir zonas horarias.

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sept", "oct", "nov", "dic"];
const DIAS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];

export const numero = (n) => new Intl.NumberFormat("es-CL").format(n ?? 0);

export const bytes = (n) => {
  if (n == null) return "—";
  const u = ["B", "KB", "MB", "GB", "TB"];
  let i = 0;
  while (n >= 1024 && i < u.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toLocaleString("es-CL", { maximumFractionDigits: i >= 3 ? 2 : 1 })} ${u[i]}`;
};

// 75 → "1:15", 3725 → "1:02:05"
export const duracion = (s) => {
  if (s == null) return null;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const seg = String(s % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${seg}` : `${m}:${seg}`;
};

export function fechaCorta(ymd) {
  const [, m, d] = ymd.split("-").map(Number);
  return `${d} ${MESES[m - 1]}`;
}

export function fechaLarga(ymd) {
  const [a, m, d] = ymd.split("-").map(Number);
  const dia = DIAS[new Date(a, m - 1, d).getDay()];
  return `${dia} ${d} ${MESES[m - 1]} ${a}`;
}

export function fechaHora(texto) {
  if (!texto) return "—";
  const [fecha, hora = ""] = texto.split(" ");
  const [a, m, d] = fecha.split("-");
  return `${d}-${m}-${a} ${hora.slice(0, 5)}`;
}

export function hoyYmd(desfaseDias = 0) {
  const d = new Date();
  d.setDate(d.getDate() + desfaseDias);
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

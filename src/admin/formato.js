// Formatos de fecha/número. Las fechas vienen del servidor ya en hora de Chile
// ("YYYY-MM-DD HH:MM:SS"), así que se formatean como texto, sin convertir zonas horarias.

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sept", "oct", "nov", "dic"];
const DIAS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];

export const numero = (n) => new Intl.NumberFormat("es-CL").format(n ?? 0);

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

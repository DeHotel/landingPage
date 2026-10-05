// Montos en pesos chilenos (sin decimales).

const formato = new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });

export const pesos = (n) => formato.format(n ?? 0);

// Para el campo de monto: "1234567" → "1.234.567" (solo dígitos).
export const separarMiles = (valor) => {
  const digitos = String(valor ?? "").replace(/\D/g, "").replace(/^0+(?=\d)/, "").slice(0, 12);
  return digitos.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

export const aNumero = (texto) => Number(String(texto ?? "").replace(/\D/g, "")) || 0;

const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const MESES_CORTOS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sept", "oct", "nov", "dic"];

// "2026-10" → "Octubre 2026"
export const nombreMes = (ym) => {
  const [a, m] = ym.split("-").map(Number);
  return `${MESES[m - 1]} ${a}`;
};

export const mesCorto = (ym) => MESES_CORTOS[Number(ym.split("-")[1]) - 1];

export const mesActual = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

export const moverMes = (ym, delta) => {
  const [a, m] = ym.split("-").map(Number);
  const d = new Date(a, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

// "2026-10-05" → "05-10-2026"
export const fechaCl = (ymd) => (ymd ? ymd.split("-").reverse().join("-") : "—");

export const hoyIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

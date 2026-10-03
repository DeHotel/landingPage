// Utilidades para datos chilenos: RUT y regiones.

// "123456789" o "12.345.678-9" → "12.345.678-9" (mientras se escribe).
export function formatearRut(valor) {
  const limpio = String(valor ?? "").replace(/[^0-9kK]/g, "").toUpperCase().slice(0, 10);
  if (limpio.length < 2) return limpio;
  const cuerpo = limpio.slice(0, -1).replace(/^0+/, "");
  const dv = limpio.slice(-1);
  return `${cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}-${dv}`;
}

// Módulo 11 del SII. Vacío cuenta como válido (el RUT es opcional).
export function rutValido(valor) {
  const limpio = String(valor ?? "").replace(/[^0-9kK]/g, "").toUpperCase();
  if (!limpio) return true;
  if (!/^\d{1,9}[0-9K]$/.test(limpio)) return false;
  const cuerpo = limpio.slice(0, -1);
  let suma = 0;
  let factor = 2;
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += Number(cuerpo[i]) * factor;
    factor = factor === 7 ? 2 : factor + 1;
  }
  const resto = 11 - (suma % 11);
  const dv = resto === 11 ? "0" : resto === 10 ? "K" : String(resto);
  return dv === limpio.slice(-1);
}

export const REGIONES = [
  "Arica y Parinacota",
  "Tarapacá",
  "Antofagasta",
  "Atacama",
  "Coquimbo",
  "Valparaíso",
  "Metropolitana de Santiago",
  "Libertador General Bernardo O'Higgins",
  "Maule",
  "Ñuble",
  "Biobío",
  "La Araucanía",
  "Los Ríos",
  "Los Lagos",
  "Aysén del General Carlos Ibáñez del Campo",
  "Magallanes y de la Antártica Chilena",
];

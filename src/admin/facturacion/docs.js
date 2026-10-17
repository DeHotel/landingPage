// Datos y cálculos compartidos de los documentos (mismo cálculo que el servidor).

export const TIPOS = {
  cotizacion: { nombre: "Cotización", plural: "Cotizaciones", prefijo: "COT", nuevo: "Nueva cotización" },
  factura_exenta: { nombre: "Factura exenta", plural: "Facturas exentas", prefijo: "FEX", nuevo: "Nueva factura exenta" },
  boleta_honorarios: { nombre: "Boleta de honorarios", plural: "Boletas de honorarios", prefijo: "BHE", nuevo: "Nueva boleta de honorarios" },
};

export const ESTADOS = {
  cotizacion: [
    ["borrador", "Borrador"],
    ["enviada", "Enviada"],
    ["aceptada", "Aceptada"],
    ["rechazada", "Rechazada"],
  ],
  factura_exenta: [
    ["por_emitir", "Por emitir en el SII"],
    ["emitida", "Emitida"],
    ["pagada", "Pagada"],
    ["anulada", "Anulada"],
  ],
};
ESTADOS.boleta_honorarios = ESTADOS.factura_exenta;

export const nombreEstado = (tipo, estado) => ESTADOS[tipo].find(([e]) => e === estado)?.[1] ?? estado;

export const llevaRetencion = (tipo, modalidad) => tipo === "boleta_honorarios" || (tipo === "cotizacion" && modalidad === "honorarios");

export const totalLinea = (it) => Math.round((Number(String(it.cantidad).replace(",", ".")) || 0) * (Number(String(it.precio_unitario).replace(/\D/g, "")) || 0));

export function calcularTotales(items, descuento, tipo, modalidad, retencionPct) {
  const subtotal = items.filter((i) => i.descripcion?.trim()).reduce((s, i) => s + totalLinea(i), 0);
  const desc = Math.max(0, Math.min(Number(String(descuento).replace(/\D/g, "")) || 0, subtotal));
  const total = subtotal - desc;
  const pct = llevaRetencion(tipo, modalidad) ? Number(retencionPct) || 0 : null;
  const retencion = pct !== null ? Math.round((total * pct) / 100) : 0;
  return { subtotal, descuento: desc, total, retencion_pct: pct, retencion, liquido: total - retencion };
}

export const sumarDias = (ymd, dias) => {
  const [a, m, d] = ymd.split("-").map(Number);
  const f = new Date(a, m - 1, d + dias);
  return `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, "0")}-${String(f.getDate()).padStart(2, "0")}`;
};

export const porcentaje = (n) => `${String(n).replace(".", ",")}%`;

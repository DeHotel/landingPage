import { api } from "../api";
import { fechaCl, pesos } from "../finanzas/dinero";
import { formatearRut } from "../chile";
import { llevaRetencion, nombreEstado, porcentaje, TIPOS } from "./docs";

const esc = (v) =>
  String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const multilinea = (v) => esc(v).replace(/\n/g, "<br>");

const ESTILOS = `
  *{box-sizing:border-box} body{margin:0;background:#e9ecf4;font:13px/1.5 Inter,system-ui,-apple-system,"Segoe UI",sans-serif;color:#0f172a}
  .barra{position:sticky;top:0;display:flex;gap:12px;align-items:center;justify-content:center;padding:12px;background:#0b1020;color:#fff;font-size:13px}
  .barra button{padding:9px 18px;border:0;border-radius:9px;background:linear-gradient(135deg,#22d3ee,#6366f1);color:#0b1020;font-weight:700;cursor:pointer}
  .hoja{width:210mm;min-height:297mm;margin:20px auto;padding:16mm 15mm;background:#fff;box-shadow:0 10px 40px rgba(15,23,42,.15)}
  .cab{display:flex;justify-content:space-between;align-items:flex-start;gap:20px;padding-bottom:14px;border-bottom:2px solid #0b1020}
  .cab img{height:46px}
  .emisor{margin-top:8px;font-size:11.5px;color:#475569}
  .emisor b{color:#0f172a;font-size:12.5px}
  .caja{min-width:200px;padding:12px 16px;border:2px solid #6366f1;border-radius:10px;text-align:center}
  .caja .tipo{font-weight:800;font-size:15px;letter-spacing:.04em;text-transform:uppercase}
  .caja .num{margin-top:2px;font-size:17px;font-weight:700;color:#4f46e5}
  .caja .datos{margin-top:6px;font-size:11.5px;color:#475569}
  .aviso{margin:12px 0 0;padding:8px 12px;border-radius:8px;background:#fff7ed;color:#9a3412;font-size:11.5px}
  .bloques{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:16px}
  .bloque{padding:10px 12px;border:1px solid #e2e7f1;border-radius:8px}
  .bloque h3{margin:0 0 4px;font-size:10.5px;letter-spacing:.08em;text-transform:uppercase;color:#64748b}
  .ref{margin-top:14px}
  table{width:100%;margin-top:16px;border-collapse:collapse}
  th{padding:8px;background:#0b1020;color:#fff;font-size:11px;text-align:left;text-transform:uppercase;letter-spacing:.05em}
  td{padding:8px;border-bottom:1px solid #e2e7f1;vertical-align:top}
  .der{text-align:right;white-space:nowrap}
  .totales{width:280px;margin:14px 0 0 auto}
  .totales div{display:flex;justify-content:space-between;padding:4px 0}
  .totales .grande{margin-top:4px;padding:8px 10px;border-radius:8px;background:#0b1020;color:#fff;font-weight:800;font-size:14px}
  .totales .liq{font-weight:700;border-top:1px solid #e2e7f1}
  .cond{margin-top:22px;padding:10px 12px;border-radius:8px;background:#f4f5fa;font-size:11.5px;color:#334155}
  .pie{margin-top:28px;padding-top:10px;border-top:1px solid #e2e7f1;text-align:center;font-size:11px;color:#64748b}
  @media print{body{background:#fff}.barra{display:none}.hoja{margin:0;width:auto;min-height:auto;box-shadow:none;padding:0}@page{size:A4;margin:14mm 12mm}}
`;

/**
 * Abre el documento en una ventana nueva, listo para imprimir o guardar como PDF.
 * La ventana se abre en el mismo clic (si no, el navegador la bloquea) y luego se llena.
 */
export async function abrirImpresion(id) {
  const ventana = window.open("", "_blank");
  if (!ventana) {
    window.alert("El navegador bloqueó la ventana: permite las ventanas emergentes para dehotel.cl.");
    return;
  }
  ventana.document.write("<!doctype html><title>Cargando…</title><p style='font-family:sans-serif;padding:20px'>Cargando documento…</p>");

  try {
    const { documento: d, items, cliente: c, config } = await api.documento(id);
    const e = config.emisor;
    const t = TIPOS[d.tipo];
    const conRetencion = llevaRetencion(d.tipo, d.modalidad);
    const esCotizacion = d.tipo === "cotizacion";
    const origen = window.location.origin;

    const filas = items
      .map(
        (i) => `<tr><td>${multilinea(i.descripcion)}</td><td class="der">${esc(String(i.cantidad).replace(".", ","))}</td><td>${esc(i.unidad)}</td><td class="der">${pesos(i.precio_unitario)}</td><td class="der">${pesos(i.total)}</td></tr>`
      )
      .join("");

    const html = `<!doctype html>
<html lang="es"><head><meta charset="utf-8">
<title>${esc(d.codigo)} – ${esc(c?.nombre ?? "")}</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
<style>${ESTILOS}</style></head><body>
<div class="barra"><span>Para guardarlo en PDF: «Imprimir» y elige «Guardar como PDF».</span><button onclick="window.print()">Imprimir / Guardar PDF</button></div>
<div class="hoja">
  <div class="cab">
    <div>
      <img src="${origen}/brand/logo-horizontal.png" alt="dehotel.cl">
      <div class="emisor">
        ${e.nombre ? `<b>${esc(e.nombre)}</b><br>` : ""}
        ${e.rut ? `RUT ${esc(formatearRut(e.rut))}<br>` : ""}
        ${e.giro ? `${esc(e.giro)}<br>` : ""}
        ${[e.direccion, e.comuna, e.ciudad].filter(Boolean).map(esc).join(", ")}${e.direccion || e.comuna ? "<br>" : ""}
        ${[e.email, e.telefono, e.sitio].filter(Boolean).map(esc).join(" · ")}
      </div>
    </div>
    <div class="caja">
      <div class="tipo">${esc(t.nombre)}</div>
      <div class="num">N° ${esc(d.codigo)}</div>
      <div class="datos">Fecha: ${fechaCl(d.fecha)}${d.vence ? `<br>${esCotizacion ? "Válida hasta" : "Vence"}: ${fechaCl(d.vence)}` : ""}${d.folio ? `<br>Folio SII: ${esc(d.folio)}` : ""}</div>
    </div>
  </div>
  ${
    esCotizacion
      ? ""
      : `<p class="aviso">Documento interno (${esc(nombreEstado(d.tipo, d.estado))}). No es válido como documento tributario: el documento oficial es el emitido en el SII${d.folio ? ` con folio ${esc(d.folio)}` : ""}.</p>`
  }
  <div class="bloques">
    <div class="bloque"><h3>Cliente</h3>
      ${c ? `<b>${esc(c.nombre)}</b><br>${c.rut ? `RUT ${esc(formatearRut(c.rut))}<br>` : ""}${c.giro ? `${esc(c.giro)}<br>` : ""}${[c.direccion, c.comuna, c.ciudad].filter(Boolean).map(esc).join(", ")}` : "—"}
    </div>
    <div class="bloque"><h3>Contacto</h3>
      ${c?.contacto ? `${esc(c.contacto)}<br>` : ""}${c?.email ? `${esc(c.email)}<br>` : ""}${c?.telefono ? esc(c.telefono) : ""}${!c?.contacto && !c?.email && !c?.telefono ? "—" : ""}
    </div>
  </div>
  ${d.referencia ? `<p class="ref"><b>Referencia:</b> ${esc(d.referencia)}</p>` : ""}
  <table><thead><tr><th>Descripción</th><th class="der">Cant.</th><th>Unidad</th><th class="der">Precio unit.</th><th class="der">Total</th></tr></thead><tbody>${filas}</tbody></table>
  <div class="totales">
    <div><span>Subtotal</span><span>${pesos(d.subtotal)}</span></div>
    ${d.descuento ? `<div><span>Descuento</span><span>− ${pesos(d.descuento)}</span></div>` : ""}
    <div class="grande"><span>${conRetencion ? "Total honorarios" : "Total"}</span><span>${pesos(d.total)}</span></div>
    ${conRetencion ? `<div><span>Retención ${porcentaje(d.retencion_pct)}</span><span>− ${pesos(d.retencion)}</span></div><div class="liq"><span>Líquido</span><span>${pesos(d.liquido)}</span></div>` : `<div><span>Exento de IVA</span><span></span></div>`}
  </div>
  ${d.condiciones ? `<div class="cond"><b>Condiciones</b><br>${multilinea(d.condiciones)}</div>` : ""}
  <div class="pie">${esc(e.nombre || "dehotel.cl")} · ${esc(e.sitio || "dehotel.cl")}${e.email ? ` · ${esc(e.email)}` : ""}</div>
</div>
</body></html>`;

    ventana.document.open();
    ventana.document.write(html);
    ventana.document.close();
  } catch (err) {
    ventana.document.body.innerHTML = `<p style="font-family:sans-serif;padding:20px;color:#b91c1c">No se pudo cargar el documento: ${esc(err.message)}</p>`;
  }
}

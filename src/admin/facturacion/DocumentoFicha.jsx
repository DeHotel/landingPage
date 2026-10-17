import { useEffect, useMemo, useRef, useState } from "react";
import { api, urlArchivoDocumento } from "../api";
import Ventana from "../Ventana";
import { hoyIso, pesos, separarMiles } from "../finanzas/dinero";
import { calcularTotales, ESTADOS, llevaRetencion, sumarDias, TIPOS, totalLinea } from "./docs";
import { abrirImpresion } from "./imprimir";

const itemVacio = () => ({ clave: Math.random(), producto_id: null, descripcion: "", cantidad: "1", unidad: "", precio_unitario: "" });

/**
 * Editor de cotizaciones, facturas exentas y boletas de honorarios.
 * Props: id (editar) o tipo (nuevo); config (emisor, clientes, retención…); productos.
 */
export default function DocumentoFicha({ id, tipo: tipoNuevo, config, productos, onGuardado, onAbrirOtro, onCerrar }) {
  const [doc, setDoc] = useState(null);
  const [items, setItems] = useState([]);
  const [extra, setExtra] = useState({ origen: null, derivados: [] });
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
  const [confirmar, setConfirmar] = useState(false);
  const original = useRef(null);
  const archivoInput = useRef(null);

  const cargar = (docId) =>
    api.documento(docId).then((r) => {
      const d = { ...r.documento, descuento: r.documento.descuento ? separarMiles(r.documento.descuento) : "", vence: r.documento.vence ?? "", folio: r.documento.folio ?? "", referencia: r.documento.referencia ?? "", notas: r.documento.notas ?? "", condiciones: r.documento.condiciones ?? "" };
      const its = r.items.map((i) => ({ ...i, clave: Math.random(), cantidad: String(i.cantidad).replace(".", ","), unidad: i.unidad ?? "", precio_unitario: separarMiles(i.precio_unitario) }));
      setDoc(d);
      setItems(its);
      setExtra({ origen: r.origen, derivados: r.derivados });
      original.current = JSON.stringify([d, its]);
    });

  useEffect(() => {
    if (id) {
      cargar(id).catch((e) => setError(e.message));
    } else {
      const hoy = hoyIso();
      const d = {
        id: null,
        tipo: tipoNuevo,
        modalidad: tipoNuevo === "boleta_honorarios" ? "honorarios" : "exenta",
        cliente_id: "",
        fecha: hoy,
        vence: tipoNuevo === "cotizacion" ? sumarDias(hoy, config.validez_cotizacion) : "",
        estado: ESTADOS[tipoNuevo][0][0],
        referencia: "",
        folio: "",
        descuento: "",
        retencion_pct: config.retencion_honorarios,
        notas: "",
        condiciones: tipoNuevo === "cotizacion" ? config.condiciones : "",
      };
      const its = [itemVacio()];
      setDoc(d);
      setItems(its);
      original.current = JSON.stringify([d, its]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const totales = useMemo(
    () => (doc ? calcularTotales(items, doc.descuento, doc.tipo, doc.modalidad, doc.retencion_pct ?? config.retencion_honorarios) : null),
    [doc, items, config.retencion_honorarios]
  );

  if (!doc) {
    return (
      <Ventana titulo="Cargando…" ancho="980px" onCerrar={onCerrar}>
        {error ? <p className="adm-error">{error}</p> : <div className="adm-centro adm-centro--bajo"><span className="adm-spinner" /></div>}
      </Ventana>
    );
  }

  const t = TIPOS[doc.tipo];
  const esCotizacion = doc.tipo === "cotizacion";
  const conRetencion = llevaRetencion(doc.tipo, doc.modalidad);
  const hayCambios = JSON.stringify([doc, items]) !== original.current;
  const cambiar = (campo) => (e) => setDoc((d) => ({ ...d, [campo]: e.target.value }));
  const cambiarItem = (clave, cambios) => setItems((its) => its.map((i) => (i.clave === clave ? { ...i, ...cambios } : i)));

  const elegirProducto = (clave, productoId) => {
    const p = productos.find((x) => x.id === Number(productoId));
    if (!p) return cambiarItem(clave, { producto_id: null });
    cambiarItem(clave, {
      producto_id: p.id,
      descripcion: p.descripcion ? `${p.nombre} — ${p.descripcion}` : p.nombre,
      unidad: p.unidad,
      precio_unitario: separarMiles(p.precio),
    });
  };

  const guardar = async (e) => {
    e?.preventDefault();
    setGuardando(true);
    setError("");
    setAviso("");
    try {
      const r = await api.guardarDocumento(
        { ...doc, descuento: totales.descuento },
        items.map((i) => ({ ...i, cantidad: String(i.cantidad).replace(",", "."), precio_unitario: String(i.precio_unitario).replace(/\D/g, "") }))
      );
      onGuardado(r.documento, doc.id ? "Cambios guardados." : `${t.nombre} ${r.documento.codigo} creada.`);
      if (doc.id) {
        // Mismo documento: la ventana sigue abierta, así que se recarga desde el servidor.
        await cargar(doc.id);
        setAviso("Cambios guardados.");
        setGuardando(false);
      }
    } catch (err) {
      setError(err.message);
      setGuardando(false);
    }
  };

  const convertir = async (a) => {
    if (hayCambios) return setError("Guarda los cambios antes de convertir la cotización.");
    try {
      const r = await api.convertirDocumento(doc.id, a);
      onAbrirOtro(r.documento.id, `Se creó ${TIPOS[a].nombre.toLowerCase()} ${r.documento.codigo} a partir de la cotización ${doc.codigo}.`);
    } catch (err) {
      setError(err.message);
    }
  };

  const subirArchivo = async (archivo) => {
    if (!archivo) return;
    setError("");
    try {
      const r = await api.subirArchivoDocumento(doc.id, archivo);
      setDoc((d) => ({ ...d, archivo: true, archivo_nombre: r.archivo_nombre }));
      original.current = JSON.stringify([{ ...doc, archivo: true, archivo_nombre: r.archivo_nombre }, items]);
      setAviso("Archivo del SII adjuntado.");
    } catch (err) {
      setError(err.message);
    }
  };

  const preguntar = () => !hayCambios || window.confirm("Hay cambios sin guardar. ¿Cerrar sin guardar?");
  const titulo = doc.id ? `${t.nombre} ${doc.codigo}` : t.nuevo;

  return (
    <>
      <Ventana titulo={titulo} ancho="980px" onCerrar={onCerrar} bloquear={preguntar}>
        <form className="adm-ficha" onSubmit={guardar}>
          {!esCotizacion && (
            <p className="adm-aviso">
              Este es un <b>registro interno</b>. El documento tributario válido se emite en el SII (sii.cl); luego anota aquí su folio y adjunta el PDF.
            </p>
          )}
          {(extra.origen || extra.derivados.length > 0) && (
            <p className="adm-texto-suave adm-ficha__nota">
              {extra.origen && (
                <>
                  Proviene de la cotización{" "}
                  <button type="button" className="adm-fac__vinculo" onClick={() => preguntar() && onAbrirOtro(extra.origen.id)}>
                    {extra.origen.codigo}
                  </button>
                  .{" "}
                </>
              )}
              {extra.derivados.length > 0 && (
                <>
                  Convertida en{" "}
                  {extra.derivados.map((x) => (
                    <button key={x.id} type="button" className="adm-fac__vinculo" onClick={() => preguntar() && onAbrirOtro(x.id)}>
                      {x.codigo}
                    </button>
                  ))}
                  .
                </>
              )}
            </p>
          )}

          <div className="adm-ficha__grilla adm-fac__cabecera">
            <label className="adm-campo adm-ficha__campo adm-ficha__campo--2">
              <span>Cliente *</span>
              <select className="adm-select adm-select--campo" value={doc.cliente_id ?? ""} onChange={cambiar("cliente_id")} required>
                <option value="">Elige un cliente…</option>
                {config.clientes
                  .filter((c) => !c.inactivo || c.id === Number(doc.cliente_id))
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
              </select>
              {config.clientes.length === 0 && <small>Primero crea el cliente en el módulo «Clientes».</small>}
            </label>
            <label className="adm-campo adm-ficha__campo">
              <span>Estado</span>
              <select className="adm-select adm-select--campo" value={doc.estado} onChange={cambiar("estado")}>
                {ESTADOS[doc.tipo].map(([v, txt]) => (
                  <option key={v} value={v}>
                    {txt}
                  </option>
                ))}
              </select>
            </label>
            <label className="adm-campo adm-ficha__campo">
              <span>Fecha</span>
              <input type="date" value={doc.fecha} onChange={cambiar("fecha")} required />
            </label>
            <label className="adm-campo adm-ficha__campo">
              <span>{esCotizacion ? "Válida hasta" : "Vence el pago"}</span>
              <input type="date" value={doc.vence} onChange={cambiar("vence")} />
            </label>
            {esCotizacion ? (
              <label className="adm-campo adm-ficha__campo">
                <span>Se emitirá como</span>
                <select className="adm-select adm-select--campo" value={doc.modalidad} onChange={cambiar("modalidad")}>
                  <option value="exenta">Factura exenta</option>
                  <option value="honorarios">Boleta de honorarios</option>
                </select>
              </label>
            ) : (
              <label className="adm-campo adm-ficha__campo">
                <span>Folio del SII</span>
                <input value={doc.folio} onChange={cambiar("folio")} maxLength={20} placeholder="Al emitirla en el SII" />
              </label>
            )}
            <label className="adm-campo adm-ficha__campo adm-ficha__campo--3">
              <span>Referencia o proyecto</span>
              <input value={doc.referencia} onChange={cambiar("referencia")} maxLength={150} placeholder="Ej.: Desarrollo del sistema de reservas" />
            </label>
          </div>

          <fieldset className="adm-ficha__grupo">
            <legend>Detalle</legend>
            <div className="adm-tabla-caja">
              <table className="adm-tabla adm-fac__items">
                <thead>
                  <tr>
                    <th>Descripción</th>
                    <th className="adm-fac__col-cant">Cantidad</th>
                    <th className="adm-fac__col-unidad">Unidad</th>
                    <th className="adm-fac__col-precio">Precio unitario</th>
                    <th className="adm-fin__derecha">Total</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {items.map((it) => (
                    <tr key={it.clave}>
                      <td>
                        {productos.length > 0 && (
                          <select className="adm-select adm-fac__catalogo" value={it.producto_id ?? ""} onChange={(e) => elegirProducto(it.clave, e.target.value)} aria-label="Elegir del catálogo">
                            <option value="">Del catálogo…</option>
                            {productos.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.nombre} · {pesos(p.precio)}/{p.unidad}
                              </option>
                            ))}
                          </select>
                        )}
                        <textarea rows={1} value={it.descripcion} maxLength={300} placeholder="Descripción del ítem" aria-label="Descripción" onChange={(e) => cambiarItem(it.clave, { descripcion: e.target.value })} />
                      </td>
                      <td>
                        <input inputMode="decimal" value={it.cantidad} aria-label="Cantidad" onChange={(e) => cambiarItem(it.clave, { cantidad: e.target.value.replace(/[^\d,.]/g, "") })} />
                      </td>
                      <td>
                        <input value={it.unidad} maxLength={30} aria-label="Unidad" onChange={(e) => cambiarItem(it.clave, { unidad: e.target.value })} />
                      </td>
                      <td>
                        <div className="adm-fin__monto">
                          <b>$</b>
                          <input inputMode="numeric" value={it.precio_unitario} aria-label="Precio unitario" onChange={(e) => cambiarItem(it.clave, { precio_unitario: separarMiles(e.target.value) })} />
                        </div>
                      </td>
                      <td className="adm-fin__derecha adm-nowrap">{pesos(totalLinea(it))}</td>
                      <td>
                        <button type="button" className="adm-cola__quitar" aria-label="Quitar ítem" onClick={() => setItems((its) => (its.length > 1 ? its.filter((x) => x.clave !== it.clave) : [itemVacio()]))}>
                          ×
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button type="button" className="adm-grupos__nuevo" onClick={() => setItems((its) => [...its, itemVacio()])}>
              + Agregar ítem
            </button>
          </fieldset>

          <div className="adm-fac__pie">
            <div className="adm-fac__textos">
              <label className="adm-campo">
                <span>Condiciones (se muestran en el documento)</span>
                <textarea className="adm-ficha__notas" rows={3} value={doc.condiciones} onChange={cambiar("condiciones")} maxLength={5000} />
              </label>
              <label className="adm-campo">
                <span>Notas internas (no se imprimen)</span>
                <textarea className="adm-ficha__notas" rows={2} value={doc.notas} onChange={cambiar("notas")} maxLength={5000} />
              </label>
            </div>
            <dl className="adm-fac__totales">
              <div>
                <dt>Subtotal</dt>
                <dd>{pesos(totales.subtotal)}</dd>
              </div>
              <div>
                <dt>Descuento</dt>
                <dd>
                  <div className="adm-fin__monto adm-fac__descuento">
                    <b>$</b>
                    <input inputMode="numeric" value={doc.descuento} aria-label="Descuento" placeholder="0" onChange={(e) => setDoc((d) => ({ ...d, descuento: separarMiles(e.target.value) }))} />
                  </div>
                </dd>
              </div>
              <div className="adm-fac__total">
                <dt>{conRetencion ? "Total honorarios (bruto)" : "Total (exento de IVA)"}</dt>
                <dd>{pesos(totales.total)}</dd>
              </div>
              {conRetencion && (
                <>
                  <div>
                    <dt>
                      Retención{" "}
                      <input className="adm-fac__pct" inputMode="decimal" value={String(doc.retencion_pct ?? config.retencion_honorarios).replace(".", ",")} aria-label="Porcentaje de retención" onChange={(e) => setDoc((d) => ({ ...d, retencion_pct: e.target.value.replace(",", ".").replace(/[^\d.]/g, "") }))} />
                      %
                    </dt>
                    <dd>− {pesos(totales.retencion)}</dd>
                  </div>
                  <div className="adm-fac__liquido">
                    <dt>Líquido</dt>
                    <dd>{pesos(totales.liquido)}</dd>
                  </div>
                </>
              )}
            </dl>
          </div>

          {!esCotizacion && doc.id && (
            <div className="adm-fin__comprobante">
              <span className="adm-fin__comprobante-titulo">Documento emitido en el SII</span>
              {doc.archivo ? (
                <div className="adm-fin__archivo">
                  <span>📄</span>
                  <span className="adm-fin__archivo-nombre">{doc.archivo_nombre}</span>
                  <a className="adm-boton adm-boton--suave" href={urlArchivoDocumento(doc.id)} target="_blank" rel="noreferrer">
                    Ver
                  </a>
                  <button type="button" className="adm-boton adm-boton--suave" onClick={() => archivoInput.current.click()}>
                    Cambiar
                  </button>
                  <button
                    type="button"
                    className="adm-boton adm-boton--suave adm-boton--texto-peligro"
                    onClick={() => api.quitarArchivoDocumento(doc.id).then(() => setDoc((d) => ({ ...d, archivo: false, archivo_nombre: null }))).catch((e2) => setError(e2.message))}
                  >
                    Quitar
                  </button>
                </div>
              ) : (
                <button type="button" className="adm-grupos__nuevo" onClick={() => archivoInput.current.click()}>
                  + Adjuntar PDF del SII
                </button>
              )}
              <input ref={archivoInput} type="file" hidden accept="application/pdf,image/jpeg,image/png" onChange={(e) => { subirArchivo(e.target.files[0]); e.target.value = ""; }} />
            </div>
          )}

          {aviso && <p className="adm-aviso">{aviso}</p>}
          {error && <p className="adm-error">{error}</p>}

          <footer className="adm-ventana__pie">
            <div className="adm-ficha__botones">
              {doc.id &&
                (confirmar ? (
                  <span className="adm-confirmar">
                    ¿Eliminar {doc.codigo}?
                    <button type="button" className="adm-boton adm-boton--peligro" onClick={() => api.eliminarDocumento(doc.id).then(() => onGuardado(null, `${doc.codigo} eliminada.`)).catch((e2) => { setError(e2.message); setConfirmar(false); })}>
                      Sí
                    </button>
                    <button type="button" className="adm-boton adm-boton--suave" onClick={() => setConfirmar(false)}>
                      No
                    </button>
                  </span>
                ) : (
                  <button type="button" className="adm-boton adm-boton--suave adm-boton--texto-peligro" onClick={() => setConfirmar(true)}>
                    Eliminar
                  </button>
                ))}
              {doc.id && (
                <button type="button" className="adm-boton adm-boton--suave" onClick={() => (hayCambios ? setError("Guarda los cambios antes de generar el PDF.") : abrirImpresion(doc.id))}>
                  {esCotizacion ? "Ver / descargar PDF" : "Vista previa"}
                </button>
              )}
              {esCotizacion && doc.id && extra.derivados.length === 0 && (
                <button type="button" className="adm-boton adm-boton--suave" onClick={() => convertir(doc.modalidad === "honorarios" ? "boleta_honorarios" : "factura_exenta")}>
                  Convertir en {doc.modalidad === "honorarios" ? "boleta de honorarios" : "factura exenta"}
                </button>
              )}
            </div>
            <div className="adm-ficha__botones">
              <button type="button" className="adm-boton adm-boton--suave" onClick={() => preguntar() && onCerrar()}>
                Cerrar
              </button>
              <button className="adm-boton" disabled={guardando}>
                {guardando ? "Guardando…" : doc.id ? "Guardar cambios" : "Crear"}
              </button>
            </div>
          </footer>
        </form>
      </Ventana>
    </>
  );
}

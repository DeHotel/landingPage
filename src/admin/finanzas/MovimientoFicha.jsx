import { useEffect, useMemo, useRef, useState } from "react";
import { api, urlComprobante } from "../api";
import Ventana from "../Ventana";
import { aNumero, hoyIso, pesos, separarMiles } from "./dinero";

const TIPOS_ARCHIVO = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const CLAVE_ULTIMA_CUENTA = "dh_fin_cuenta";

// Cuenta sugerida: la última usada en este navegador (si sigue activa), o la primera activa.
function cuentaSugerida(cuentas) {
  let ultima = null;
  try {
    ultima = Number(localStorage.getItem(CLAVE_ULTIMA_CUENTA));
  } catch {
    // sin almacenamiento
  }
  return (cuentas.find((c) => c.activa && c.id === ultima) ?? cuentas.find((c) => c.activa))?.id ?? "";
}

// Fotos grandes (celular): se reducen a 2000 px y JPEG antes de subir.
async function prepararArchivo(archivo) {
  if (!archivo.type.startsWith("image/") || (archivo.size < 1.5 * 1024 * 1024 && archivo.type !== "image/png")) return archivo;
  try {
    const bitmap = await createImageBitmap(archivo);
    const escala = Math.min(1, 2000 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * escala);
    canvas.height = Math.round(bitmap.height * escala);
    canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((r) => canvas.toBlob(r, "image/jpeg", 0.85));
    return blob && blob.size < archivo.size ? new File([blob], archivo.name.replace(/\.\w+$/, ".jpg"), { type: "image/jpeg" }) : archivo;
  } catch {
    return archivo;
  }
}

/**
 * Ficha de movimiento (crear o editar). "inicial" trae los datos del movimiento
 * existente o los valores por defecto (tipo, cuenta).
 */
export default function MovimientoFicha({ inicial, catalogos, onGuardado, onEliminado, onCerrar }) {
  const existente = Boolean(inicial?.id);
  const [m, setM] = useState(() => ({
    id: inicial?.id ?? null,
    tipo: inicial?.tipo ?? "egreso",
    fecha: inicial?.fecha ?? hoyIso(),
    cuenta_id: inicial?.cuenta_id ?? cuentaSugerida(catalogos.cuentas),
    categoria_id: inicial?.categoria_id ?? "",
    descripcion: inicial?.descripcion ?? "",
    monto: inicial?.monto ? separarMiles(inicial.monto) : "",
    estado: inicial?.estado ?? "pagado",
    cliente_id: inicial?.cliente_id ?? "",
    notas: inicial?.notas ?? "",
  }));
  const [comprobante, setComprobante] = useState(
    inicial?.comprobante ? { nombre: inicial.comprobante_nombre, mime: inicial.comprobante_mime, guardado: true } : null
  );
  const [archivoNuevo, setArchivoNuevo] = useState(null);
  const [quitarArchivo, setQuitarArchivo] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [confirmar, setConfirmar] = useState(false);
  const [error, setError] = useState("");
  const input = useRef(null);
  const original = useRef(JSON.stringify(m));

  const categorias = useMemo(() => catalogos.categorias.filter((c) => c.tipo === m.tipo), [catalogos, m.tipo]);
  const hayCambios = JSON.stringify(m) !== original.current || archivoNuevo || quitarArchivo;
  const cambiar = (campo) => (e) => setM((x) => ({ ...x, [campo]: e.target.value }));

  // Al cambiar de tipo, la categoría elegida deja de servir.
  useEffect(() => {
    if (m.categoria_id && !categorias.some((c) => c.id === Number(m.categoria_id))) setM((x) => ({ ...x, categoria_id: "" }));
  }, [categorias, m.categoria_id]);

  const elegirArchivo = async (archivo) => {
    if (!archivo) return;
    if (!TIPOS_ARCHIVO.includes(archivo.type)) return setError("Formato no permitido: usa una foto (JPG, PNG, WebP) o un PDF.");
    setError("");
    const listo = await prepararArchivo(archivo);
    setArchivoNuevo(listo);
    setQuitarArchivo(false);
    setComprobante({ nombre: listo.name, mime: listo.type, guardado: false });
  };

  const guardar = async (e) => {
    e.preventDefault();
    if (!aNumero(m.monto)) return setError("Ingresa un monto mayor que cero.");
    setGuardando(true);
    setError("");
    try {
      const { movimiento } = await api.guardarMovimiento({
        ...m,
        monto: aNumero(m.monto),
        categoria_id: m.categoria_id || null,
        cliente_id: m.tipo === "ingreso" ? m.cliente_id || null : null,
      });
      try {
        localStorage.setItem(CLAVE_ULTIMA_CUENTA, String(movimiento.cuenta_id));
      } catch {
        // sin almacenamiento: no pasa nada
      }
      if (archivoNuevo) await api.subirComprobante(movimiento.id, archivoNuevo, archivoNuevo.name);
      else if (quitarArchivo) await api.quitarComprobante(movimiento.id);
      onGuardado(movimiento);
    } catch (err) {
      setError(err.message);
      setGuardando(false);
    }
  };

  const eliminar = async () => {
    setGuardando(true);
    try {
      await api.eliminarMovimiento(m.id);
      onEliminado(m.id);
    } catch (err) {
      setError(err.message);
      setGuardando(false);
      setConfirmar(false);
    }
  };

  const esIngreso = m.tipo === "ingreso";
  const titulo = existente ? m.descripcion || "Movimiento" : esIngreso ? "Nuevo ingreso" : "Nuevo egreso";
  const preguntar = () => !hayCambios || window.confirm("Hay cambios sin guardar. ¿Cerrar sin guardar?");

  return (
    <Ventana titulo={titulo} ancho="640px" onCerrar={onCerrar} bloquear={preguntar}>
      <form className="adm-ficha" onSubmit={guardar}>
        <div className={`adm-ficha__tipo adm-fin__tipo adm-fin__tipo--${m.tipo}`} role="radiogroup" aria-label="Tipo">
          {[
            ["ingreso", "↑ Ingreso"],
            ["egreso", "↓ Egreso"],
          ].map(([valor, texto]) => (
            <button key={valor} type="button" role="radio" aria-checked={m.tipo === valor} className={m.tipo === valor ? "activo" : ""} onClick={() => setM((x) => ({ ...x, tipo: valor }))}>
              {texto}
            </button>
          ))}
        </div>

        {inicial?.recurrente_id && (
          <p className="adm-aviso">
            {inicial.cuotas ? `Cuota ${inicial.cuota} de ${inicial.cuotas} de un pago recurrente` : "Generado por un pago recurrente"}. Los cambios aquí afectan solo a este mes; para cambiarlos todos, edita el recurrente.
          </p>
        )}

        <div className="adm-ficha__grilla">
          <label className="adm-campo adm-ficha__campo adm-ficha__campo--2">
            <span>Descripción *</span>
            <input value={m.descripcion} onChange={cambiar("descripcion")} maxLength={150} required autoFocus={!existente} placeholder={esIngreso ? "Ej.: Remuneración octubre" : "Ej.: Cuenta de internet"} />
          </label>
          <label className="adm-campo adm-ficha__campo">
            <span>Monto *</span>
            <div className="adm-fin__monto">
              <b>$</b>
              <input value={m.monto} inputMode="numeric" required onChange={(e) => setM((x) => ({ ...x, monto: separarMiles(e.target.value) }))} placeholder="0" />
            </div>
          </label>
          <label className="adm-campo adm-ficha__campo">
            <span>Fecha</span>
            <input type="date" value={m.fecha} onChange={cambiar("fecha")} required />
          </label>
          <label className="adm-campo adm-ficha__campo">
            <span>Cuenta</span>
            <select className="adm-select adm-select--campo" value={m.cuenta_id} onChange={cambiar("cuenta_id")} required>
              {catalogos.cuentas
                .filter((c) => c.activa || c.id === Number(m.cuenta_id))
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
            </select>
          </label>
          <label className="adm-campo adm-ficha__campo">
            <span>Categoría</span>
            <select className="adm-select adm-select--campo" value={m.categoria_id ?? ""} onChange={cambiar("categoria_id")}>
              <option value="">Sin categoría</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </label>
          <label className="adm-campo adm-ficha__campo">
            <span>Estado</span>
            <select className="adm-select adm-select--campo" value={m.estado} onChange={cambiar("estado")}>
              <option value="pagado">{esIngreso ? "Recibido" : "Pagado"}</option>
              <option value="pendiente">{esIngreso ? "Por cobrar" : "Por pagar"}</option>
            </select>
          </label>
          {esIngreso && catalogos.clientes.length > 0 && (
            <label className="adm-campo adm-ficha__campo adm-ficha__campo--2">
              <span>Cliente (opcional)</span>
              <select className="adm-select adm-select--campo" value={m.cliente_id ?? ""} onChange={cambiar("cliente_id")}>
                <option value="">—</option>
                {catalogos.clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="adm-campo adm-ficha__campo adm-ficha__campo--3">
            <span>Notas</span>
            <textarea className="adm-ficha__notas" rows={2} value={m.notas ?? ""} onChange={cambiar("notas")} maxLength={5000} />
          </label>
        </div>

        <div className="adm-fin__comprobante">
          <span className="adm-fin__comprobante-titulo">Comprobante</span>
          {comprobante && !quitarArchivo ? (
            <div className="adm-fin__archivo">
              <span>{comprobante.mime === "application/pdf" ? "📄" : "🖼️"}</span>
              <span className="adm-fin__archivo-nombre">{comprobante.nombre}</span>
              {comprobante.guardado && (
                <a className="adm-boton adm-boton--suave" href={urlComprobante(m.id)} target="_blank" rel="noreferrer">
                  Ver
                </a>
              )}
              <button type="button" className="adm-boton adm-boton--suave" onClick={() => input.current.click()}>
                Cambiar
              </button>
              <button
                type="button"
                className="adm-boton adm-boton--suave adm-boton--texto-peligro"
                onClick={() => {
                  setArchivoNuevo(null);
                  setQuitarArchivo(comprobante.guardado);
                  if (!comprobante.guardado) setComprobante(null);
                }}
              >
                Quitar
              </button>
            </div>
          ) : (
            <button type="button" className="adm-grupos__nuevo" onClick={() => input.current.click()}>
              + Adjuntar foto o PDF
            </button>
          )}
          <input ref={input} type="file" hidden accept="image/jpeg,image/png,image/webp,application/pdf" onChange={(e) => { elegirArchivo(e.target.files[0]); e.target.value = ""; }} />
        </div>

        {error && <p className="adm-error">{error}</p>}

        <footer className="adm-ventana__pie">
          {existente ? (
            confirmar ? (
              <div className="adm-confirmar">
                <span>¿Eliminar este movimiento?</span>
                <button type="button" className="adm-boton adm-boton--peligro" onClick={eliminar} disabled={guardando}>
                  Sí, eliminar
                </button>
                <button type="button" className="adm-boton adm-boton--suave" onClick={() => setConfirmar(false)}>
                  No
                </button>
              </div>
            ) : (
              <button type="button" className="adm-boton adm-boton--suave adm-boton--texto-peligro" onClick={() => setConfirmar(true)}>
                Eliminar
              </button>
            )
          ) : (
            <span className="adm-texto-suave">{m.monto ? pesos(aNumero(m.monto)) : ""}</span>
          )}
          <div className="adm-ficha__botones">
            <button type="button" className="adm-boton adm-boton--suave" onClick={() => preguntar() && onCerrar()}>
              Cancelar
            </button>
            <button className="adm-boton" disabled={guardando}>
              {guardando ? "Guardando…" : existente ? "Guardar cambios" : esIngreso ? "Registrar ingreso" : "Registrar egreso"}
            </button>
          </div>
        </footer>
      </form>
    </Ventana>
  );
}

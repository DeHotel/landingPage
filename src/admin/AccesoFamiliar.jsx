import { useCallback, useEffect, useState } from "react";
import { api } from "./api";
import { fechaHora } from "./formato";
import Ventana from "./Ventana";

const CLAVE_MIN = 8;

// Administración de dehotel.cl/familia/: clave general, activar/desactivar e ingresos.
export default function AccesoFamiliar({ onCerrar }) {
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
  const [clave, setClave] = useState({ nueva: "", repetir: "" });
  const [ver, setVer] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const enlace = `${location.origin}/familia/`;

  const cargar = useCallback(
    () =>
      api
        .familia()
        .then(setDatos)
        .catch((e) => setError(e.message)),
    []
  );

  useEffect(() => {
    cargar();
  }, [cargar]);

  const accion = async (fn, mensaje) => {
    setOcupado(true);
    setError("");
    setAviso("");
    try {
      await fn();
      setAviso(mensaje);
      await cargar();
      return true;
    } catch (e) {
      setError(e.message);
      return false;
    } finally {
      setOcupado(false);
    }
  };

  const guardarClave = (e) => {
    e.preventDefault();
    if (clave.nueva.length < CLAVE_MIN) return setError(`La clave debe tener al menos ${CLAVE_MIN} caracteres.`);
    if (clave.nueva !== clave.repetir) return setError("Las claves no coinciden.");
    accion(
      () => api.familiaClave(clave.nueva),
      datos.tieneClave
        ? "Clave cambiada. Quienes tenían la anterior deberán ingresar la nueva."
        : "Clave guardada. La página familiar ya está activa."
    ).then((ok) => ok && setClave({ nueva: "", repetir: "" }));
  };

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(enlace);
      setAviso("Enlace copiado. Envíalo junto con la clave a tu familia.");
    } catch {
      setAviso(`Copia este enlace: ${enlace}`);
    }
  };

  return (
    <Ventana titulo="Acceso familiar" ancho="720px" onCerrar={onCerrar}>
      {!datos && !error && (
        <div className="adm-centro adm-centro--bajo">
          <span className="adm-spinner" aria-label="Cargando" />
        </div>
      )}
      {error && <p className="adm-error">{error}</p>}
      {aviso && <p className="adm-aviso">{aviso}</p>}

      {datos && (
        <>
          <p className="adm-texto-suave adm-familia__intro">
            Tu familia entra a <b>{enlace}</b> con una clave general y solo ve los videos marcados como «Visible para la
            familia» ({datos.videos.visibles} de {datos.videos.total}). No tiene acceso a este panel.
          </p>

          <div className="adm-familia__estado">
            <label className="adm-interruptor">
              <input
                type="checkbox"
                checked={datos.activo}
                disabled={!datos.tieneClave || ocupado}
                onChange={(e) =>
                  accion(
                    () => api.familiaActivo(e.target.checked),
                    e.target.checked ? "Página familiar activada." : "Página familiar desactivada: nadie puede entrar."
                  )
                }
              />
              <span className="adm-interruptor__pista" aria-hidden="true" />
              <span>
                <strong>{datos.activo ? "Activa" : "Desactivada"}</strong>
                <small className="adm-texto-suave">
                  {datos.tieneClave ? (datos.activo ? "Tu familia puede entrar con la clave." : "Nadie puede entrar por ahora.") : "Primero define una clave."}
                </small>
              </span>
            </label>
            <button className="adm-boton adm-boton--suave" onClick={copiar}>
              Copiar enlace
            </button>
          </div>

          <form className="adm-familia__clave" onSubmit={guardarClave}>
            <h3>{datos.tieneClave ? "Cambiar la clave familiar" : "Definir la clave familiar"}</h3>
            {datos.tieneClave && datos.claveCambiada && (
              <p className="adm-texto-suave">Última vez que se cambió: {fechaHora(datos.claveCambiada)}. Al cambiarla, todos deberán ingresar la nueva.</p>
            )}
            <div className="adm-familia__campos">
              <label className="adm-campo">
                <span>Nueva clave</span>
                <input
                  type={ver ? "text" : "password"}
                  value={clave.nueva}
                  minLength={CLAVE_MIN}
                  autoComplete="new-password"
                  onChange={(e) => setClave((c) => ({ ...c, nueva: e.target.value }))}
                />
              </label>
              <label className="adm-campo">
                <span>Repetir clave</span>
                <input
                  type={ver ? "text" : "password"}
                  value={clave.repetir}
                  autoComplete="new-password"
                  onChange={(e) => setClave((c) => ({ ...c, repetir: e.target.value }))}
                />
              </label>
            </div>
            <div className="adm-familia__botones">
              <label className="adm-check">
                <input type="checkbox" checked={ver} onChange={(e) => setVer(e.target.checked)} /> Mostrar clave
              </label>
              <button className="adm-boton" disabled={ocupado || !clave.nueva}>
                {datos.tieneClave ? "Cambiar clave" : "Guardar clave"}
              </button>
            </div>
            <small className="adm-texto-suave">
              Mínimo {CLAVE_MIN} caracteres. Usa algo fácil de recordar para tu familia pero difícil de adivinar (ej. una frase
              corta). Se guarda encriptada.
            </small>
          </form>

          <section>
            <div className="adm-tarjeta__titulo">
              <h3>Últimos ingresos</h3>
              {datos.tieneClave && (
                <button
                  className="adm-boton adm-boton--suave"
                  disabled={ocupado}
                  onClick={() => accion(() => api.familiaCerrarAccesos(), "Listo: todos deberán ingresar la clave de nuevo.")}
                >
                  Cerrar todos los accesos
                </button>
              )}
            </div>
            {datos.accesos.length === 0 ? (
              <p className="adm-vacio">Todavía nadie ha intentado entrar.</p>
            ) : (
              <div className="adm-tabla-caja">
                <table className="adm-tabla">
                  <thead>
                    <tr>
                      <th>Fecha y hora</th>
                      <th>Resultado</th>
                      <th>Dispositivo</th>
                      <th>IP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {datos.accesos.map((a) => (
                      <tr key={a.id}>
                        <td className="adm-nowrap">{fechaHora(a.creado_en)}</td>
                        <td>
                          <span className={`adm-etiqueta ${a.exito ? "" : "adm-etiqueta--mal"}`}>{a.exito ? "Entró" : "Clave incorrecta"}</span>
                        </td>
                        <td className="adm-nowrap">
                          {a.dispositivo ?? "—"} <span className="adm-texto-suave">· {a.navegador} · {a.sistema}</span>
                        </td>
                        <td>
                          <code className="adm-id">{a.ip}</code>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </Ventana>
  );
}

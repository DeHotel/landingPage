import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "./api";
import { fechaHora } from "./formato";
import { formatearRut, REGIONES, rutValido } from "./chile";
import Ventana from "./Ventana";

const VACIO = {
  tipo: "empresa",
  nombre: "",
  nombre_fantasia: "",
  rut: "",
  giro: "",
  email: "",
  telefono: "",
  sitio_web: "",
  direccion: "",
  comuna: "",
  ciudad: "",
  region: "",
  estado: "activo",
  notas: "",
};
const contactoVacio = () => ({ clave: Math.random(), id: null, nombre: "", cargo: "", email: "", telefono: "", principal: false });

/**
 * Ficha de cliente: crear (sin clienteId) o editar. "inicial" precarga datos
 * (ej. desde un mensaje web) y "desdeMensaje" vincula ese mensaje al guardar.
 */
export default function ClienteFicha({ clienteId, inicial, desdeMensaje, onGuardado, onEliminado, onCerrar }) {
  const [cliente, setCliente] = useState(() => ({ ...VACIO, ...(inicial?.cliente ?? {}) }));
  const [contactos, setContactos] = useState(() =>
    (inicial?.contactos ?? []).map((k) => ({ ...contactoVacio(), ...k }))
  );
  const [mensajes, setMensajes] = useState([]);
  const [meta, setMeta] = useState(null);
  const [cargando, setCargando] = useState(Boolean(clienteId));
  const [guardando, setGuardando] = useState(false);
  const [confirmar, setConfirmar] = useState(false);
  const [error, setError] = useState("");
  const original = useRef(null);

  useEffect(() => {
    if (!clienteId) {
      original.current = JSON.stringify([cliente, contactos]);
      return;
    }
    api
      .cliente(clienteId)
      .then((r) => {
        const c = Object.fromEntries(Object.entries({ ...VACIO, ...r.cliente }).map(([k, v]) => [k, v ?? ""]));
        c.rut = formatearRut(c.rut);
        const ks = r.contactos.map((k) => ({ ...contactoVacio(), ...Object.fromEntries(Object.entries(k).map(([a, b]) => [a, b ?? ""])) }));
        setCliente(c);
        setContactos(ks);
        setMensajes(r.mensajes);
        setMeta({ creado: r.cliente.creado_en, actualizado: r.cliente.actualizado_en });
        original.current = JSON.stringify([c, ks]);
      })
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clienteId]);

  const esEmpresa = cliente.tipo === "empresa";
  const rutOk = rutValido(cliente.rut);
  const hayCambios = useMemo(
    () => original.current !== null && original.current !== JSON.stringify([cliente, contactos]),
    [cliente, contactos]
  );

  const campo = (nombre) => ({
    value: cliente[nombre] ?? "",
    onChange: (e) => setCliente((c) => ({ ...c, [nombre]: e.target.value })),
  });

  const cambiarContacto = (clave, cambios) =>
    setContactos((ks) =>
      ks.map((k) => (k.clave === clave ? { ...k, ...cambios } : cambios.principal ? { ...k, principal: false } : k))
    );

  const guardar = async (e) => {
    e.preventDefault();
    if (!rutOk) return setError("El RUT no es válido: revisa el dígito verificador.");
    setGuardando(true);
    setError("");
    try {
      const r = await api.guardarCliente(
        { ...cliente, id: clienteId ?? undefined },
        contactos.map(({ clave, ...k }) => k),
        desdeMensaje
      );
      onGuardado(r.cliente);
    } catch (err) {
      setError(err.message);
      setGuardando(false);
    }
  };

  const eliminar = async () => {
    setGuardando(true);
    try {
      await api.eliminarCliente(clienteId);
      onEliminado(clienteId);
    } catch (err) {
      setError(err.message);
      setGuardando(false);
    }
  };

  const titulo = clienteId ? cliente.nombre || "Cliente" : desdeMensaje ? "Nuevo cliente desde mensaje web" : "Nuevo cliente";

  return (
    <Ventana
      titulo={titulo}
      ancho="820px"
      onCerrar={onCerrar}
      bloquear={() => !hayCambios || window.confirm("Hay cambios sin guardar. ¿Cerrar sin guardar?")}
    >
      {cargando ? (
        <div className="adm-centro adm-centro--bajo">
          <span className="adm-spinner" aria-label="Cargando" />
        </div>
      ) : (
        <form className="adm-ficha" onSubmit={guardar}>
          <div className="adm-ficha__tipo" role="radiogroup" aria-label="Tipo de cliente">
            {[
              ["empresa", "Empresa"],
              ["persona", "Persona natural"],
            ].map(([valor, texto]) => (
              <button
                key={valor}
                type="button"
                role="radio"
                aria-checked={cliente.tipo === valor}
                className={cliente.tipo === valor ? "activo" : ""}
                onClick={() => setCliente((c) => ({ ...c, tipo: valor }))}
              >
                {texto}
              </button>
            ))}
          </div>

          <fieldset className="adm-ficha__grupo">
            <legend>Datos {esEmpresa ? "de la empresa" : "del cliente"}</legend>
            <div className="adm-ficha__grilla">
              <Campo etiqueta={esEmpresa ? "Razón social *" : "Nombre completo *"} ancho={2}>
                <input {...campo("nombre")} required maxLength={150} autoFocus={!clienteId} />
              </Campo>
              <Campo etiqueta="RUT" ayuda={!rutOk ? "RUT inválido" : null} error={!rutOk}>
                <input
                  value={cliente.rut}
                  onChange={(e) => setCliente((c) => ({ ...c, rut: formatearRut(e.target.value) }))}
                  placeholder="12.345.678-9"
                  inputMode="text"
                  aria-invalid={!rutOk}
                />
              </Campo>
              {esEmpresa && (
                <>
                  <Campo etiqueta="Nombre de fantasía" ancho={2}>
                    <input {...campo("nombre_fantasia")} maxLength={150} />
                  </Campo>
                  <Campo etiqueta="Estado">
                    <SelectorEstado {...campo("estado")} />
                  </Campo>
                  <Campo etiqueta="Giro" ancho={3}>
                    <input {...campo("giro")} maxLength={150} placeholder="Ej.: Servicios de hotelería" />
                  </Campo>
                </>
              )}
              {!esEmpresa && (
                <Campo etiqueta="Estado">
                  <SelectorEstado {...campo("estado")} />
                </Campo>
              )}
            </div>
          </fieldset>

          <fieldset className="adm-ficha__grupo">
            <legend>Contacto y dirección</legend>
            <div className="adm-ficha__grilla">
              <Campo etiqueta="Correo">
                <input type="email" {...campo("email")} maxLength={160} />
              </Campo>
              <Campo etiqueta="Teléfono">
                <input type="tel" {...campo("telefono")} maxLength={40} />
              </Campo>
              <Campo etiqueta="Sitio web">
                <input {...campo("sitio_web")} maxLength={200} placeholder="empresa.cl" />
              </Campo>
              <Campo etiqueta="Dirección" ancho={3}>
                <input {...campo("direccion")} maxLength={200} />
              </Campo>
              <Campo etiqueta="Comuna">
                <input {...campo("comuna")} maxLength={80} />
              </Campo>
              <Campo etiqueta="Ciudad">
                <input {...campo("ciudad")} maxLength={80} />
              </Campo>
              <Campo etiqueta="Región">
                <select className="adm-select adm-select--campo" {...campo("region")}>
                  <option value="">—</option>
                  {REGIONES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </Campo>
            </div>
          </fieldset>

          <fieldset className="adm-ficha__grupo">
            <legend>Personas de contacto</legend>
            {contactos.length === 0 && <p className="adm-texto-suave adm-ficha__nota">Aún no hay personas de contacto.</p>}
            <div className="adm-ficha__contactos">
              {contactos.map((k) => (
                <div key={k.clave} className="adm-ficha__contacto">
                  <input placeholder="Nombre *" aria-label="Nombre del contacto" value={k.nombre} maxLength={120} onChange={(e) => cambiarContacto(k.clave, { nombre: e.target.value })} />
                  <input placeholder="Cargo" aria-label="Cargo" value={k.cargo} maxLength={100} onChange={(e) => cambiarContacto(k.clave, { cargo: e.target.value })} />
                  <input type="email" placeholder="Correo" aria-label="Correo del contacto" value={k.email} maxLength={160} onChange={(e) => cambiarContacto(k.clave, { email: e.target.value })} />
                  <input type="tel" placeholder="Teléfono" aria-label="Teléfono del contacto" value={k.telefono} maxLength={40} onChange={(e) => cambiarContacto(k.clave, { telefono: e.target.value })} />
                  <label className="adm-check" title="Contacto principal">
                    <input type="radio" name="principal" checked={k.principal} onChange={() => cambiarContacto(k.clave, { principal: true })} />
                    Principal
                  </label>
                  <button type="button" className="adm-cola__quitar" aria-label="Quitar contacto" onClick={() => setContactos((ks) => ks.filter((x) => x.clave !== k.clave))}>
                    ×
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              className="adm-grupos__nuevo"
              onClick={() => setContactos((ks) => [...ks, { ...contactoVacio(), principal: ks.length === 0 }])}
            >
              + Agregar contacto
            </button>
          </fieldset>

          <fieldset className="adm-ficha__grupo">
            <legend>Notas</legend>
            <textarea className="adm-ficha__notas" {...campo("notas")} rows={4} placeholder="Acuerdos, preferencias, historial…" />
          </fieldset>

          {mensajes.length > 0 && (
            <p className="adm-texto-suave adm-ficha__nota">
              Mensajes recibidos desde la web: {mensajes.map((m) => `${m.tema} (${fechaHora(m.creado_en).slice(0, 10)})`).join(" · ")}
            </p>
          )}
          {meta && (
            <p className="adm-texto-suave adm-ficha__nota">
              Creado el {fechaHora(meta.creado)} · Última modificación {fechaHora(meta.actualizado)}
            </p>
          )}

          {error && <p className="adm-error">{error}</p>}

          <footer className="adm-ventana__pie">
            {clienteId ? (
              confirmar ? (
                <div className="adm-confirmar">
                  <span>¿Eliminar este cliente y sus contactos?</span>
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
              <span />
            )}
            <div className="adm-ficha__botones">
              <button type="button" className="adm-boton adm-boton--suave" onClick={() => (!hayCambios || window.confirm("Hay cambios sin guardar. ¿Cerrar sin guardar?")) && onCerrar()}>
                Cancelar
              </button>
              <button className="adm-boton" disabled={guardando}>
                {guardando ? "Guardando…" : clienteId ? "Guardar cambios" : "Crear cliente"}
              </button>
            </div>
          </footer>
        </form>
      )}
    </Ventana>
  );
}

function Campo({ etiqueta, ayuda, error, ancho = 1, children }) {
  return (
    <label className={`adm-campo adm-ficha__campo adm-ficha__campo--${ancho} ${error ? "adm-ficha__campo--error" : ""}`}>
      <span>{etiqueta}</span>
      {children}
      {ayuda && <small>{ayuda}</small>}
    </label>
  );
}

function SelectorEstado(props) {
  return (
    <select className="adm-select adm-select--campo" {...props}>
      <option value="prospecto">Prospecto</option>
      <option value="activo">Activo</option>
      <option value="inactivo">Inactivo</option>
    </select>
  );
}

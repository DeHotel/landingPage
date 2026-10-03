import { useCallback, useEffect, useState } from "react";
import { api } from "./api";
import { fechaHora } from "./formato";
import ClienteFicha from "./ClienteFicha";

const ESTADOS = [
  ["nuevo", "Nuevos"],
  ["contactado", "Contactados"],
  ["descartado", "Descartados"],
  ["todos", "Todos"],
];

// Datos con que se precarga la ficha al convertir un mensaje en cliente.
function clienteDesdeMensaje(m) {
  const empresa = (m.empresa ?? "").trim();
  return {
    cliente: {
      tipo: empresa ? "empresa" : "persona",
      nombre: empresa || m.nombre,
      email: empresa ? "" : m.email,
      telefono: empresa ? "" : m.telefono ?? "",
      estado: "prospecto",
      notas: `Mensaje web del ${fechaHora(m.creado_en)} — ${m.tema}:\n${m.mensaje}`,
    },
    contactos: empresa ? [{ nombre: m.nombre, email: m.email, telefono: m.telefono ?? "", principal: true }] : [],
  };
}

export default function Mensajes({ onCambioNuevos }) {
  const [estado, setEstado] = useState("nuevo");
  const [pagina, setPagina] = useState(1);
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
  const [ficha, setFicha] = useState(null); // {mensaje} para convertir | {clienteId} para ver
  const [confirmar, setConfirmar] = useState(null);

  const cargar = useCallback(() => {
    setError("");
    api
      .mensajes({ estado: estado === "todos" ? "" : estado, pagina })
      .then((r) => {
        setDatos(r);
        onCambioNuevos?.(r.conteo.nuevo);
      })
      .catch((e) => setError(e.message));
  }, [estado, pagina, onCambioNuevos]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const accion = async (fn, mensaje) => {
    setError("");
    try {
      await fn();
      setAviso(mensaje);
      cargar();
    } catch (e) {
      setError(e.message);
    } finally {
      setConfirmar(null);
    }
  };

  return (
    <div className="adm-seccion">
      <div className="adm-filtros">
        <div className="adm-chips" role="group" aria-label="Estado de los mensajes">
          {ESTADOS.map(([id, texto]) => (
            <button
              key={id}
              className={estado === id ? "activo" : ""}
              onClick={() => {
                setEstado(id);
                setPagina(1);
              }}
            >
              {texto} {datos && <em className="adm-chips__n">{datos.conteo[id] ?? 0}</em>}
            </button>
          ))}
        </div>
        <span className="adm-texto-suave adm-videos__espacio">Mensajes del formulario de contacto de dehotel.cl</span>
      </div>

      {aviso && <p className="adm-aviso">{aviso}</p>}
      {error && <p className="adm-error">{error}</p>}

      {!datos && !error && (
        <div className="adm-centro adm-centro--bajo">
          <span className="adm-spinner" aria-label="Cargando" />
        </div>
      )}
      {datos && datos.mensajes.length === 0 && (
        <p className="adm-vacio">{estado === "nuevo" ? "No hay mensajes nuevos. ¡Al día!" : "No hay mensajes en esta categoría."}</p>
      )}

      <div className="adm-mensajes">
        {datos?.mensajes.map((m) => (
          <article key={m.id} className={`adm-mensaje adm-mensaje--${m.estado}`}>
            <header className="adm-mensaje__cabecera">
              <div>
                <strong>{m.nombre}</strong>
                {m.empresa && <span className="adm-texto-suave"> · {m.empresa}</span>}
                <div className="adm-mensaje__datos">
                  <a href={`mailto:${m.email}`}>{m.email}</a>
                  {m.telefono && <a href={`tel:${m.telefono.replace(/\s/g, "")}`}>{m.telefono}</a>}
                </div>
              </div>
              <div className="adm-mensaje__lado">
                <span className="adm-etiqueta">{m.tema}</span>
                <span className="adm-texto-suave adm-mensaje__fecha">{fechaHora(m.creado_en)}</span>
              </div>
            </header>
            <p className="adm-mensaje__texto">{m.mensaje}</p>
            <footer className="adm-mensaje__acciones">
              {m.cliente_id ? (
                <button className="adm-boton adm-boton--suave" onClick={() => setFicha({ clienteId: m.cliente_id })}>
                  Ver cliente: {m.cliente_nombre}
                </button>
              ) : (
                <button className="adm-boton" onClick={() => setFicha({ mensaje: m })}>
                  Convertir en cliente
                </button>
              )}
              <a
                className="adm-boton adm-boton--suave"
                href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.tema} — dehotel.cl`)}`}
              >
                Responder por correo
              </a>
              {m.estado !== "contactado" && (
                <button className="adm-boton adm-boton--suave" onClick={() => accion(() => api.estadoMensaje(m.id, "contactado"), "Marcado como contactado.")}>
                  Marcar contactado
                </button>
              )}
              {m.estado !== "descartado" && (
                <button className="adm-boton adm-boton--suave" onClick={() => accion(() => api.estadoMensaje(m.id, "descartado"), "Mensaje descartado.")}>
                  Descartar
                </button>
              )}
              {m.estado !== "nuevo" && (
                <button className="adm-boton adm-boton--suave" onClick={() => accion(() => api.estadoMensaje(m.id, "nuevo"), "Marcado como nuevo.")}>
                  Volver a nuevo
                </button>
              )}
              {confirmar === m.id ? (
                <span className="adm-confirmar">
                  ¿Eliminar para siempre?
                  <button className="adm-boton adm-boton--peligro" onClick={() => accion(() => api.eliminarMensaje(m.id), "Mensaje eliminado.")}>
                    Sí
                  </button>
                  <button className="adm-boton adm-boton--suave" onClick={() => setConfirmar(null)}>
                    No
                  </button>
                </span>
              ) : (
                <button className="adm-boton adm-boton--suave adm-boton--texto-peligro" onClick={() => setConfirmar(m.id)}>
                  Eliminar
                </button>
              )}
            </footer>
          </article>
        ))}
      </div>

      {datos && datos.paginas > 1 && (
        <div className="adm-paginacion">
          <span className="adm-texto-suave">
            Página {datos.pagina} de {datos.paginas}
          </span>
          <div>
            <button className="adm-boton adm-boton--suave" disabled={pagina <= 1} onClick={() => setPagina((p) => p - 1)}>
              ← Anterior
            </button>
            <button className="adm-boton adm-boton--suave" disabled={pagina >= datos.paginas} onClick={() => setPagina((p) => p + 1)}>
              Siguiente →
            </button>
          </div>
        </div>
      )}

      {ficha?.mensaje && (
        <ClienteFicha
          inicial={clienteDesdeMensaje(ficha.mensaje)}
          desdeMensaje={ficha.mensaje.id}
          onGuardado={(c) => {
            setFicha(null);
            setAviso(`Cliente «${c.nombre}» creado y vinculado al mensaje. Lo encuentras en «Clientes».`);
            cargar();
          }}
          onCerrar={() => setFicha(null)}
        />
      )}
      {ficha?.clienteId && (
        <ClienteFicha
          clienteId={ficha.clienteId}
          onGuardado={() => {
            setFicha(null);
            setAviso("Cambios del cliente guardados.");
            cargar();
          }}
          onEliminado={() => {
            setFicha(null);
            setAviso("Cliente eliminado (el mensaje se conserva).");
            cargar();
          }}
          onCerrar={() => setFicha(null)}
        />
      )}
    </div>
  );
}

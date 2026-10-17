import { useCallback, useEffect, useState } from "react";
import { api } from "../api";
import Ventana from "../Ventana";
import { pesos, separarMiles, aNumero } from "../finanzas/dinero";

export const UNIDADES = ["unidad", "hora", "día", "mes", "año", "proyecto", "licencia"];

// Módulo "Productos y servicios": catálogo para cotizaciones y facturas.
export default function Productos() {
  const [lista, setLista] = useState(null);
  const [buscar, setBuscar] = useState("");
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
  const [ficha, setFicha] = useState(null);

  const cargar = useCallback(
    () =>
      api
        .productos({ todos: 1, buscar })
        .then((r) => setLista(r.productos))
        .catch((e) => setError(e.message)),
    [buscar]
  );

  useEffect(() => {
    const t = setTimeout(cargar, 250);
    return () => clearTimeout(t);
  }, [cargar]);

  return (
    <div className="adm-seccion">
      <div className="adm-filtros">
        <input className="adm-buscar" type="search" placeholder="Buscar producto o servicio…" value={buscar} onChange={(e) => setBuscar(e.target.value)} />
        <span className="adm-texto-suave adm-videos__espacio">Se usan para armar cotizaciones y facturas rápidamente.</span>
        <button className="adm-boton adm-clientes__nuevo" onClick={() => setFicha({})}>
          + Nuevo producto o servicio
        </button>
      </div>
      {aviso && <p className="adm-aviso">{aviso}</p>}
      {error && <p className="adm-error">{error}</p>}

      {!lista ? (
        <div className="adm-centro adm-centro--bajo">
          <span className="adm-spinner" aria-label="Cargando" />
        </div>
      ) : lista.length === 0 && !buscar ? (
        <button className="adm-videos__vacio" onClick={() => setFicha({})}>
          <strong>Aún no tienes productos ni servicios</strong>
          <span>Por ejemplo: «Hora de desarrollo», «Mantención mensual» o «Sitio web corporativo».</span>
        </button>
      ) : (
        <section className="adm-tarjeta">
          {lista.length === 0 ? (
            <p className="adm-vacio">Nada coincide con «{buscar}».</p>
          ) : (
            <div className="adm-tabla-caja">
              <table className="adm-tabla adm-tabla--clic">
                <thead>
                  <tr>
                    <th>Producto o servicio</th>
                    <th>Unidad</th>
                    <th className="adm-fin__derecha">Precio</th>
                    <th>Usado en</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {lista.map((p) => (
                    <tr key={p.id} onClick={() => setFicha(p)} tabIndex={0} onKeyDown={(e) => e.key === "Enter" && setFicha(p)}>
                      <td>
                        <strong className="adm-clientes__nombre">{p.nombre}</strong>
                        {p.descripcion && <span className="adm-texto-suave adm-clientes__sub adm-fac__corto">{p.descripcion}</span>}
                      </td>
                      <td>{p.unidad}</td>
                      <td className="adm-fin__derecha adm-nowrap">{pesos(p.precio)}</td>
                      <td className="adm-texto-suave">{p.usos ? `${p.usos} ${p.usos === 1 ? "línea" : "líneas"}` : "—"}</td>
                      <td>
                        <span className={`adm-estado adm-estado--${p.activo ? "activo" : "inactivo"}`}>{p.activo ? "Activo" : "Inactivo"}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {ficha && (
        <ProductoFicha
          inicial={ficha}
          onGuardado={(p) => {
            setFicha(null);
            setAviso(ficha.id ? `«${p.nombre}» actualizado.` : `«${p.nombre}» agregado al catálogo.`);
            cargar();
          }}
          onEliminado={() => {
            setFicha(null);
            setAviso("Eliminado del catálogo (los documentos que lo usaban conservan su texto).");
            cargar();
          }}
          onCerrar={() => setFicha(null)}
        />
      )}
    </div>
  );
}

function ProductoFicha({ inicial, onGuardado, onEliminado, onCerrar }) {
  const [p, setP] = useState({
    id: inicial.id ?? null,
    nombre: inicial.nombre ?? "",
    descripcion: inicial.descripcion ?? "",
    unidad: inicial.unidad ?? "hora",
    precio: inicial.precio ? separarMiles(inicial.precio) : "",
    activo: inicial.activo ?? true,
  });
  const [guardando, setGuardando] = useState(false);
  const [confirmar, setConfirmar] = useState(false);
  const [error, setError] = useState("");
  const cambiar = (campo) => (e) => setP((x) => ({ ...x, [campo]: e.target.value }));

  const guardar = async (e) => {
    e.preventDefault();
    setGuardando(true);
    setError("");
    try {
      const r = await api.guardarProducto({ ...p, precio: aNumero(p.precio) });
      onGuardado(r.producto);
    } catch (err) {
      setError(err.message);
      setGuardando(false);
    }
  };

  return (
    <Ventana titulo={p.id ? p.nombre || "Producto" : "Nuevo producto o servicio"} ancho="560px" onCerrar={onCerrar}>
      <form className="adm-ficha" onSubmit={guardar}>
        <div className="adm-ficha__grilla">
          <label className="adm-campo adm-ficha__campo adm-ficha__campo--3">
            <span>Nombre *</span>
            <input value={p.nombre} onChange={cambiar("nombre")} required maxLength={150} autoFocus={!p.id} placeholder="Ej.: Hora de desarrollo" />
          </label>
          <label className="adm-campo adm-ficha__campo">
            <span>Unidad</span>
            <input value={p.unidad} onChange={cambiar("unidad")} maxLength={30} list="unidades-producto" />
            <datalist id="unidades-producto">
              {UNIDADES.map((u) => (
                <option key={u} value={u} />
              ))}
            </datalist>
          </label>
          <label className="adm-campo adm-ficha__campo">
            <span>Precio</span>
            <div className="adm-fin__monto">
              <b>$</b>
              <input value={p.precio} inputMode="numeric" onChange={(e) => setP((x) => ({ ...x, precio: separarMiles(e.target.value) }))} placeholder="0" />
            </div>
          </label>
          <label className="adm-campo adm-ficha__campo">
            <span>Estado</span>
            <select className="adm-select adm-select--campo" value={p.activo ? "1" : "0"} onChange={(e) => setP((x) => ({ ...x, activo: e.target.value === "1" }))}>
              <option value="1">Activo</option>
              <option value="0">Inactivo</option>
            </select>
          </label>
          <label className="adm-campo adm-ficha__campo adm-ficha__campo--3">
            <span>Descripción (aparece en los documentos)</span>
            <textarea className="adm-ficha__notas" rows={3} value={p.descripcion} onChange={cambiar("descripcion")} maxLength={2000} />
          </label>
        </div>
        {error && <p className="adm-error">{error}</p>}
        <footer className="adm-ventana__pie">
          {p.id ? (
            confirmar ? (
              <div className="adm-confirmar">
                <span>¿Eliminar del catálogo?</span>
                <button type="button" className="adm-boton adm-boton--peligro" onClick={() => api.eliminarProducto(p.id).then(onEliminado).catch((e2) => setError(e2.message))}>
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
            <button type="button" className="adm-boton adm-boton--suave" onClick={onCerrar}>
              Cancelar
            </button>
            <button className="adm-boton" disabled={guardando}>
              {guardando ? "Guardando…" : p.id ? "Guardar cambios" : "Agregar"}
            </button>
          </div>
        </footer>
      </form>
    </Ventana>
  );
}

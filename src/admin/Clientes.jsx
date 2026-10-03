import { useCallback, useEffect, useState } from "react";
import { api } from "./api";
import { numero } from "./formato";
import { formatearRut } from "./chile";
import ClienteFicha from "./ClienteFicha";

const ESTADOS = [
  ["todos", "Todos"],
  ["activo", "Activos"],
  ["prospecto", "Prospectos"],
  ["inactivo", "Inactivos"],
];
const ETIQUETA_ESTADO = { activo: "Activo", prospecto: "Prospecto", inactivo: "Inactivo" };

export default function Clientes() {
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState("");
  const [buscar, setBuscar] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [estado, setEstado] = useState("todos");
  const [pagina, setPagina] = useState(1);
  const [ficha, setFicha] = useState(null); // null | {id?}
  const [aviso, setAviso] = useState("");

  // Búsqueda con una pequeña espera, para no consultar en cada tecla.
  useEffect(() => {
    const t = setTimeout(() => {
      setBusqueda(buscar.trim());
      setPagina(1);
    }, 300);
    return () => clearTimeout(t);
  }, [buscar]);

  const cargar = useCallback(() => {
    setError("");
    api
      .clientes({ buscar: busqueda, estado: estado === "todos" ? "" : estado, pagina })
      .then(setDatos)
      .catch((e) => setError(e.message));
  }, [busqueda, estado, pagina]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const cerrarFicha = (mensaje) => {
    setFicha(null);
    if (mensaje) setAviso(mensaje);
    cargar();
  };

  return (
    <div className="adm-seccion">
      <div className="adm-filtros">
        <input
          className="adm-buscar adm-buscar--ancho"
          type="search"
          placeholder="Buscar por nombre, RUT, correo, comuna…"
          value={buscar}
          onChange={(e) => setBuscar(e.target.value)}
        />
        <div className="adm-chips" role="group" aria-label="Estado">
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
        <button className="adm-boton adm-clientes__nuevo" onClick={() => setFicha({})}>
          + Nuevo cliente
        </button>
      </div>

      {aviso && <p className="adm-aviso">{aviso}</p>}
      {error && <p className="adm-error">{error}</p>}

      {!datos && !error ? (
        <div className="adm-centro adm-centro--bajo">
          <span className="adm-spinner" aria-label="Cargando" />
        </div>
      ) : datos && datos.conteo.todos === 0 ? (
        <button className="adm-videos__vacio" onClick={() => setFicha({})}>
          <strong>Aún no tienes clientes</strong>
          <span>Crea el primero aquí, o conviértelo desde un mensaje recibido en la web (menú «Mensajes»).</span>
        </button>
      ) : datos ? (
        <section className="adm-tarjeta">
          {datos.clientes.length === 0 ? (
            <p className="adm-vacio">Ningún cliente coincide con la búsqueda.</p>
          ) : (
            <div className="adm-tabla-caja">
              <table className="adm-tabla adm-tabla--clic">
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>RUT</th>
                    <th>Contacto principal</th>
                    <th>Correo / teléfono</th>
                    <th>Comuna</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {datos.clientes.map((c) => (
                    <tr key={c.id} onClick={() => setFicha({ id: c.id })} tabIndex={0} onKeyDown={(e) => e.key === "Enter" && setFicha({ id: c.id })}>
                      <td>
                        <strong className="adm-clientes__nombre">{c.nombre}</strong>
                        <span className="adm-texto-suave adm-clientes__sub">
                          {c.tipo === "empresa" ? "Empresa" : "Persona"}
                          {c.nombre_fantasia && ` · ${c.nombre_fantasia}`}
                        </span>
                      </td>
                      <td className="adm-nowrap">{c.rut ? formatearRut(c.rut) : <span className="adm-texto-suave">—</span>}</td>
                      <td>
                        {c.contacto_nombre ?? <span className="adm-texto-suave">—</span>}
                        {c.contactos > 1 && <span className="adm-texto-suave"> +{c.contactos - 1}</span>}
                      </td>
                      <td>
                        {c.email && <span className="adm-clientes__sub">{c.email}</span>}
                        {c.telefono && <span className="adm-clientes__sub adm-texto-suave">{c.telefono}</span>}
                        {!c.email && !c.telefono && <span className="adm-texto-suave">—</span>}
                      </td>
                      <td>{c.comuna ?? <span className="adm-texto-suave">—</span>}</td>
                      <td>
                        <span className={`adm-estado adm-estado--${c.estado}`}>{ETIQUETA_ESTADO[c.estado]}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="adm-paginacion">
            <span className="adm-texto-suave">
              {numero(datos.total)} {datos.total === 1 ? "cliente" : "clientes"} · página {datos.pagina} de {datos.paginas}
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
        </section>
      ) : null}

      {ficha && (
        <ClienteFicha
          clienteId={ficha.id}
          onGuardado={(c) => cerrarFicha(ficha.id ? `Cambios guardados en «${c.nombre}».` : `Cliente «${c.nombre}» creado.`)}
          onEliminado={() => cerrarFicha("Cliente eliminado.")}
          onCerrar={() => cerrarFicha()}
        />
      )}
    </div>
  );
}

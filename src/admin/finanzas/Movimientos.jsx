import { useEffect, useState } from "react";
import { api } from "../api";
import { fechaCl, nombreMes, pesos } from "./dinero";

// Pestaña "Movimientos": todo lo del mes, con filtros.
export default function Movimientos({ mes, cuenta, version, catalogos, onAbrir, onNuevo, onCambio }) {
  const [filtros, setFiltros] = useState({ tipo: "", estado: "", categoria: "", buscar: "" });
  const [buscar, setBuscar] = useState("");
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setFiltros((f) => ({ ...f, buscar: buscar.trim() })), 300);
    return () => clearTimeout(t);
  }, [buscar]);

  useEffect(() => {
    setError("");
    api
      .finanzas({ vista: "movimientos", mes, cuenta, ...filtros })
      .then(setDatos)
      .catch((e) => setError(e.message));
  }, [mes, cuenta, version, filtros]);

  const filtro = (campo) => ({ value: filtros[campo], onChange: (e) => setFiltros((f) => ({ ...f, [campo]: e.target.value, ...(campo === "tipo" ? { categoria: "" } : {}) })) });
  const categorias = catalogos.categorias.filter((c) => !filtros.tipo || c.tipo === filtros.tipo);
  const nombreCuenta = (id) => catalogos.cuentas.find((c) => c.id === id);

  const alternar = async (m) => {
    try {
      await api.estadoMovimiento(m.id, m.estado === "pagado" ? "pendiente" : "pagado");
      onCambio();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="adm-seccion">
      <div className="adm-filtros">
        <input className="adm-buscar" type="search" placeholder="Buscar descripción o notas…" value={buscar} onChange={(e) => setBuscar(e.target.value)} />
        <select className="adm-select adm-fin__filtro" {...filtro("tipo")} aria-label="Tipo">
          <option value="">Ingresos y egresos</option>
          <option value="ingreso">Solo ingresos</option>
          <option value="egreso">Solo egresos</option>
        </select>
        <select className="adm-select adm-fin__filtro" {...filtro("estado")} aria-label="Estado">
          <option value="">Pagados y pendientes</option>
          <option value="pagado">Pagados / recibidos</option>
          <option value="pendiente">Pendientes</option>
        </select>
        <select className="adm-select adm-fin__filtro" {...filtro("categoria")} aria-label="Categoría">
          <option value="">Todas las categorías</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>
              {c.tipo === "ingreso" ? "↑" : "↓"} {c.nombre}
            </option>
          ))}
        </select>
        <div className="adm-videos__acciones">
          <button className="adm-boton adm-fin__boton-ingreso" onClick={() => onNuevo("ingreso")}>
            + Ingreso
          </button>
          <button className="adm-boton adm-fin__boton-egreso" onClick={() => onNuevo("egreso")}>
            + Egreso
          </button>
        </div>
      </div>

      {error && <p className="adm-error">{error}</p>}
      {!datos && !error && (
        <div className="adm-centro adm-centro--bajo">
          <span className="adm-spinner" aria-label="Cargando" />
        </div>
      )}

      {datos && (
        <section className="adm-tarjeta">
          {datos.movimientos.length === 0 ? (
            <p className="adm-vacio">No hay movimientos en {nombreMes(mes)} con estos filtros.</p>
          ) : (
            <div className="adm-tabla-caja">
              <table className="adm-tabla adm-tabla--clic">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Descripción</th>
                    <th>Categoría</th>
                    {!cuenta && <th>Cuenta</th>}
                    <th className="adm-fin__derecha">Monto</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {datos.movimientos.map((m) => {
                    const cu = nombreCuenta(m.cuenta_id);
                    return (
                      <tr key={m.id} onClick={() => onAbrir(m)} tabIndex={0} onKeyDown={(e) => e.key === "Enter" && onAbrir(m)}>
                        <td className="adm-nowrap">{fechaCl(m.fecha)}</td>
                        <td>
                          <strong className="adm-clientes__nombre">
                            {m.descripcion} {m.comprobante && <span title="Tiene comprobante">📎</span>}
                          </strong>
                          {((m.cuota && m.cuotas) || m.recurrente_id || m.cliente) && (
                            <span className="adm-texto-suave adm-clientes__sub">
                              {m.cuota && m.cuotas ? `Cuota ${m.cuota} de ${m.cuotas}` : m.recurrente_id ? "Recurrente" : ""}
                              {m.recurrente_id && m.cliente ? " · " : ""}
                              {m.cliente ?? ""}
                            </span>
                          )}
                        </td>
                        <td>{m.categoria ?? <span className="adm-texto-suave">Sin categoría</span>}</td>
                        {!cuenta && (
                          <td className="adm-nowrap">
                            <i className="adm-fin__color" style={{ background: cu?.color }} /> {cu?.nombre}
                          </td>
                        )}
                        <td className={`adm-nowrap adm-fin__derecha adm-fin__monto-${m.tipo}`}>
                          {m.tipo === "ingreso" ? "+" : "−"} {pesos(m.monto)}
                        </td>
                        <td>
                          <button
                            className={`adm-fin__estado adm-fin__estado--${m.estado}`}
                            title="Cambiar estado"
                            onClick={(e) => {
                              e.stopPropagation();
                              alternar(m);
                            }}
                          >
                            {m.estado === "pagado" ? (m.tipo === "ingreso" ? "Recibido" : "Pagado") : m.tipo === "ingreso" ? "Por cobrar" : "Por pagar"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <div className="adm-fin__totales">
            <span>
              Ingresos <b className="adm-fin__monto-ingreso">{pesos(datos.totales.ingresos)}</b>
            </span>
            <span>
              Egresos <b className="adm-fin__monto-egreso">{pesos(datos.totales.egresos)}</b>
            </span>
            <span>
              Diferencia <b>{pesos(datos.totales.ingresos - datos.totales.egresos)}</b>
            </span>
            <span className="adm-texto-suave">(incluye pendientes de la lista)</span>
          </div>
        </section>
      )}
    </div>
  );
}

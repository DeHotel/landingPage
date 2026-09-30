import { useCallback, useEffect, useState } from "react";
import { api } from "./api";
import GraficoVisitas from "./GraficoVisitas";
import { fechaHora, fechaLarga, hoyYmd, numero } from "./formato";

const RANGOS = [
  { id: "hoy", label: "Hoy", dias: 0 },
  { id: "7", label: "7 días", dias: 6 },
  { id: "30", label: "30 días", dias: 29 },
  { id: "90", label: "90 días", dias: 89 },
];

export default function Visitas() {
  const [rango, setRango] = useState({ id: "30", desde: hoyYmd(-29), hasta: hoyYmd() });
  const [pagina, setPagina] = useState(1);
  const [ip, setIp] = useState("");
  const [ipFiltro, setIpFiltro] = useState("");
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  // Filtro por IP con una pequeña espera, para no consultar en cada tecla.
  useEffect(() => {
    const t = setTimeout(() => {
      setIpFiltro(ip.trim());
      setPagina(1);
    }, 350);
    return () => clearTimeout(t);
  }, [ip]);

  const cargar = useCallback(() => {
    setCargando(true);
    setError("");
    api
      .visitas({ desde: rango.desde, hasta: rango.hasta, pagina, ip: ipFiltro })
      .then(setDatos)
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false));
  }, [rango, pagina, ipFiltro]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const elegirRango = (r) => {
    setRango({ id: r.id, desde: hoyYmd(-r.dias), hasta: hoyYmd() });
    setPagina(1);
  };

  const cambiarFecha = (campo, valor) => {
    if (!valor) return;
    setRango((r) => ({ ...r, id: "custom", [campo]: valor }));
    setPagina(1);
  };

  const r = datos?.resumen;
  const variacion = r ? r.hoy - r.ayer : 0;

  return (
    <div className="adm-seccion">
      <div className="adm-filtros">
        <div className="adm-chips" role="group" aria-label="Rango de fechas">
          {RANGOS.map((op) => (
            <button key={op.id} className={rango.id === op.id ? "activo" : ""} onClick={() => elegirRango(op)}>
              {op.label}
            </button>
          ))}
        </div>
        <div className="adm-fechas">
          <input type="date" value={rango.desde} max={rango.hasta} onChange={(e) => cambiarFecha("desde", e.target.value)} aria-label="Desde" />
          <span>a</span>
          <input type="date" value={rango.hasta} min={rango.desde} max={hoyYmd()} onChange={(e) => cambiarFecha("hasta", e.target.value)} aria-label="Hasta" />
        </div>
        <button className="adm-boton adm-boton--suave" onClick={cargar} disabled={cargando}>
          {cargando ? "Actualizando…" : "Actualizar"}
        </button>
      </div>

      {error && <p className="adm-error">{error}</p>}

      {!datos && cargando ? (
        <div className="adm-centro adm-centro--bajo">
          <span className="adm-spinner" aria-label="Cargando" />
        </div>
      ) : datos ? (
        <>
          <div className="adm-kpis">
            <Kpi titulo="Hoy" valor={r.hoy} detalle={`${variacion >= 0 ? "+" : ""}${numero(variacion)} vs. ayer (${numero(r.ayer)})`} tono={variacion >= 0 ? "sube" : "baja"} />
            <Kpi titulo="Últimos 7 días" valor={r.ultimos7} />
            <Kpi titulo="Últimos 30 días" valor={r.ultimos30} />
            <Kpi titulo="Visitantes únicos (30 días)" valor={r.unicos30} />
            <Kpi titulo="Total histórico" valor={r.total} detalle={r.primera ? `desde ${fechaHora(r.primera).slice(0, 10)}` : "sin visitas aún"} />
          </div>

          <section className="adm-tarjeta">
            <div className="adm-tarjeta__titulo">
              <h2>Visitas por día</h2>
              <span className="adm-texto-suave">
                {fechaLarga(datos.desde)} — {fechaLarga(datos.hasta)} · {numero(datos.rango.visitas)} visitas · {numero(datos.rango.unicos)} únicos
              </span>
            </div>
            <GraficoVisitas datos={datos.porDia} />
          </section>

          <div className="adm-dos">
            <Distribucion titulo="Dispositivos" filas={datos.dispositivos} total={datos.rango.visitas} />
            <Distribucion titulo="Origen de las visitas" filas={datos.origenes} total={datos.rango.visitas} />
          </div>

          <section className="adm-tarjeta">
            <div className="adm-tarjeta__titulo">
              <h2>Detalle de visitas</h2>
              <input className="adm-buscar" type="search" placeholder="Filtrar por IP…" value={ip} onChange={(e) => setIp(e.target.value)} />
            </div>

            {datos.lista.length === 0 ? (
              <p className="adm-vacio">
                {ipFiltro ? "No hay visitas de esa IP en el rango elegido." : "Aún no hay visitas registradas en este rango."}
              </p>
            ) : (
              <div className="adm-tabla-caja">
                <table className="adm-tabla">
                  <thead>
                    <tr>
                      <th>Fecha y hora</th>
                      <th>IP</th>
                      <th>Visitante</th>
                      <th>Origen</th>
                      <th>Dispositivo</th>
                      <th>Navegador</th>
                    </tr>
                  </thead>
                  <tbody>
                    {datos.lista.map((v) => (
                      <tr key={v.id}>
                        <td className="adm-nowrap">{fechaHora(v.creado_en)}</td>
                        <td>
                          <button className="adm-ip" title="Ver solo esta IP" onClick={() => setIp(v.ip ?? "")}>
                            {v.ip ?? "—"}
                          </button>
                        </td>
                        <td className="adm-nowrap">
                          <span className={`adm-etiqueta ${v.recurrente ? "adm-etiqueta--recurrente" : ""}`}>
                            {v.recurrente ? "Recurrente" : "Nuevo"}
                          </span>
                          {v.visitante && <code className="adm-id">{v.visitante.slice(0, 8)}</code>}
                        </td>
                        <td>{v.utm_fuente || v.referencia || <span className="adm-texto-suave">Directo</span>}</td>
                        <td>{v.dispositivo ?? "—"}</td>
                        <td className="adm-nowrap">
                          {v.navegador ?? "—"} <span className="adm-texto-suave">· {v.sistema ?? "—"}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="adm-paginacion">
              <span className="adm-texto-suave">
                {numero(datos.totalFiltrado)} registros · página {datos.pagina} de {datos.paginas}
              </span>
              <div>
                <button className="adm-boton adm-boton--suave" disabled={pagina <= 1 || cargando} onClick={() => setPagina((p) => p - 1)}>
                  ← Anterior
                </button>
                <button className="adm-boton adm-boton--suave" disabled={pagina >= datos.paginas || cargando} onClick={() => setPagina((p) => p + 1)}>
                  Siguiente →
                </button>
              </div>
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}

function Kpi({ titulo, valor, detalle, tono }) {
  return (
    <div className="adm-kpi">
      <span className="adm-kpi__titulo">{titulo}</span>
      <strong className="adm-kpi__valor">{numero(valor)}</strong>
      {detalle && <span className={`adm-kpi__detalle ${tono ? `adm-kpi__detalle--${tono}` : ""}`}>{detalle}</span>}
    </div>
  );
}

function Distribucion({ titulo, filas, total }) {
  return (
    <section className="adm-tarjeta">
      <div className="adm-tarjeta__titulo">
        <h2>{titulo}</h2>
      </div>
      {filas.length === 0 ? (
        <p className="adm-vacio">Sin datos en este rango.</p>
      ) : (
        <ul className="adm-dist">
          {filas.map((f) => {
            const pct = total ? Math.round((f.total / total) * 100) : 0;
            return (
              <li key={f.nombre}>
                <div className="adm-dist__fila">
                  <span>{f.nombre}</span>
                  <span className="adm-texto-suave">
                    {numero(f.total)} · {pct}%
                  </span>
                </div>
                <div className="adm-dist__barra">
                  <i style={{ width: `${Math.max(pct, 2)}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

import { useEffect, useState } from "react";
import { api } from "../api";
import { fechaCl, mesCorto, nombreMes, pesos } from "./dinero";

// Pestaña "Resumen": totales del mes, 12 meses, categorías y vencimientos.
export default function Resumen({ mes, cuenta, version, onAbrir, onCambio }) {
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setError("");
    api
      .finanzas({ vista: "resumen", mes, cuenta })
      .then(setDatos)
      .catch((e) => setError(e.message));
  }, [mes, cuenta, version]);

  const pagar = async (m) => {
    try {
      await api.estadoMovimiento(m.id, "pagado");
      onCambio();
    } catch (e) {
      setError(e.message);
    }
  };

  if (error) return <p className="adm-error">{error}</p>;
  if (!datos) {
    return (
      <div className="adm-centro adm-centro--bajo">
        <span className="adm-spinner" aria-label="Cargando" />
      </div>
    );
  }

  const t = datos.totales;
  const egresos = datos.porCategoria.filter((c) => c.tipo === "egreso");
  const ingresos = datos.porCategoria.filter((c) => c.tipo === "ingreso");
  const vacio = datos.porCategoria.length === 0 && datos.pendientes.length === 0;

  return (
    <>
      <div className="adm-kpis adm-fin__kpis">
        <Kpi titulo="Ingresos recibidos" valor={t.ingresos} clase="ingreso" detalle={t.por_cobrar ? `${pesos(t.por_cobrar)} por cobrar` : null} />
        <Kpi titulo="Egresos pagados" valor={t.egresos} clase="egreso" detalle={t.por_pagar ? `${pesos(t.por_pagar)} por pagar` : null} />
        <Kpi titulo={`Saldo de ${nombreMes(mes).split(" ")[0].toLowerCase()}`} valor={t.saldo} clase={t.saldo >= 0 ? "ingreso" : "egreso"} detalle="Recibido menos pagado" />
        <Kpi
          titulo="Saldo proyectado"
          valor={t.saldo + t.por_cobrar - t.por_pagar}
          clase={t.saldo + t.por_cobrar - t.por_pagar >= 0 ? "ingreso" : "egreso"}
          detalle="Incluyendo lo pendiente del mes"
        />
      </div>

      {vacio && (
        <p className="adm-vacio">
          Aún no hay movimientos en {nombreMes(mes)}. Registra uno en «Movimientos» o crea tus pagos fijos en «Recurrentes».
        </p>
      )}

      {datos.pendientes.length > 0 && (
        <section className="adm-tarjeta">
          <div className="adm-tarjeta__titulo">
            <h2>Vencimientos</h2>
            <span className="adm-texto-suave">Pendientes atrasados y de los próximos 30 días</span>
          </div>
          <ul className="adm-fin__pendientes">
            {datos.pendientes.map((m) => (
              <li key={m.id} className={m.vencido ? "vencido" : ""}>
                <button className="adm-fin__pendiente" onClick={() => onAbrir(m)}>
                  <span className={`adm-fin__flecha adm-fin__flecha--${m.tipo}`}>{m.tipo === "ingreso" ? "↑" : "↓"}</span>
                  <span className="adm-fin__pendiente-texto">
                    <strong>{m.descripcion}</strong>
                    <small className="adm-texto-suave">
                      {m.categoria ?? "Sin categoría"}
                      {m.cuota && m.cuotas ? ` · cuota ${m.cuota} de ${m.cuotas}` : ""}
                    </small>
                  </span>
                  <span className="adm-fin__pendiente-fecha">
                    {m.vencido ? <b className="adm-fin__vencido">Vencido</b> : null} {fechaCl(m.fecha)}
                  </span>
                  <span className="adm-fin__pendiente-monto">{pesos(m.monto)}</span>
                </button>
                <button className="adm-boton adm-boton--suave" onClick={() => pagar(m)}>
                  {m.tipo === "ingreso" ? "Marcar recibido" : "Marcar pagado"}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="adm-tarjeta">
        <div className="adm-tarjeta__titulo">
          <h2>Últimos 12 meses</h2>
          <span className="adm-texto-suave">Solo lo recibido y pagado</span>
        </div>
        <GraficoMeses datos={datos.evolucion} />
      </section>

      <div className="adm-dos">
        <PorCategoria titulo="Egresos por categoría" filas={egresos} tipo="egreso" />
        <PorCategoria titulo="Ingresos por categoría" filas={ingresos} tipo="ingreso" />
      </div>
    </>
  );
}

function Kpi({ titulo, valor, clase, detalle }) {
  return (
    <div className="adm-kpi">
      <span className="adm-kpi__titulo">{titulo}</span>
      <strong className={`adm-kpi__valor adm-fin__valor adm-fin__valor--${clase}`}>{pesos(valor)}</strong>
      {detalle && <span className="adm-kpi__detalle">{detalle}</span>}
    </div>
  );
}

function PorCategoria({ titulo, filas, tipo }) {
  const total = filas.reduce((s, f) => s + f.total, 0);
  return (
    <section className="adm-tarjeta">
      <div className="adm-tarjeta__titulo">
        <h2>{titulo}</h2>
        {total > 0 && <span className="adm-texto-suave">{pesos(total)} · incluye pendientes</span>}
      </div>
      {filas.length === 0 ? (
        <p className="adm-vacio">Sin movimientos este mes.</p>
      ) : (
        <ul className="adm-dist">
          {filas.map((f) => {
            const pct = total ? Math.round((f.total / total) * 100) : 0;
            return (
              <li key={f.categoria}>
                <div className="adm-dist__fila">
                  <span>{f.categoria}</span>
                  <span className="adm-texto-suave">
                    {pesos(f.total)} · {pct}%
                  </span>
                </div>
                <div className={`adm-dist__barra adm-fin__barra--${tipo}`}>
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

// Barras agrupadas ingresos/egresos por mes. SVG propio.
function GraficoMeses({ datos }) {
  const [activo, setActivo] = useState(null);
  const W = 720;
  const H = 230;
  const M = { arriba: 14, abajo: 26, izquierda: 64, derecha: 8 };
  const alto = H - M.arriba - M.abajo;
  const maximo = Math.max(1, ...datos.flatMap((d) => [d.ingresos, d.egresos]));
  const paso = pasoBonito(maximo);
  const tope = Math.ceil(maximo / paso) * paso;
  const y = (v) => M.arriba + alto - (v / tope) * alto;
  const banda = (W - M.izquierda - M.derecha) / datos.length;
  const barra = Math.min(18, banda * 0.32);
  const guias = [];
  for (let v = 0; v <= tope; v += paso) guias.push(v);
  const sel = activo !== null ? datos[activo] : null;

  return (
    <div className="adm-grafico">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Ingresos y egresos por mes" onMouseLeave={() => setActivo(null)}>
        {guias.map((v) => (
          <g key={v}>
            <line x1={M.izquierda} x2={W - M.derecha} y1={y(v)} y2={y(v)} className="adm-grafico__guia" />
            <text x={M.izquierda - 8} y={y(v) + 4} textAnchor="end" className="adm-grafico__eje">
              {abreviar(v)}
            </text>
          </g>
        ))}
        {datos.map((d, i) => {
          const x = M.izquierda + banda * i + banda / 2;
          return (
            <g key={d.mes} onMouseEnter={() => setActivo(i)} onClick={() => setActivo(i)} opacity={activo === null || activo === i ? 1 : 0.45}>
              <rect x={M.izquierda + banda * i} y={M.arriba} width={banda} height={alto} fill="transparent" />
              <rect x={x - barra - 1} y={y(d.ingresos)} width={barra} height={M.arriba + alto - y(d.ingresos)} rx="3" className="adm-fin__barra-ingreso" />
              <rect x={x + 1} y={y(d.egresos)} width={barra} height={M.arriba + alto - y(d.egresos)} rx="3" className="adm-fin__barra-egreso" />
              <text x={x} y={H - 8} textAnchor="middle" className="adm-grafico__eje">
                {mesCorto(d.mes)}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="adm-grafico__leyenda">
        {sel ? (
          <span>
            <b>{nombreMes(sel.mes)}</b> · ingresos {pesos(sel.ingresos)} · egresos {pesos(sel.egresos)} · saldo {pesos(sel.ingresos - sel.egresos)}
          </span>
        ) : (
          <>
            <span>
              <i className="adm-punto adm-fin__punto-ingreso" /> Ingresos
            </span>
            <span>
              <i className="adm-punto adm-fin__punto-egreso" /> Egresos
            </span>
          </>
        )}
      </div>
    </div>
  );
}

function pasoBonito(maximo) {
  const bruto = maximo / 4;
  const potencia = 10 ** Math.floor(Math.log10(bruto));
  const n = bruto / potencia;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * potencia;
}

// 1.500.000 → "1,5 M"; 250.000 → "250 mil"
function abreviar(v) {
  if (v >= 1e6) return `${(v / 1e6).toLocaleString("es-CL", { maximumFractionDigits: 1 })} M`;
  if (v >= 1e3) return `${(v / 1e3).toLocaleString("es-CL", { maximumFractionDigits: 0 })} mil`;
  return String(v);
}

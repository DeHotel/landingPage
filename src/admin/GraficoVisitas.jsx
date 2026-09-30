import { useState } from "react";
import { fechaCorta, fechaLarga } from "./formato";

// Barras de visitas por día + línea de visitantes únicos. SVG propio, sin librerías.
export default function GraficoVisitas({ datos }) {
  const [activo, setActivo] = useState(null);
  const W = 720;
  const H = 240;
  const M = { arriba: 16, derecha: 12, abajo: 30, izquierda: 36 };
  const ancho = W - M.izquierda - M.derecha;
  const alto = H - M.arriba - M.abajo;

  const maximo = Math.max(4, ...datos.map((d) => d.visitas));
  const paso = escalaBonita(maximo);
  const tope = Math.ceil(maximo / paso) * paso;
  const y = (v) => M.arriba + alto - (v / tope) * alto;
  const banda = ancho / datos.length;
  const barra = Math.max(2, Math.min(28, banda * 0.62));
  const x = (i) => M.izquierda + banda * i + banda / 2;

  const lineas = [];
  for (let v = 0; v <= tope; v += paso) lineas.push(v);
  const cadaCuantas = Math.ceil(datos.length / 10);
  const puntosUnicos = datos.map((d, i) => `${x(i)},${y(d.unicos)}`).join(" ");
  const sel = activo !== null ? datos[activo] : null;

  return (
    <div className="adm-grafico">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Visitas por día" onMouseLeave={() => setActivo(null)}>
        <defs>
          <linearGradient id="adm-barra" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#6366f1" />
            <stop offset="1" stopColor="#22d3ee" />
          </linearGradient>
        </defs>

        {lineas.map((v) => (
          <g key={v}>
            <line x1={M.izquierda} x2={W - M.derecha} y1={y(v)} y2={y(v)} className="adm-grafico__guia" />
            <text x={M.izquierda - 8} y={y(v) + 4} textAnchor="end" className="adm-grafico__eje">
              {v}
            </text>
          </g>
        ))}

        {datos.map((d, i) => (
          <g key={d.fecha} onMouseEnter={() => setActivo(i)} onClick={() => setActivo(i)}>
            <rect x={M.izquierda + banda * i} y={M.arriba} width={banda} height={alto} fill="transparent" />
            <rect
              x={x(i) - barra / 2}
              y={y(d.visitas)}
              width={barra}
              height={Math.max(0, M.arriba + alto - y(d.visitas))}
              rx={Math.min(5, barra / 2)}
              fill="url(#adm-barra)"
              opacity={activo === null || activo === i ? 1 : 0.45}
            />
            {i % cadaCuantas === 0 && (
              <text x={x(i)} y={H - 10} textAnchor="middle" className="adm-grafico__eje">
                {fechaCorta(d.fecha)}
              </text>
            )}
          </g>
        ))}

        {datos.length > 1 && <polyline points={puntosUnicos} className="adm-grafico__linea" />}

        {sel && (
          <line x1={x(activo)} x2={x(activo)} y1={M.arriba} y2={M.arriba + alto} className="adm-grafico__cursor" />
        )}
      </svg>

      <div className="adm-grafico__leyenda">
        {sel ? (
          <span>
            <b>{fechaLarga(sel.fecha)}</b> · {sel.visitas} visitas · {sel.unicos} visitantes únicos
          </span>
        ) : (
          <>
            <span>
              <i className="adm-punto adm-punto--barra" /> Visitas
            </span>
            <span>
              <i className="adm-punto adm-punto--linea" /> Visitantes únicos
            </span>
          </>
        )}
      </div>
    </div>
  );
}

function escalaBonita(maximo) {
  const bruto = maximo / 4;
  const potencia = 10 ** Math.floor(Math.log10(bruto));
  const n = bruto / potencia;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * potencia;
}

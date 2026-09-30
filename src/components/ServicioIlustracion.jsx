// Ilustraciones animadas (SVG + CSS) para el detalle de cada servicio.
// Las animaciones están en styles.css (prefijo .ilu-) y se desactivan con prefers-reduced-motion.

const CIAN = "#22d3ee";
const INDIGO = "#6366f1";
const TENUE = "rgba(255,255,255,0.14)";
const SUAVE = "rgba(255,255,255,0.35)";

function Codigo() {
  const lineas = [
    { x: 30, w: 70, c: INDIGO },
    { x: 42, w: 110, c: CIAN },
    { x: 42, w: 80, c: SUAVE },
    { x: 54, w: 95, c: CIAN },
    { x: 54, w: 60, c: SUAVE },
    { x: 42, w: 120, c: INDIGO },
    { x: 30, w: 40, c: SUAVE },
  ];
  return (
    <>
      <rect x="14" y="24" width="200" height="152" rx="12" fill="rgba(255,255,255,0.06)" stroke={TENUE} />
      <circle cx="30" cy="38" r="4" fill="#f87171" />
      <circle cx="44" cy="38" r="4" fill="#fbbf24" />
      <circle cx="58" cy="38" r="4" fill="#34d399" />
      {lineas.map((l, i) => (
        <rect
          key={i}
          className="ilu-escribe"
          style={{ animationDelay: `${i * 0.35}s` }}
          x={l.x}
          y={58 + i * 15}
          width={l.w}
          height="7"
          rx="3.5"
          fill={l.c}
        />
      ))}
      <rect className="ilu-cursor" x="76" y="148" width="3" height="11" fill="#fff" />
      <g className="ilu-flota">
        <rect x="232" y="46" width="72" height="128" rx="14" fill="#121a33" stroke={SUAVE} strokeWidth="2" />
        <rect x="258" y="54" width="20" height="4" rx="2" fill={SUAVE} />
        <rect x="242" y="68" width="52" height="30" rx="6" fill={INDIGO} opacity="0.85" />
        <rect x="242" y="106" width="52" height="8" rx="4" fill={TENUE} />
        <rect x="242" y="120" width="38" height="8" rx="4" fill={TENUE} />
        <rect x="242" y="146" width="52" height="16" rx="8" fill={CIAN} />
      </g>
    </>
  );
}

function Interfaz() {
  const bloques = [
    { x: 30, y: 56, w: 60, h: 104, c: TENUE },
    { x: 100, y: 56, w: 186, h: 34, c: INDIGO, o: 0.8 },
    { x: 100, y: 98, w: 56, h: 62, c: TENUE },
    { x: 165, y: 98, w: 56, h: 62, c: TENUE },
    { x: 230, y: 98, w: 56, h: 62, c: TENUE },
  ];
  return (
    <>
      <rect x="18" y="22" width="284" height="156" rx="12" fill="rgba(255,255,255,0.06)" stroke={TENUE} />
      <rect x="30" y="34" width="80" height="8" rx="4" fill={SUAVE} />
      <rect x="244" y="32" width="42" height="12" rx="6" fill={CIAN} />
      {bloques.map((b, i) => (
        <rect
          key={i}
          className="ilu-aparece"
          style={{ animationDelay: `${0.2 + i * 0.25}s` }}
          x={b.x}
          y={b.y}
          width={b.w}
          height={b.h}
          rx="8"
          fill={b.c}
          opacity={b.o ?? 1}
        />
      ))}
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} className="ilu-aparece" style={{ animationDelay: `${1.3 + i * 0.1}s` }} x="40" y={68 + i * 20} width="40" height="7" rx="3.5" fill={SUAVE} />
      ))}
      <circle className="ilu-click" cx="258" cy="38" r="10" fill="none" stroke="#fff" strokeWidth="2" />
      <path className="ilu-puntero" d="M0 0 L0 17 L5 12 L9 20 L12 18.5 L8 11 L15 11 Z" fill="#fff" stroke="#0b1020" strokeWidth="1.2" />
    </>
  );
}

function Integracion() {
  const nodos = [
    { x: 30, y: 30, t: "ERP" },
    { x: 30, y: 136, t: "Pagos" },
    { x: 236, y: 30, t: "Web" },
    { x: 236, y: 136, t: "Reservas" },
  ];
  const rutas = [
    "M84 47 C 120 47, 120 100, 136 100",
    "M84 153 C 120 153, 120 100, 136 100",
    "M184 100 C 200 100, 200 47, 236 47",
    "M184 100 C 200 100, 200 153, 236 153",
  ];
  return (
    <>
      {rutas.map((d, i) => (
        <path key={i} d={d} fill="none" stroke={TENUE} strokeWidth="2.5" strokeDasharray="4 5" />
      ))}
      {rutas.map((d, i) => (
        <circle
          key={i}
          className="ilu-viaja"
          style={{ offsetPath: `path("${d}")`, animationDelay: `${i * 0.55}s`, animationDirection: i < 2 ? "normal" : "reverse" }}
          r="4.5"
          fill={i % 2 ? INDIGO : CIAN}
        />
      ))}
      <circle className="ilu-pulso" cx="160" cy="100" r="30" fill="none" stroke={CIAN} strokeWidth="2" />
      <rect x="136" y="76" width="48" height="48" rx="12" fill="url(#ilu-grad)" />
      <text x="160" y="105" textAnchor="middle" fontSize="13" fontWeight="700" fill="#0b1020" fontFamily="Space Grotesk, sans-serif">
        API
      </text>
      {nodos.map((n) => (
        <g key={n.t}>
          <rect x={n.x} y={n.y} width="54" height="34" rx="9" fill="#121a33" stroke={SUAVE} strokeWidth="1.5" />
          <text x={n.x + 27} y={n.y + 21.5} textAnchor="middle" fontSize="11" fontWeight="600" fill="#fff" fontFamily="Inter, sans-serif">
            {n.t}
          </text>
        </g>
      ))}
    </>
  );
}

// Engranaje dibujado con un círculo de trazo punteado (los "dientes") + aro interior.
function Engranaje({ cx, cy, r, clase, color }) {
  const dientes = 2 * Math.PI * r;
  return (
    <g className={clase} style={{ transformOrigin: `${cx}px ${cy}px` }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="10" strokeDasharray={`${dientes / 24} ${dientes / 24}`} />
      <circle cx={cx} cy={cy} r={r - 4} fill={color} />
      <circle cx={cx} cy={cy} r={r * 0.38} fill="#0b1020" />
    </g>
  );
}

function Automatizacion() {
  return (
    <>
      <Engranaje cx={96} cy={84} r={36} clase="ilu-gira" color={INDIGO} />
      <Engranaje cx={150} cy={122} r={24} clase="ilu-gira-inversa" color={CIAN} />
      <rect x="20" y="164" width="280" height="6" rx="3" fill={TENUE} />
      {[0, 1, 2].map((i) => (
        <g key={i} className="ilu-cinta" style={{ animationDelay: `${i * 1.2}s` }}>
          <rect x="0" y="136" width="22" height="26" rx="3" fill="#fff" opacity="0.9" />
          <rect x="4" y="142" width="14" height="3" rx="1.5" fill={INDIGO} />
          <rect x="4" y="149" width="10" height="3" rx="1.5" fill={SUAVE} />
        </g>
      ))}
      <g className="ilu-aparece-loop">
        <circle cx="262" cy="84" r="26" fill={CIAN} opacity="0.18" />
        <circle cx="262" cy="84" r="18" fill={CIAN} />
        <path d="M253 84 l6 6 l12 -13" fill="none" stroke="#0b1020" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </>
  );
}

function Datos() {
  const barras = [46, 72, 58, 96, 84, 118];
  return (
    <>
      <g>
        <ellipse cx="62" cy="52" rx="38" ry="12" fill={INDIGO} />
        <path d="M24 52 V140 A38 12 0 0 0 100 140 V52" fill="rgba(99,102,241,0.35)" stroke={INDIGO} strokeWidth="2" />
        <path d="M24 82 A38 12 0 0 0 100 82 M24 111 A38 12 0 0 0 100 111" fill="none" stroke={INDIGO} strokeWidth="2" />
        <circle className="ilu-parpadea" cx="86" cy="96" r="3.5" fill={CIAN} />
        <circle className="ilu-parpadea" style={{ animationDelay: "0.6s" }} cx="86" cy="125" r="3.5" fill={CIAN} />
      </g>
      <path d="M116 100 H138" stroke={SUAVE} strokeWidth="2" strokeDasharray="3 4" />
      <rect x="146" y="26" width="158" height="150" rx="12" fill="rgba(255,255,255,0.06)" stroke={TENUE} />
      {barras.map((h, i) => (
        <rect
          key={i}
          className="ilu-crece"
          style={{ animationDelay: `${i * 0.15}s`, transformOrigin: `0 160px` }}
          x={160 + i * 23}
          y={160 - h}
          width="15"
          height={h}
          rx="4"
          fill={i === barras.length - 1 ? CIAN : "rgba(99,102,241,0.75)"}
        />
      ))}
      <path className="ilu-traza" d="M167 108 L190 86 L213 98 L236 62 L259 72 L282 38" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" pathLength="1" />
    </>
  );
}

function Nube() {
  return (
    <>
      <g className="ilu-flota">
        <path
          d="M92 92 h118 a30 30 0 0 0 2 -60 a44 44 0 0 0 -84 -8 a32 32 0 0 0 -36 68 z"
          fill="rgba(255,255,255,0.08)"
          stroke={SUAVE}
          strokeWidth="2"
        />
        {[0, 1, 2].map((i) => (
          <g key={i}>
            <rect x={102 + i * 40} y="48" width="30" height="34" rx="5" fill="#121a33" stroke={TENUE} />
            <rect x={107 + i * 40} y="55" width="20" height="4" rx="2" fill={TENUE} />
            <rect x={107 + i * 40} y="63" width="20" height="4" rx="2" fill={TENUE} />
            <circle className="ilu-parpadea" style={{ animationDelay: `${i * 0.4}s` }} cx={123 + i * 40} cy="74" r="3" fill="#34d399" />
          </g>
        ))}
      </g>
      <rect x="24" y="112" width="272" height="66" rx="12" fill="rgba(255,255,255,0.06)" stroke={TENUE} />
      <path
        className="ilu-traza ilu-traza--loop"
        d="M36 146 H96 L106 128 L118 164 L130 136 L138 146 H196 L206 132 L216 158 L224 146 H284"
        fill="none"
        stroke={CIAN}
        strokeWidth="2.5"
        strokeLinejoin="round"
        pathLength="1"
      />
      <text x="36" y="128" fontSize="11" fontWeight="600" fill={SUAVE} fontFamily="Inter, sans-serif">
        Disponibilidad
      </text>
      <text x="284" y="128" textAnchor="end" fontSize="12" fontWeight="700" fill="#34d399" fontFamily="Space Grotesk, sans-serif">
        99,9 %
      </text>
    </>
  );
}

const ilustraciones = {
  codigo: Codigo,
  interfaz: Interfaz,
  integracion: Integracion,
  engranaje: Automatizacion,
  "base-datos": Datos,
  nube: Nube,
};

export default function ServicioIlustracion({ tipo }) {
  const Dibujo = ilustraciones[tipo];
  if (!Dibujo) return null;
  return (
    <svg className="ilu" viewBox="0 0 320 200" role="presentation" aria-hidden="true">
      <defs>
        <linearGradient id="ilu-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={CIAN} />
          <stop offset="1" stopColor={INDIGO} />
        </linearGradient>
      </defs>
      <Dibujo />
    </svg>
  );
}

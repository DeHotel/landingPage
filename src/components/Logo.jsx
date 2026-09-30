import { marca } from "../data/contenido";

// Logo provisorio (texto) hasta tener el definitivo: reemplazar por un <img src="/logo.svg" />.
export default function Logo({ onClick }) {
  return (
    <a href="#inicio" className="logo" onClick={onClick} aria-label={`${marca.nombre}${marca.dominio}, ir al inicio`}>
      <span className="logo__marca" aria-hidden="true">&lt;/&gt;</span>
      <span>
        {marca.nombre}
        <span className="logo__dominio">{marca.dominio}</span>
      </span>
    </a>
  );
}

import { marca } from "../data/contenido";

// Isotipo en /public/brand (archivos de marca generados: isotipo, logo horizontal, PNG).
// El nombre va como texto para que tome la tipografía y el color del contexto.
export default function Logo({ onClick, base = "" }) {
  return (
    <a href={`${base}#inicio`} className="logo" onClick={onClick} aria-label={`${marca.nombre}${marca.dominio}, ir al inicio`}>
      <img className="logo__marca" src="/brand/isotipo.svg" width="36" height="36" alt="" />
      <span>
        {marca.nombre}
        <span className="logo__dominio">{marca.dominio}</span>
      </span>
    </a>
  );
}

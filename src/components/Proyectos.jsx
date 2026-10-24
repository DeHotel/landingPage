import { proyectos } from "../data/contenido";
import Icono from "./Icono";

export default function Proyectos() {
  const destacados = proyectos.filter((p) => p.destacado);
  const resto = proyectos.filter((p) => !p.destacado);

  return (
    <section id="proyectos" className="seccion">
      <div className="contenedor">
        <div className="encabezado">
          <p className="sobretitulo">Proyectos</p>
          <h2>Algunas soluciones que hemos construido</h2>
        </div>

        {destacados.map((p) => (
          <article key={p.titulo} className="proyecto-destacado">
            <a href={p.enlace} className="proyecto-destacado__imagen" tabIndex={-1} aria-hidden="true">
              <img src={p.imagen} alt="" loading="lazy" width="800" height="500" />
            </a>
            <div className="proyecto-destacado__cuerpo">
              <span className="proyecto-destacado__categoria">{p.categoria}</span>
              <h3>
                {p.logo && <img src={p.logo} alt="" width="34" height="34" />}
                <a href={p.enlace}>{p.titulo}</a>
              </h3>
              <p className="texto-suave">{p.texto}</p>
              <a href={p.enlace} className="enlace">
                Ver el proyecto <Icono nombre="flecha" size={16} />
              </a>
            </div>
          </article>
        ))}

        <div className="grilla grilla--3">
          {resto.map((p) => (
            <article key={p.titulo} className="tarjeta-proyecto">
              <div className="tarjeta-proyecto__imagen">
                <img src={p.imagen} alt="" loading="lazy" />
                <span className="tarjeta-proyecto__categoria">{p.categoria}</span>
              </div>
              <div className="tarjeta-proyecto__cuerpo">
                <h3>{p.titulo}</h3>
                <p className="texto-suave">{p.texto}</p>
                <a href={p.enlace ?? "#contacto"} className="enlace">
                  {p.enlace ? "Ver el proyecto" : "Quiero algo así"} <Icono nombre="flecha" size={16} />
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

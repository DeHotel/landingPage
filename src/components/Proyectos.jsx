import { proyectos } from "../data/contenido";
import Icono from "./Icono";

export default function Proyectos() {
  return (
    <section id="proyectos" className="seccion">
      <div className="contenedor">
        <div className="encabezado">
          <p className="sobretitulo">Proyectos</p>
          <h2>Algunas soluciones que hemos construido</h2>
        </div>

        <div className="grilla grilla--3">
          {proyectos.map((p) => (
            <article key={p.titulo} className="tarjeta-proyecto">
              <div className="tarjeta-proyecto__imagen">
                <img src={p.imagen} alt="" loading="lazy" />
                <span className="tarjeta-proyecto__categoria">{p.categoria}</span>
              </div>
              <div className="tarjeta-proyecto__cuerpo">
                <h3>{p.titulo}</h3>
                <p className="texto-suave">{p.texto}</p>
                <a href="#contacto" className="enlace">
                  Quiero algo así <Icono nombre="flecha" size={16} />
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

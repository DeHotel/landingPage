import { hero, cifras } from "../data/contenido";
import Icono from "./Icono";

export default function Hero() {
  return (
    <section id="inicio" className="hero" style={{ "--hero-img": `url(${hero.imagen})` }}>
      <div className="hero__grilla" aria-hidden="true" />
      <div className="contenedor hero__contenido">
        <p className="etiqueta">
          <span className="etiqueta__punto" /> {hero.sobretitulo}
        </p>
        <h1>{hero.titulo}</h1>
        <p className="hero__subtitulo">{hero.subtitulo}</p>
        <div className="hero__acciones">
          <a href="#contacto" className="boton boton--acento">
            {hero.ctaPrincipal} <Icono nombre="flecha" size={18} />
          </a>
          <a href="#servicios" className="boton boton--contorno">
            {hero.ctaSecundario}
          </a>
        </div>
      </div>

      <div className="contenedor">
        <dl className="cifras">
          {cifras.map((c) => (
            <div key={c.etiqueta} className="cifras__item">
              <dt>{c.valor}</dt>
              <dd>{c.etiqueta}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

import { servicios } from "../data/contenido";
import Icono from "./Icono";

export default function Servicios() {
  return (
    <section id="servicios" className="seccion">
      <div className="contenedor">
        <div className="encabezado">
          <p className="sobretitulo">Servicios</p>
          <h2>Tecnología a la medida de tu operación</h2>
          <p className="texto-suave">
            Desde una integración puntual hasta un sistema completo: diseñamos, construimos y
            mantenemos software que resuelve problemas reales.
          </p>
        </div>

        <div className="grilla grilla--3">
          {servicios.map((s) => (
            <article key={s.titulo} className="tarjeta-servicio">
              <span className="tarjeta-servicio__icono">
                <Icono nombre={s.icono} size={26} />
              </span>
              <h3>{s.titulo}</h3>
              <p className="texto-suave">{s.texto}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

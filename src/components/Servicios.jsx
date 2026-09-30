import { useCallback, useState } from "react";
import { servicios } from "../data/contenido";
import Icono from "./Icono";
import ServicioDetalle from "./ServicioDetalle";

export default function Servicios() {
  const [abierto, setAbierto] = useState(null);
  const cerrar = useCallback(() => setAbierto(null), []);

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
          {servicios.map((s, i) => (
            <article key={s.titulo} className="tarjeta-servicio tarjeta-servicio--abrible">
              <span className="tarjeta-servicio__icono">
                <Icono nombre={s.icono} size={26} />
              </span>
              <h3>{s.titulo}</h3>
              <p className="texto-suave">{s.texto}</p>
              {/* El botón cubre toda la tarjeta con ::after (patrón "stretched link"). */}
              <button type="button" className="enlace tarjeta-servicio__mas" onClick={() => setAbierto(i)}>
                Ver más <span className="sr-only">sobre {s.titulo}</span>
                <Icono nombre="flecha" size={16} />
              </button>
            </article>
          ))}
        </div>
      </div>

      <ServicioDetalle indice={abierto} onCerrar={cerrar} onCambiar={setAbierto} />
    </section>
  );
}

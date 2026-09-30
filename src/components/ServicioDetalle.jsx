import { useEffect, useRef } from "react";
import { servicios } from "../data/contenido";
import Icono from "./Icono";
import ServicioIlustracion from "./ServicioIlustracion";

// Evento que escucha el formulario de contacto para preseleccionar el tema.
export const EVENTO_TEMA = "dehotel:tema";

export default function ServicioDetalle({ indice, onCerrar, onCambiar }) {
  const ref = useRef(null);
  const abierto = indice !== null;
  const s = abierto ? servicios[indice] : null;
  const total = servicios.length;

  useEffect(() => {
    const dlg = ref.current;
    if (!dlg) return;
    if (abierto && !dlg.open) dlg.showModal();
    if (!abierto && dlg.open) dlg.close();
  }, [abierto, indice]);

  // Flechas del teclado para pasar de un servicio a otro.
  useEffect(() => {
    if (!abierto) return;
    const onKey = (e) => {
      if (e.key === "ArrowRight") onCambiar((indice + 1) % total);
      if (e.key === "ArrowLeft") onCambiar((indice - 1 + total) % total);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [abierto, indice, total, onCambiar]);

  const conversar = () => {
    window.dispatchEvent(new CustomEvent(EVENTO_TEMA, { detail: s.tema }));
    ref.current.close();
    onCerrar();
    // Al cerrar, el navegador devuelve el foco a la tarjeta y eso cancela un desplazamiento
    // en curso: esperamos el cierre, llevamos el foco al formulario y recién ahí bajamos.
    setTimeout(() => {
      const seccion = document.getElementById("contacto");
      if (!seccion) return;
      seccion.querySelector('input[name="nombre"]')?.focus({ preventScroll: true });
      seccion.scrollIntoView({ behavior: "smooth" });
    }, 60);
  };

  return (
    <dialog
      ref={ref}
      className="detalle"
      aria-labelledby="detalle-titulo"
      onClose={onCerrar}
      onCancel={onCerrar} // Esc: se dispara al instante (close llega después)
      onClick={(e) => e.target === ref.current && onCerrar()} // clic en el fondo
    >
      {s && (
        <div className="detalle__caja" key={indice}>
          <div className="detalle__visual">
            <div className="detalle__grilla" aria-hidden="true" />
            <ServicioIlustracion tipo={s.icono} />
            <p className="detalle__frase">{s.frase}</p>
          </div>

          <div className="detalle__contenido">
            <button className="detalle__cerrar" onClick={onCerrar} aria-label="Cerrar">
              <Icono nombre="cerrar" size={22} />
            </button>

            <div className="detalle__encabezado">
              <span className="tarjeta-servicio__icono">
                <Icono nombre={s.icono} size={26} />
              </span>
              <div>
                <p className="detalle__contador">
                  {indice + 1} / {total}
                </p>
                <h3 id="detalle-titulo">{s.titulo}</h3>
              </div>
            </div>

            <p className="detalle__resumen">{s.resumen}</p>

            <h4>Qué incluye</h4>
            <ul className="detalle__incluye">
              {s.incluye.map((item, i) => (
                <li key={item} style={{ animationDelay: `${0.15 + i * 0.06}s` }}>
                  <Icono nombre="check" size={18} />
                  {item}
                </li>
              ))}
            </ul>

            <h4>Te sirve si…</h4>
            <ul className="detalle__ideal">
              {s.ideal.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>

            <ul className="detalle__stack" aria-label="Tecnologías">
              {s.stack.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>

            <div className="detalle__pie">
              <div className="detalle__nav">
                <button onClick={() => onCambiar((indice - 1 + total) % total)} aria-label="Servicio anterior">
                  <Icono nombre="flecha" size={18} className="gira-180" />
                </button>
                <button onClick={() => onCambiar((indice + 1) % total)} aria-label="Servicio siguiente">
                  <Icono nombre="flecha" size={18} />
                </button>
              </div>
              <button className="boton boton--acento" onClick={conversar}>
                Conversemos sobre esto <Icono nombre="flecha" size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </dialog>
  );
}

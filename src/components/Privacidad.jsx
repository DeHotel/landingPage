import { useEffect, useRef, useState } from "react";
import { contacto, marca } from "../data/contenido";
import Icono from "./Icono";

// Política de privacidad en una ventana. Se abre con cualquier enlace a "#privacidad"
// (pie de página, formulario) y también al entrar directo a dehotel.cl/#privacidad.
// Texto base: conviene que lo revise un abogado antes de darlo por definitivo.
const ACTUALIZADA = "30 de septiembre de 2026";

export default function Privacidad() {
  const ref = useRef(null);
  const [abierta, setAbierta] = useState(false);

  useEffect(() => {
    const revisar = () => setAbierta(location.hash === "#privacidad");
    revisar();
    window.addEventListener("hashchange", revisar);
    return () => window.removeEventListener("hashchange", revisar);
  }, []);

  useEffect(() => {
    const dlg = ref.current;
    if (!dlg) return;
    if (abierta && !dlg.open) dlg.showModal();
    if (!abierta && dlg.open) dlg.close();
  }, [abierta]);

  const cerrar = () => {
    setAbierta(false);
    if (location.hash === "#privacidad") {
      history.replaceState(null, "", location.pathname + location.search);
    }
  };

  const sitio = `${marca.nombre}${marca.dominio}`;

  return (
    <dialog
      ref={ref}
      className="privacidad"
      aria-labelledby="privacidad-titulo"
      onClose={cerrar}
      onCancel={cerrar} // Esc: se dispara al instante (close llega después)
      onClick={(e) => e.target === ref.current && cerrar()}
    >
      <div className="privacidad__caja">
        <button className="detalle__cerrar" onClick={cerrar} aria-label="Cerrar">
          <Icono nombre="cerrar" size={22} />
        </button>

        <p className="sobretitulo">Privacidad</p>
        <h2 id="privacidad-titulo">Política de privacidad</h2>
        <p className="texto-suave">Última actualización: {ACTUALIZADA}.</p>

        <h3>Quién es responsable</h3>
        <p>
          {sitio} es responsable de los datos que se recogen en este sitio. Para cualquier consulta
          sobre tus datos escríbenos a <a href={`mailto:${contacto.email}`}>{contacto.email}</a>.
        </p>

        <h3>Qué datos recogemos</h3>
        <ul>
          <li>
            <strong>Formulario de contacto:</strong> nombre, empresa, correo, teléfono, tema y mensaje, que
            nos entregas voluntariamente.
          </li>
          <li>
            <strong>Visitas al sitio:</strong> fecha y hora, dirección IP, sitio desde el que llegas, tipo de
            dispositivo, navegador y sistema operativo, y un identificador al azar guardado en tu navegador
            para saber si ya nos habías visitado. No usamos cookies de publicidad ni herramientas de
            seguimiento de terceros.
          </li>
        </ul>

        <h3>Para qué los usamos</h3>
        <ul>
          <li>Responder tus consultas y preparar propuestas.</li>
          <li>Conocer cuántas personas visitan el sitio y mejorarlo (estadísticas internas).</li>
          <li>Proteger el sitio frente a abusos, como envíos masivos de mensajes.</li>
        </ul>

        <h3>Con quién los compartimos</h3>
        <p>
          Con nadie: no vendemos ni cedemos tus datos. Se guardan en el servidor donde está alojado este
          sitio y solo acceden a ellos las personas de {sitio} que los necesitan para las finalidades
          anteriores.
        </p>

        <h3>Cuánto tiempo los guardamos</h3>
        <p>
          Los mensajes de contacto, mientras dure la relación comercial o hasta que pidas eliminarlos. Los
          registros de visitas, por un máximo de 24 meses.
        </p>

        <h3>Tus derechos</h3>
        <p>
          Puedes pedir acceso a tus datos, su rectificación, eliminación u oponerte a su uso, conforme a la
          Ley N° 19.628 sobre protección de la vida privada. Escríbenos a{" "}
          <a href={`mailto:${contacto.email}`}>{contacto.email}</a> y te responderemos a la brevedad.
        </p>
        <p>
          Si no quieres que se guarde el identificador de visitas, puedes borrar los datos del sitio en la
          configuración de tu navegador o navegar en modo privado.
        </p>

        <div className="privacidad__pie">
          <button className="boton boton--acento" onClick={cerrar}>
            Entendido
          </button>
        </div>
      </div>
    </dialog>
  );
}

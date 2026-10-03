import { useEffect, useRef } from "react";

// Ventana modal reutilizable (<dialog> nativo: foco, Esc y fondo incluidos).
// "bloquear" puede devolver false para impedir el cierre (ej. subida en curso).
export default function Ventana({ titulo, onCerrar, ancho, children, bloquear, clase = "adm-ventana" }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current.open) ref.current.showModal();
  }, []);
  const cerrar = () => {
    if (bloquear && !bloquear()) return;
    onCerrar();
  };
  return (
    <dialog
      ref={ref}
      className={clase}
      style={{ "--ancho": ancho }}
      onCancel={(e) => {
        e.preventDefault();
        cerrar();
      }}
      onClick={(e) => e.target === ref.current && cerrar()}
    >
      <div className={`${clase}__caja`}>
        <header className={`${clase}__cabecera`}>
          <h2>{titulo}</h2>
          <button className={`${clase}__cerrar`} onClick={cerrar} aria-label="Cerrar">
            ×
          </button>
        </header>
        {children}
      </div>
    </dialog>
  );
}

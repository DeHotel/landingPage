import { useEffect, useState } from "react";
import { navegacion } from "../data/contenido";
import Icono from "./Icono";
import Logo from "./Logo";

// base: "" en la landing; "/" en otras páginas, para que los enlaces vuelvan a las secciones de la portada.
export default function Navbar({ base = "" }) {
  const [scrolled, setScrolled] = useState(false);
  const [abierto, setAbierto] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const cerrar = () => setAbierto(false);

  return (
    <header className={`navbar ${scrolled || abierto ? "navbar--solida" : ""}`}>
      <div className="contenedor navbar__fila">
        <Logo onClick={cerrar} base={base} />

        <nav className={`navbar__menu ${abierto ? "navbar__menu--abierto" : ""}`}>
          {navegacion.map((item) => (
            <a key={item.id} href={`${base}#${item.id}`} onClick={cerrar}>
              {item.label}
            </a>
          ))}
          <a href="#contacto" className="boton boton--acento boton--chico" onClick={cerrar}>
            Hablemos
          </a>
        </nav>

        <button
          className="navbar__toggle"
          aria-label={abierto ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={abierto}
          onClick={() => setAbierto((v) => !v)}
        >
          <Icono nombre={abierto ? "cerrar" : "menu"} />
        </button>
      </div>
    </header>
  );
}

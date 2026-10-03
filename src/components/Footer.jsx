import { marca, navegacion, contacto } from "../data/contenido";
import Logo from "./Logo";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="contenedor footer__fila">
        <div>
          <Logo />
          <p className="footer__eslogan">{marca.eslogan}</p>
        </div>
        <nav className="footer__nav">
          {navegacion.map((item) => (
            <a key={item.id} href={`#${item.id}`}>
              {item.label}
            </a>
          ))}
        </nav>
        <p className="footer__contacto">
          <a href={`mailto:${contacto.email}`}>{contacto.email}</a>
          <br />
          {contacto.telefono}
        </p>
      </div>
      <div className="contenedor footer__legal">
        <span suppressHydrationWarning>
          © {new Date().getFullYear()} {marca.nombre}
          {marca.dominio}. Todos los derechos reservados.
        </span>
        <span>
          Registramos datos básicos de las visitas (como la IP) solo con fines estadísticos.{" "}
          <a href="#privacidad">Política de privacidad</a>
        </span>
      </div>
    </footer>
  );
}

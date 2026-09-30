import { useState } from "react";
import Visitas from "./Visitas";

// Módulos del panel. Los "proximamente" se muestran en el menú pero aún no se abren:
// al construir cada uno, se agrega su componente aquí.
const MODULOS = [
  { id: "visitas", titulo: "Visitas", icono: IconoVisitas, componente: Visitas },
  { id: "clientes", titulo: "Clientes", icono: IconoClientes, proximamente: true },
  { id: "productos", titulo: "Productos y servicios", icono: IconoProductos, proximamente: true },
  { id: "facturacion", titulo: "Facturación", icono: IconoFacturacion, proximamente: true },
];

export default function Panel({ usuario, onSalir }) {
  const [actual, setActual] = useState("visitas");
  const [menuAbierto, setMenuAbierto] = useState(false);
  const modulo = MODULOS.find((m) => m.id === actual);
  const Vista = modulo.componente;

  return (
    <div className={`adm-panel ${menuAbierto ? "adm-panel--menu" : ""}`}>
      <aside className="adm-lateral">
        <div className="adm-lateral__marca">
          <img src="/brand/isotipo.svg" width="34" height="34" alt="" />
          <span>
            dehotel<b>.cl</b>
          </span>
        </div>

        <nav className="adm-menu">
          {MODULOS.map((m) => (
            <button
              key={m.id}
              className={`adm-menu__item ${m.id === actual ? "adm-menu__item--activo" : ""}`}
              disabled={m.proximamente}
              onClick={() => {
                setActual(m.id);
                setMenuAbierto(false);
              }}
            >
              <m.icono />
              <span>{m.titulo}</span>
              {m.proximamente && <em>Pronto</em>}
            </button>
          ))}
        </nav>

        <div className="adm-lateral__pie">
          <div className="adm-usuario">
            <span className="adm-usuario__avatar">{usuario.nombre.trim().charAt(0).toUpperCase()}</span>
            <div>
              <strong>{usuario.nombre}</strong>
              <small>{usuario.email}</small>
            </div>
          </div>
          <a className="adm-lateral__link" href="/" target="_blank" rel="noreferrer">
            Ver sitio ↗
          </a>
          <button className="adm-lateral__link" onClick={onSalir}>
            Cerrar sesión
          </button>
        </div>
      </aside>

      <div className="adm-velo" onClick={() => setMenuAbierto(false)} aria-hidden="true" />

      <main className="adm-contenido">
        <header className="adm-barra">
          <button className="adm-barra__menu" onClick={() => setMenuAbierto(true)} aria-label="Abrir menú">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
          <h1>{modulo.titulo}</h1>
        </header>
        <Vista />
      </main>
    </div>
  );
}

function Svg({ children }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}
function IconoVisitas() {
  return (
    <Svg>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </Svg>
  );
}
function IconoClientes() {
  return (
    <Svg>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14a5.5 5.5 0 0 1 3.5 6" />
    </Svg>
  );
}
function IconoProductos() {
  return (
    <Svg>
      <path d="M21 8 12 3 3 8l9 5 9-5zM3 8v8l9 5 9-5V8M12 13v8" />
    </Svg>
  );
}
function IconoFacturacion() {
  return (
    <Svg>
      <path d="M6 2h9l5 5v15H6z" />
      <path d="M14 2v6h6M9 13h8M9 17h5" />
    </Svg>
  );
}

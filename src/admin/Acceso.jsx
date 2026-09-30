import { useState } from "react";
import { api } from "./api";
import Icono from "../components/Icono";

// Pantalla de login. Si todavía no existe ningún administrador (modo "instalar"),
// muestra el formulario para crear el primero, protegido por el código de instalación.
export default function Acceso({ modo, aviso, onIngreso }) {
  const instalar = modo === "instalar";
  const [datos, setDatos] = useState({ codigo: "", nombre: "", email: "", clave: "", clave2: "" });
  const [verClave, setVerClave] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  const cambiar = (e) => setDatos((d) => ({ ...d, [e.target.name]: e.target.value }));

  const enviar = async (e) => {
    e.preventDefault();
    setError("");
    if (instalar && datos.clave !== datos.clave2) {
      setError("Las claves no coinciden.");
      return;
    }
    setEnviando(true);
    try {
      const r = instalar
        ? await api.instalar({ codigo: datos.codigo, nombre: datos.nombre, email: datos.email, clave: datos.clave })
        : await api.login(datos.email, datos.clave);
      onIngreso(r.usuario);
    } catch (err) {
      setError(err.message);
      setEnviando(false);
    }
  };

  return (
    <div className="adm-acceso">
      <div className="adm-acceso__fondo" aria-hidden="true" />
      <form className="adm-tarjeta adm-acceso__tarjeta" onSubmit={enviar}>
        <div className="adm-acceso__marca">
          <img src="/brand/isotipo.svg" width="44" height="44" alt="" />
          <div>
            <strong>
              dehotel<span>.cl</span>
            </strong>
            <small>Panel de administración</small>
          </div>
        </div>

        <h1>{instalar ? "Configuración inicial" : "Iniciar sesión"}</h1>
        <p className="adm-texto-suave">
          {instalar
            ? "Crea la cuenta del primer administrador. El código de instalación está en config.production.php."
            : "Ingresa con tu correo y clave de administrador."}
        </p>

        {aviso && !error && <p className="adm-aviso">{aviso}</p>}

        {instalar && (
          <>
            <Campo label="Código de instalación" name="codigo" value={datos.codigo} onChange={cambiar} required autoComplete="off" />
            <Campo label="Nombre" name="nombre" value={datos.nombre} onChange={cambiar} required autoComplete="name" />
          </>
        )}
        <Campo label="Correo" type="email" name="email" value={datos.email} onChange={cambiar} required autoComplete="username" autoFocus={!instalar} />

        <label className="adm-campo">
          <span>Clave</span>
          <div className="adm-campo__clave">
            <input
              type={verClave ? "text" : "password"}
              name="clave"
              value={datos.clave}
              onChange={cambiar}
              required
              minLength={instalar ? 10 : undefined}
              autoComplete={instalar ? "new-password" : "current-password"}
            />
            <button type="button" onClick={() => setVerClave((v) => !v)} aria-label={verClave ? "Ocultar clave" : "Mostrar clave"}>
              {verClave ? "Ocultar" : "Ver"}
            </button>
          </div>
          {instalar && <small className="adm-texto-suave">Mínimo 10 caracteres, con letras y números.</small>}
        </label>

        {instalar && (
          <Campo label="Repite la clave" type={verClave ? "text" : "password"} name="clave2" value={datos.clave2} onChange={cambiar} required autoComplete="new-password" />
        )}

        {error && (
          <p className="adm-error" role="alert">
            <Icono nombre="alerta" size={18} /> {error}
          </p>
        )}

        <button type="submit" className="adm-boton adm-boton--bloque" disabled={enviando}>
          {enviando ? "Verificando…" : instalar ? "Crear administrador" : "Ingresar"}
        </button>

        <a className="adm-volver" href="/">
          ← Volver al sitio
        </a>
      </form>
    </div>
  );
}

function Campo({ label, ...props }) {
  return (
    <label className="adm-campo">
      <span>{label}</span>
      <input {...props} />
    </label>
  );
}

import { useState } from "react";
import { contacto, temasContacto } from "../data/contenido";
import Icono from "./Icono";

const vacio = {
  nombre: "",
  empresa: "",
  email: "",
  telefono: "",
  tema: "",
  mensaje: "",
  website: "", // campo trampa anti-spam: oculto para personas, los bots lo llenan
};

// El mensaje se guarda en MySQL a través de la API PHP (public/api/). En desarrollo,
// Vite redirige /api al servidor PHP local (ver vite.config.js).
async function enviarMensaje(datos) {
  const res = await fetch("/api/contacto.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datos),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || "No pudimos enviar tu mensaje.");
  return json;
}

export default function Contacto() {
  const [form, setForm] = useState(vacio);
  const [estado, setEstado] = useState("idle"); // idle | enviando | ok | error
  const [error, setError] = useState("");

  const cambiar = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const enviar = async (e) => {
    e.preventDefault();
    setEstado("enviando");
    setError("");
    try {
      await enviarMensaje(form);
      setEstado("ok");
    } catch (err) {
      setError(err.message);
      setEstado("error");
    }
  };

  return (
    <section id="contacto" className="seccion seccion--oscura">
      <div className="contenedor contacto">
        <div className="contacto__info">
          <p className="sobretitulo">Contacto</p>
          <h2>Cuéntanos qué necesitas construir</h2>
          <p className="texto-suave">
            Escríbenos con una idea general de tu proyecto. Te respondemos en menos de 24 horas
            hábiles para agendar una primera conversación, sin costo.
          </p>

          <ul className="contacto__datos">
            <li>
              <Icono nombre="correo" size={20} />
              <a href={`mailto:${contacto.email}`}>{contacto.email}</a>
            </li>
            <li>
              <Icono nombre="telefono" size={20} />
              <a href={`tel:${contacto.telefono.replace(/\s/g, "")}`}>{contacto.telefono}</a>
            </li>
            <li>
              <Icono nombre="pin" size={20} />
              {contacto.direccion}
            </li>
            <li>
              <Icono nombre="reloj" size={20} />
              {contacto.horario}
            </li>
          </ul>
        </div>

        <form className="formulario" onSubmit={enviar} noValidate={false}>
          {estado === "ok" ? (
            <div className="formulario__ok" role="status">
              <Icono nombre="check" size={36} />
              <h3>¡Gracias, {form.nombre.trim().split(" ")[0]}!</h3>
              <p>Recibimos tu mensaje. Te contactaremos pronto a {form.email}.</p>
              <button
                type="button"
                className="boton boton--contorno-oscuro"
                onClick={() => {
                  setForm(vacio);
                  setEstado("idle");
                }}
              >
                Enviar otro mensaje
              </button>
            </div>
          ) : (
            <>
              <div className="formulario__fila">
                <Campo label="Nombre" name="nombre" value={form.nombre} onChange={cambiar} required maxLength={120} autoComplete="name" />
                <Campo label="Empresa" name="empresa" value={form.empresa} onChange={cambiar} maxLength={120} autoComplete="organization" />
              </div>
              <div className="formulario__fila">
                <Campo label="Correo" type="email" name="email" value={form.email} onChange={cambiar} required maxLength={160} autoComplete="email" />
                <Campo label="Teléfono" type="tel" name="telefono" value={form.telefono} onChange={cambiar} maxLength={40} autoComplete="tel" />
              </div>
              <label className="campo">
                <span>¿En qué te podemos ayudar?</span>
                <select name="tema" value={form.tema} onChange={cambiar} required>
                  <option value="" disabled>
                    Selecciona una opción
                  </option>
                  {temasContacto.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>
              <label className="campo">
                <span>Mensaje</span>
                <textarea
                  name="mensaje"
                  rows="5"
                  value={form.mensaje}
                  onChange={cambiar}
                  required
                  maxLength={4000}
                  placeholder="Cuéntanos brevemente tu proyecto, los sistemas que usas hoy y los plazos que manejas…"
                />
              </label>
              <input
                type="text"
                name="website"
                value={form.website}
                onChange={cambiar}
                className="trampa"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
              />

              {estado === "error" && (
                <p className="formulario__error" role="alert">
                  <Icono nombre="alerta" size={18} />
                  <span>
                    {error} También puedes escribirnos a{" "}
                    <a href={`mailto:${contacto.email}`}>{contacto.email}</a>.
                  </span>
                </p>
              )}

              <button type="submit" className="boton boton--acento boton--bloque" disabled={estado === "enviando"}>
                {estado === "enviando" ? "Enviando…" : "Enviar mensaje"}
                {estado !== "enviando" && <Icono nombre="flecha" size={18} />}
              </button>
            </>
          )}
        </form>
      </div>
    </section>
  );
}

function Campo({ label, ...props }) {
  return (
    <label className="campo">
      <span>{label}</span>
      <input {...props} />
    </label>
  );
}

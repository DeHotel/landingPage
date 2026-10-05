import { useState } from "react";
import { api } from "../api";

// Pestaña "Cuentas y categorías".
export default function Configuracion({ catalogos, onCambio }) {
  const [aviso, setAviso] = useState("");
  const [error, setError] = useState("");

  const hacer = async (accion, datos, mensaje) => {
    setError("");
    setAviso("");
    try {
      await api.finanzasAccion(accion, datos);
      setAviso(mensaje);
      onCambio();
      return true;
    } catch (e) {
      setError(e.message);
      return false;
    }
  };

  return (
    <div className="adm-seccion">
      {aviso && <p className="adm-aviso">{aviso}</p>}
      {error && <p className="adm-error">{error}</p>}

      <section className="adm-tarjeta">
        <div className="adm-tarjeta__titulo">
          <h2>Cuentas</h2>
          <span className="adm-texto-suave">Separan tus finanzas (ej. personal y empresa)</span>
        </div>
        <ul className="adm-lista-grupos">
          {catalogos.cuentas.map((c) => (
            <FilaCuenta key={c.id} cuenta={c} hacer={hacer} />
          ))}
        </ul>
        <NuevoElemento placeholder="Nombre de la nueva cuenta" onCrear={(nombre) => hacer("guardar_cuenta", { cuenta: { nombre, color: "#22d3ee" } }, `Cuenta «${nombre}» creada.`)} />
      </section>

      <div className="adm-dos">
        {[
          ["ingreso", "Categorías de ingresos"],
          ["egreso", "Categorías de egresos"],
        ].map(([tipo, titulo]) => (
          <section key={tipo} className="adm-tarjeta">
            <div className="adm-tarjeta__titulo">
              <h2>{titulo}</h2>
            </div>
            <ul className="adm-lista-grupos">
              {catalogos.categorias
                .filter((c) => c.tipo === tipo)
                .map((c) => (
                  <FilaCategoria key={c.id} categoria={c} hacer={hacer} />
                ))}
            </ul>
            <NuevoElemento placeholder="Nueva categoría" onCrear={(nombre) => hacer("guardar_categoria", { categoria: { tipo, nombre } }, `Categoría «${nombre}» creada.`)} />
          </section>
        ))}
      </div>
    </div>
  );
}

function FilaCuenta({ cuenta, hacer }) {
  const [nombre, setNombre] = useState(cuenta.nombre);
  const [color, setColor] = useState(cuenta.color);
  const cambio = nombre.trim() && (nombre.trim() !== cuenta.nombre || color !== cuenta.color);
  return (
    <li>
      <form
        className="adm-lista-grupos__fila"
        onSubmit={(e) => {
          e.preventDefault();
          if (cambio) hacer("guardar_cuenta", { cuenta: { ...cuenta, nombre: nombre.trim(), color } }, "Cuenta actualizada.");
        }}
      >
        <input type="color" className="adm-fin__selector-color" value={color} onChange={(e) => setColor(e.target.value)} aria-label="Color" />
        <input value={nombre} maxLength={60} onChange={(e) => setNombre(e.target.value)} aria-label="Nombre de la cuenta" />
        <span className="adm-texto-suave adm-lista-grupos__n">
          {cuenta.movimientos} mov.{!cuenta.activa && " · desactivada"}
        </span>
        <button className="adm-boton adm-boton--suave" disabled={!cambio}>
          Guardar
        </button>
        <button
          type="button"
          className="adm-boton adm-boton--suave"
          onClick={() => hacer("guardar_cuenta", { cuenta: { ...cuenta, activa: !cuenta.activa } }, cuenta.activa ? "Cuenta desactivada: ya no aparece al registrar movimientos." : "Cuenta activada.")}
        >
          {cuenta.activa ? "Desactivar" : "Activar"}
        </button>
        {cuenta.movimientos === 0 && (
          <button type="button" className="adm-boton adm-boton--suave adm-boton--texto-peligro" onClick={() => window.confirm(`¿Eliminar la cuenta «${cuenta.nombre}»?`) && hacer("eliminar_cuenta", { id: cuenta.id }, "Cuenta eliminada.")}>
            Eliminar
          </button>
        )}
      </form>
    </li>
  );
}

function FilaCategoria({ categoria, hacer }) {
  const [nombre, setNombre] = useState(categoria.nombre);
  const cambio = nombre.trim() && nombre.trim() !== categoria.nombre;
  return (
    <li>
      <form
        className="adm-lista-grupos__fila"
        onSubmit={(e) => {
          e.preventDefault();
          if (cambio) hacer("guardar_categoria", { categoria: { ...categoria, nombre: nombre.trim() } }, "Categoría actualizada.");
        }}
      >
        <input value={nombre} maxLength={60} onChange={(e) => setNombre(e.target.value)} aria-label="Nombre de la categoría" />
        <span className="adm-texto-suave adm-lista-grupos__n">{categoria.movimientos} mov.</span>
        <button className="adm-boton adm-boton--suave" disabled={!cambio}>
          Guardar
        </button>
        <button
          type="button"
          className="adm-boton adm-boton--suave adm-boton--texto-peligro"
          onClick={() =>
            window.confirm(
              categoria.movimientos > 0
                ? `¿Eliminar «${categoria.nombre}»? Sus ${categoria.movimientos} movimientos quedarán «Sin categoría».`
                : `¿Eliminar «${categoria.nombre}»?`
            ) && hacer("eliminar_categoria", { id: categoria.id }, "Categoría eliminada.")
          }
        >
          Eliminar
        </button>
      </form>
    </li>
  );
}

function NuevoElemento({ placeholder, onCrear }) {
  const [nombre, setNombre] = useState("");
  return (
    <form
      className="adm-grupos__form adm-fin__nuevo"
      onSubmit={async (e) => {
        e.preventDefault();
        if (nombre.trim() && (await onCrear(nombre.trim()))) setNombre("");
      }}
    >
      <input value={nombre} maxLength={60} placeholder={placeholder} onChange={(e) => setNombre(e.target.value)} />
      <button className="adm-boton" disabled={!nombre.trim()}>
        Agregar
      </button>
    </form>
  );
}

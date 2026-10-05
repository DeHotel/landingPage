import { useState } from "react";
import { api } from "../api";
import Ventana from "../Ventana";
import { aNumero, fechaCl, hoyIso, pesos, separarMiles } from "./dinero";

// Pestaña "Recurrentes": pagos que se repiten (créditos, contratos, remuneración).
export default function Recurrentes({ catalogos, onCambio }) {
  const [ficha, setFicha] = useState(null); // null | {} | recurrente
  const [aviso, setAviso] = useState("");
  const [error, setError] = useState("");
  const [confirmar, setConfirmar] = useState(null);

  const accion = async (fn, mensaje) => {
    setError("");
    try {
      await fn();
      setAviso(mensaje);
      onCambio();
    } catch (e) {
      setError(e.message);
    } finally {
      setConfirmar(null);
    }
  };

  const lista = catalogos.recurrentes;

  return (
    <div className="adm-seccion">
      <div className="adm-filtros">
        <p className="adm-texto-suave adm-fin__ayuda">
          Defínelos una vez y cada mes aparecen solos como pendientes en «Movimientos». Ideal para créditos en cuotas, internet, teléfono, arriendo o tu remuneración.
        </p>
        <button className="adm-boton adm-clientes__nuevo" onClick={() => setFicha({})}>
          + Nuevo recurrente
        </button>
      </div>

      {aviso && <p className="adm-aviso">{aviso}</p>}
      {error && <p className="adm-error">{error}</p>}

      {lista.length === 0 ? (
        <button className="adm-videos__vacio" onClick={() => setFicha({})}>
          <strong>Aún no tienes pagos recurrentes</strong>
          <span>Por ejemplo: «Crédito de consumo, 24 cuotas de $150.000» o «Internet hogar, $25.990 mensual».</span>
        </button>
      ) : (
        <section className="adm-tarjeta">
          <div className="adm-tabla-caja">
            <table className="adm-tabla">
              <thead>
                <tr>
                  <th>Descripción</th>
                  <th>Monto</th>
                  <th>Frecuencia</th>
                  <th>Avance</th>
                  <th>Próximo</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {lista.map((r) => (
                  <tr key={r.id} className={r.activo ? "" : "adm-fin__pausado"}>
                    <td>
                      <strong className="adm-clientes__nombre">
                        <span className={`adm-fin__flecha adm-fin__flecha--${r.tipo}`}>{r.tipo === "ingreso" ? "↑" : "↓"}</span> {r.descripcion}
                      </strong>
                      <span className="adm-texto-suave adm-clientes__sub">
                        {r.cuenta} · {r.categoria ?? "Sin categoría"}
                        {!r.activo && " · En pausa"}
                      </span>
                    </td>
                    <td className="adm-nowrap">{pesos(r.monto)}</td>
                    <td className="adm-nowrap">
                      {r.frecuencia === "anual" ? "Anual" : "Mensual"}, día {r.dia_pago}
                    </td>
                    <td className="adm-nowrap">
                      {r.cuotas ? (
                        <>
                          {r.pagadas} de {r.cuotas} pagadas
                          <div className="adm-dist__barra adm-fin__avance">
                            <i style={{ width: `${Math.min(100, (r.pagadas / r.cuotas) * 100)}%` }} />
                          </div>
                        </>
                      ) : (
                        <span className="adm-texto-suave">
                          Sin término · {r.pagadas} {r.pagadas === 1 ? "pagada" : "pagadas"}
                        </span>
                      )}
                    </td>
                    <td className="adm-nowrap">{r.activo && r.proximo ? fechaCl(r.proximo) : <span className="adm-texto-suave">—</span>}</td>
                    <td className="adm-nowrap adm-fin__acciones">
                      <button className="adm-boton adm-boton--suave" onClick={() => setFicha(r)}>
                        Editar
                      </button>
                      <button
                        className="adm-boton adm-boton--suave"
                        onClick={() => accion(() => api.finanzasAccion("activar_recurrente", { id: r.id, activo: !r.activo }), r.activo ? `«${r.descripcion}» en pausa: no se generarán más cuotas.` : `«${r.descripcion}» reanudado.`)}
                      >
                        {r.activo ? "Pausar" : "Reanudar"}
                      </button>
                      {confirmar === r.id ? (
                        <span className="adm-confirmar">
                          ¿Eliminar? (lo ya pagado se conserva)
                          <button className="adm-boton adm-boton--peligro" onClick={() => accion(() => api.finanzasAccion("eliminar_recurrente", { id: r.id }), "Recurrente eliminado.")}>
                            Sí
                          </button>
                          <button className="adm-boton adm-boton--suave" onClick={() => setConfirmar(null)}>
                            No
                          </button>
                        </span>
                      ) : (
                        <button className="adm-boton adm-boton--suave adm-boton--texto-peligro" onClick={() => setConfirmar(r.id)}>
                          Eliminar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {ficha && (
        <RecurrenteFicha
          inicial={ficha}
          catalogos={catalogos}
          onGuardado={(mensaje) => {
            setFicha(null);
            setAviso(mensaje);
            onCambio();
          }}
          onCerrar={() => setFicha(null)}
        />
      )}
    </div>
  );
}

function RecurrenteFicha({ inicial, catalogos, onGuardado, onCerrar }) {
  const existente = Boolean(inicial.id);
  const [r, setR] = useState(() => ({
    id: inicial.id ?? null,
    tipo: inicial.tipo ?? "egreso",
    descripcion: inicial.descripcion ?? "",
    monto: inicial.monto ? separarMiles(inicial.monto) : "",
    cuenta_id: inicial.cuenta_id ?? catalogos.cuentas.find((c) => c.activa)?.id ?? "",
    categoria_id: inicial.categoria_id ?? "",
    frecuencia: inicial.frecuencia ?? "mensual",
    inicio: inicial.inicio ?? hoyIso(),
    cuotas: inicial.cuotas ?? "",
    notas: inicial.notas ?? "",
  }));
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const cambiar = (campo) => (e) => setR((x) => ({ ...x, [campo]: e.target.value }));
  const categorias = catalogos.categorias.filter((c) => c.tipo === r.tipo);

  const guardar = async (e) => {
    e.preventDefault();
    setGuardando(true);
    setError("");
    try {
      const res = await api.finanzasAccion("guardar_recurrente", {
        recurrente: { ...r, monto: aNumero(r.monto), categoria_id: r.categoria_id || null, cuotas: r.cuotas === "" ? null : Number(r.cuotas) },
      });
      onGuardado(
        existente
          ? "Recurrente actualizado: las cuotas pendientes futuras se ajustaron."
          : `Recurrente creado${res.cuotasGeneradas ? `: ${res.cuotasGeneradas} ${res.cuotasGeneradas === 1 ? "cuota pendiente generada" : "cuotas pendientes generadas"}` : ""}.`
      );
    } catch (err) {
      setError(err.message);
      setGuardando(false);
    }
  };

  const dia = Number(r.inicio.slice(8, 10));

  return (
    <Ventana titulo={existente ? "Editar recurrente" : "Nuevo recurrente"} ancho="620px" onCerrar={onCerrar}>
      <form className="adm-ficha" onSubmit={guardar}>
        <div className={`adm-ficha__tipo adm-fin__tipo adm-fin__tipo--${r.tipo}`} role="radiogroup" aria-label="Tipo">
          {[
            ["ingreso", "↑ Ingreso"],
            ["egreso", "↓ Egreso"],
          ].map(([valor, texto]) => (
            <button key={valor} type="button" role="radio" aria-checked={r.tipo === valor} className={r.tipo === valor ? "activo" : ""} onClick={() => setR((x) => ({ ...x, tipo: valor, categoria_id: "" }))}>
              {texto}
            </button>
          ))}
        </div>
        <div className="adm-ficha__grilla">
          <label className="adm-campo adm-ficha__campo adm-ficha__campo--2">
            <span>Descripción *</span>
            <input value={r.descripcion} onChange={cambiar("descripcion")} required maxLength={150} autoFocus={!existente} placeholder="Ej.: Crédito de consumo Banco X" />
          </label>
          <label className="adm-campo adm-ficha__campo">
            <span>Monto de cada cuota *</span>
            <div className="adm-fin__monto">
              <b>$</b>
              <input value={r.monto} inputMode="numeric" required onChange={(e) => setR((x) => ({ ...x, monto: separarMiles(e.target.value) }))} placeholder="0" />
            </div>
          </label>
          <label className="adm-campo adm-ficha__campo">
            <span>Cuenta</span>
            <select className="adm-select adm-select--campo" value={r.cuenta_id} onChange={cambiar("cuenta_id")}>
              {catalogos.cuentas
                .filter((c) => c.activa || c.id === Number(r.cuenta_id))
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
            </select>
          </label>
          <label className="adm-campo adm-ficha__campo">
            <span>Categoría</span>
            <select className="adm-select adm-select--campo" value={r.categoria_id ?? ""} onChange={cambiar("categoria_id")}>
              <option value="">Sin categoría</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </label>
          <label className="adm-campo adm-ficha__campo">
            <span>Se repite</span>
            <select className="adm-select adm-select--campo" value={r.frecuencia} onChange={cambiar("frecuencia")}>
              <option value="mensual">Cada mes</option>
              <option value="anual">Cada año</option>
            </select>
          </label>
          <label className="adm-campo adm-ficha__campo">
            <span>Primer vencimiento</span>
            <input type="date" value={r.inicio} onChange={cambiar("inicio")} required />
            <small>{r.frecuencia === "anual" ? "Se repite cada año en esta fecha." : `Vence el día ${dia} de cada mes${dia > 28 ? " (o el último día, si el mes es más corto)" : ""}.`}</small>
          </label>
          <label className="adm-campo adm-ficha__campo">
            <span>N° de cuotas</span>
            <input type="number" min={1} max={600} value={r.cuotas} onChange={cambiar("cuotas")} placeholder="Sin término" />
            <small>Vacío si no termina (ej. internet).</small>
          </label>
          <label className="adm-campo adm-ficha__campo adm-ficha__campo--3">
            <span>Notas</span>
            <textarea className="adm-ficha__notas" rows={2} value={r.notas ?? ""} onChange={cambiar("notas")} maxLength={5000} />
          </label>
        </div>
        {r.cuotas && aNumero(r.monto) > 0 && (
          <p className="adm-texto-suave adm-ficha__nota">
            Total: {r.cuotas} cuotas de {pesos(aNumero(r.monto))} = <b>{pesos(aNumero(r.monto) * Number(r.cuotas))}</b>
          </p>
        )}
        {error && <p className="adm-error">{error}</p>}
        <footer className="adm-ventana__pie">
          <span className="adm-texto-suave adm-ficha__nota">Solo se generan cuotas desde este mes en adelante.</span>
          <div className="adm-ficha__botones">
            <button type="button" className="adm-boton adm-boton--suave" onClick={onCerrar}>
              Cancelar
            </button>
            <button className="adm-boton" disabled={guardando}>
              {guardando ? "Guardando…" : existente ? "Guardar cambios" : "Crear recurrente"}
            </button>
          </div>
        </footer>
      </form>
    </Ventana>
  );
}

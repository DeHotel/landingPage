import { useEffect, useMemo, useState } from "react";
import { api } from "../api";
import { aNumero, mesCorto, nombreMes, pesos, separarMiles } from "./dinero";

const CLAVE_SALDO = "dh_fin_saldo_inicial";

function leerSaldo(cuenta) {
  try {
    return localStorage.getItem(`${CLAVE_SALDO}_${cuenta || "todas"}`) ?? "";
  } catch {
    return "";
  }
}

// Agrupa las filas del servidor por categoría (suma sus conceptos) o las deja por concepto.
function agrupar(filas, tipo, porConcepto, cantidad) {
  const grupos = new Map();
  for (const f of filas.filter((x) => x.tipo === tipo)) {
    const clave = porConcepto ? `${f.categoria}|${f.concepto}` : f.categoria;
    if (!grupos.has(clave)) {
      grupos.set(clave, {
        clave,
        titulo: porConcepto ? f.concepto : f.categoria,
        subtitulo: porConcepto ? f.categoria : null,
        valores: Array(cantidad).fill(0),
        proyectados: Array(cantidad).fill(0),
      });
    }
    const g = grupos.get(clave);
    f.valores.forEach((v, i) => (g.valores[i] += v));
    f.proyectados.forEach((v, i) => (g.proyectados[i] += v));
  }
  return [...grupos.values()].sort((a, b) => b.valores.reduce((s, v) => s + v, 0) - a.valores.reduce((s, v) => s + v, 0));
}

const sumar = (filas, cantidad) => filas.reduce((t, f) => t.map((v, i) => v + f.valores[i]), Array(cantidad).fill(0));

// Pestaña "Proyección": flujo de caja del mes actual y los siguientes.
export default function Proyeccion({ cuenta, version, catalogos }) {
  const [meses, setMeses] = useState(12);
  const [porConcepto, setPorConcepto] = useState(false);
  const [saldoInicial, setSaldoInicial] = useState(() => leerSaldo(cuenta));
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => setSaldoInicial(leerSaldo(cuenta)), [cuenta]);

  useEffect(() => {
    setError("");
    api
      .finanzas({ vista: "proyeccion", meses, cuenta })
      .then(setDatos)
      .catch((e) => setError(e.message));
  }, [meses, cuenta, version]);

  const cambiarSaldo = (texto) => {
    const limpio = texto.trim().startsWith("-") ? `-${separarMiles(texto)}` : separarMiles(texto);
    setSaldoInicial(limpio === "-" ? "-" : limpio);
    try {
      localStorage.setItem(`${CLAVE_SALDO}_${cuenta || "todas"}`, limpio);
    } catch {
      // sin almacenamiento
    }
  };

  const tabla = useMemo(() => {
    if (!datos) return null;
    const n = datos.meses.length;
    const ingresos = agrupar(datos.filas, "ingreso", porConcepto, n);
    const egresos = agrupar(datos.filas, "egreso", porConcepto, n);
    const totalIngresos = sumar(ingresos, n);
    const totalEgresos = sumar(egresos, n);
    const saldoMes = totalIngresos.map((v, i) => v - totalEgresos[i]);
    const base = (saldoInicial.startsWith("-") ? -1 : 1) * aNumero(saldoInicial);
    let acumulado = base;
    const saldoFinal = saldoMes.map((v) => (acumulado += v));
    return { ingresos, egresos, totalIngresos, totalEgresos, saldoMes, saldoFinal };
  }, [datos, porConcepto, saldoInicial]);

  const descargarCsv = () => {
    const fila = (titulo, valores) => [titulo, ...valores].map((x) => `"${String(x).replace(/"/g, '""')}"`).join(";");
    const lineas = [
      fila("Concepto", datos.meses.map(nombreMes)),
      fila("INGRESOS", []),
      ...tabla.ingresos.map((f) => fila(f.titulo, f.valores)),
      fila("Total ingresos", tabla.totalIngresos),
      fila("EGRESOS", []),
      ...tabla.egresos.map((f) => fila(f.titulo, f.valores)),
      fila("Total egresos", tabla.totalEgresos),
      fila("Saldo del mes", tabla.saldoMes),
      fila("Saldo final", tabla.saldoFinal),
    ];
    // BOM para que Excel lea bien las tildes.
    const blob = new Blob(["﻿" + lineas.join("\r\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    const nombreCuenta = catalogos.cuentas.find((c) => String(c.id) === String(cuenta))?.nombre ?? "todas";
    a.download = `proyeccion-${nombreCuenta}-${datos.meses[0]}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  if (error) return <p className="adm-error">{error}</p>;
  if (!datos || !tabla) {
    return (
      <div className="adm-centro adm-centro--bajo">
        <span className="adm-spinner" aria-label="Cargando" />
      </div>
    );
  }

  const vacio = datos.filas.length === 0;
  const colorSaldo = (v) => (v < 0 ? "adm-fin__monto-egreso" : v > 0 ? "adm-fin__monto-ingreso" : "");

  return (
    <div className="adm-seccion">
      <div className="adm-filtros">
        <div className="adm-chips" role="group" aria-label="Meses a proyectar">
          {[6, 12, 24].map((n) => (
            <button key={n} className={meses === n ? "activo" : ""} onClick={() => setMeses(n)}>
              {n} meses
            </button>
          ))}
        </div>
        <div className="adm-chips" role="group" aria-label="Agrupar">
          <button className={!porConcepto ? "activo" : ""} onClick={() => setPorConcepto(false)}>
            Por categoría
          </button>
          <button className={porConcepto ? "activo" : ""} onClick={() => setPorConcepto(true)}>
            Por concepto
          </button>
        </div>
        <label className="adm-fin__saldo-inicial">
          <span>Saldo al inicio de {nombreMes(datos.meses[0]).split(" ")[0].toLowerCase()}</span>
          <div className="adm-fin__monto">
            <b>$</b>
            <input value={saldoInicial} inputMode="numeric" placeholder="0" onChange={(e) => cambiarSaldo(e.target.value)} />
          </div>
        </label>
        <button className="adm-boton adm-boton--suave" onClick={descargarCsv} disabled={vacio}>
          Descargar CSV
        </button>
      </div>

      {vacio ? (
        <p className="adm-vacio">No hay movimientos ni recurrentes activos para proyectar. Crea tus pagos fijos en «Recurrentes».</p>
      ) : (
        <section className="adm-tarjeta adm-fin__proyeccion">
          <div className="adm-tabla-caja">
            <table className="adm-tabla adm-fin__tabla-proy">
              <thead>
                <tr>
                  <th className="adm-fin__fija">Concepto</th>
                  {datos.meses.map((m, i) => (
                    <th key={m} className={`adm-fin__derecha ${i === 0 ? "adm-fin__mes-actual" : ""}`}>
                      {mesCorto(m)} {m.slice(2, 4)}
                      {i === 0 && <small>actual</small>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <Seccion titulo="Ingresos" tipo="ingreso" columnas={datos.meses.length} />
                {tabla.ingresos.map((f) => (
                  <Fila key={f.clave} fila={f} />
                ))}
                <Total titulo="Total ingresos" valores={tabla.totalIngresos} clase="adm-fin__monto-ingreso" />

                <Seccion titulo="Egresos" tipo="egreso" columnas={datos.meses.length} />
                {tabla.egresos.map((f) => (
                  <Fila key={f.clave} fila={f} />
                ))}
                <Total titulo="Total egresos" valores={tabla.totalEgresos} clase="adm-fin__monto-egreso" />

                <tr className="adm-fin__fila-saldo">
                  <th className="adm-fin__fija">Saldo del mes</th>
                  {tabla.saldoMes.map((v, i) => (
                    <td key={i} className={`adm-fin__derecha adm-nowrap ${colorSaldo(v)}`}>
                      {pesos(v)}
                    </td>
                  ))}
                </tr>
                <tr className="adm-fin__fila-final">
                  <th className="adm-fin__fija">Saldo final</th>
                  {tabla.saldoFinal.map((v, i) => (
                    <td key={i} className={`adm-fin__derecha adm-nowrap ${colorSaldo(v)}`}>
                      {pesos(v)}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
          <p className="adm-texto-suave adm-fin__nota-proy">
            <i className="adm-fin__muestra-proy" /> En cursiva: montos proyectados desde tus recurrentes activos (aún no registrados). El mes actual incluye lo pagado y lo pendiente. El saldo final suma el saldo inicial y el saldo de cada mes.
          </p>
        </section>
      )}
    </div>
  );
}

function Seccion({ titulo, tipo, columnas }) {
  return (
    <tr className={`adm-fin__seccion adm-fin__seccion--${tipo}`}>
      <th className="adm-fin__fija">{titulo}</th>
      <td colSpan={columnas} />
    </tr>
  );
}

function Fila({ fila }) {
  return (
    <tr>
      <td className="adm-fin__fija adm-fin__concepto">
        {fila.titulo}
        {fila.subtitulo && <small className="adm-texto-suave">{fila.subtitulo}</small>}
      </td>
      {fila.valores.map((v, i) => (
        <td
          key={i}
          className={`adm-fin__derecha adm-nowrap ${v && fila.proyectados[i] === v ? "adm-fin__proyectado" : ""}`}
          title={fila.proyectados[i] && fila.proyectados[i] !== v ? `Incluye ${pesos(fila.proyectados[i])} proyectado` : undefined}
        >
          {v ? pesos(v) : <span className="adm-texto-suave">—</span>}
        </td>
      ))}
    </tr>
  );
}

function Total({ titulo, valores, clase }) {
  return (
    <tr className="adm-fin__fila-total">
      <th className="adm-fin__fija">{titulo}</th>
      {valores.map((v, i) => (
        <td key={i} className={`adm-fin__derecha adm-nowrap ${clase}`}>
          {pesos(v)}
        </td>
      ))}
    </tr>
  );
}

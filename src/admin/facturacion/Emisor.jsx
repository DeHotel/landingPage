import { useState } from "react";
import { api } from "../api";
import { formatearRut, rutValido } from "../chile";

// Pestaña "Datos del emisor": aparecen en cotizaciones y documentos.
export default function Emisor({ config, onGuardado }) {
  const [e, setE] = useState({ ...config.emisor, rut: formatearRut(config.emisor.rut) });
  const [otros, setOtros] = useState({
    retencion_honorarios: String(config.retencion_honorarios).replace(".", ","),
    validez_cotizacion: config.validez_cotizacion,
    condiciones: config.condiciones,
  });
  const [guardando, setGuardando] = useState(false);
  const [aviso, setAviso] = useState("");
  const [error, setError] = useState("");
  const campo = (c) => ({ value: e[c] ?? "", onChange: (ev) => setE((x) => ({ ...x, [c]: ev.target.value })) });
  const rutOk = rutValido(e.rut);

  const guardar = async (ev) => {
    ev.preventDefault();
    if (!rutOk) return setError("El RUT no es válido.");
    setGuardando(true);
    setError("");
    setAviso("");
    try {
      const r = await api.guardarConfigFacturacion({
        emisor: e,
        retencion_honorarios: otros.retencion_honorarios.replace(",", "."),
        validez_cotizacion: otros.validez_cotizacion,
        condiciones: otros.condiciones,
      });
      onGuardado(r);
      setAviso("Datos guardados. Se usarán en los próximos documentos que generes.");
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <form className="adm-tarjeta adm-ficha" onSubmit={guardar}>
      <fieldset className="adm-ficha__grupo">
        <legend>Tus datos (emisor)</legend>
        <div className="adm-ficha__grilla">
          <label className="adm-campo adm-ficha__campo adm-ficha__campo--2">
            <span>Nombre o razón social</span>
            <input {...campo("nombre")} maxLength={150} placeholder="Ej.: Juan Pérez / Mi Empresa SpA" />
          </label>
          <label className={`adm-campo adm-ficha__campo ${rutOk ? "" : "adm-ficha__campo--error"}`}>
            <span>RUT</span>
            <input value={e.rut} onChange={(ev) => setE((x) => ({ ...x, rut: formatearRut(ev.target.value) }))} placeholder="12.345.678-9" />
            {!rutOk && <small>RUT inválido</small>}
          </label>
          <label className="adm-campo adm-ficha__campo adm-ficha__campo--3">
            <span>Giro o actividad</span>
            <input {...campo("giro")} maxLength={150} placeholder="Ej.: Desarrollo de software y servicios informáticos" />
          </label>
          <label className="adm-campo adm-ficha__campo">
            <span>Dirección</span>
            <input {...campo("direccion")} maxLength={200} />
          </label>
          <label className="adm-campo adm-ficha__campo">
            <span>Comuna</span>
            <input {...campo("comuna")} maxLength={80} />
          </label>
          <label className="adm-campo adm-ficha__campo">
            <span>Ciudad</span>
            <input {...campo("ciudad")} maxLength={80} />
          </label>
          <label className="adm-campo adm-ficha__campo">
            <span>Correo</span>
            <input type="email" {...campo("email")} maxLength={160} />
          </label>
          <label className="adm-campo adm-ficha__campo">
            <span>Teléfono</span>
            <input {...campo("telefono")} maxLength={40} />
          </label>
          <label className="adm-campo adm-ficha__campo">
            <span>Sitio web</span>
            <input {...campo("sitio")} maxLength={100} />
          </label>
        </div>
      </fieldset>

      <fieldset className="adm-ficha__grupo">
        <legend>Valores por defecto</legend>
        <div className="adm-ficha__grilla">
          <label className="adm-campo adm-ficha__campo">
            <span>Retención boletas de honorarios (%)</span>
            <input inputMode="decimal" value={otros.retencion_honorarios} onChange={(ev) => setOtros((x) => ({ ...x, retencion_honorarios: ev.target.value.replace(/[^\d,.]/g, "") }))} />
            <small>2026: 15,25% (sube cada año hasta 17% en 2028). Verifícalo en el SII.</small>
          </label>
          <label className="adm-campo adm-ficha__campo">
            <span>Validez de las cotizaciones (días)</span>
            <input type="number" min={1} max={365} value={otros.validez_cotizacion} onChange={(ev) => setOtros((x) => ({ ...x, validez_cotizacion: ev.target.value }))} />
          </label>
          <label className="adm-campo adm-ficha__campo adm-ficha__campo--3">
            <span>Condiciones por defecto de las cotizaciones</span>
            <textarea className="adm-ficha__notas" rows={3} value={otros.condiciones} onChange={(ev) => setOtros((x) => ({ ...x, condiciones: ev.target.value }))} maxLength={5000} />
          </label>
        </div>
      </fieldset>

      {aviso && <p className="adm-aviso">{aviso}</p>}
      {error && <p className="adm-error">{error}</p>}
      <footer className="adm-ventana__pie">
        <span />
        <button className="adm-boton" disabled={guardando}>
          {guardando ? "Guardando…" : "Guardar datos"}
        </button>
      </footer>
    </form>
  );
}

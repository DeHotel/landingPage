import { useCallback, useEffect, useState } from "react";
import { api } from "../api";
import { mesActual, moverMes, nombreMes } from "./dinero";
import Resumen from "./Resumen";
import Movimientos from "./Movimientos";
import Recurrentes from "./Recurrentes";
import Configuracion from "./Configuracion";
import Proyeccion from "./Proyeccion";
import MovimientoFicha from "./MovimientoFicha";

const PESTANAS = [
  ["resumen", "Resumen"],
  ["movimientos", "Movimientos"],
  ["proyeccion", "Proyección"],
  ["recurrentes", "Recurrentes"],
  ["config", "Cuentas y categorías"],
];

export default function Finanzas() {
  const [pestana, setPestana] = useState("resumen");
  const [mes, setMes] = useState(mesActual());
  const [cuenta, setCuenta] = useState("");
  const [catalogos, setCatalogos] = useState(null);
  const [version, setVersion] = useState(0); // sube para recargar las vistas
  const [ficha, setFicha] = useState(null); // movimiento a crear/editar
  const [error, setError] = useState("");

  const cargarCatalogos = useCallback(
    () =>
      api
        .finanzasConfig()
        .then(setCatalogos)
        .catch((e) => setError(e.message)),
    []
  );

  useEffect(() => {
    cargarCatalogos();
  }, [cargarCatalogos]);

  const refrescar = () => {
    setVersion((v) => v + 1);
    cargarCatalogos();
  };

  if (error && !catalogos) return <p className="adm-error">{error}</p>;
  if (!catalogos) {
    return (
      <div className="adm-centro adm-centro--bajo">
        <span className="adm-spinner" aria-label="Cargando" />
      </div>
    );
  }

  const conMes = pestana === "resumen" || pestana === "movimientos";
  const conCuenta = conMes || pestana === "proyeccion";

  return (
    <div className="adm-seccion">
      <div className="adm-fin__barra">
        <div className="adm-chips" role="tablist" aria-label="Secciones de finanzas">
          {PESTANAS.map(([id, texto]) => (
            <button key={id} role="tab" aria-selected={pestana === id} className={pestana === id ? "activo" : ""} onClick={() => setPestana(id)}>
              {texto}
            </button>
          ))}
        </div>
        {conCuenta && (
          <div className="adm-fin__selectores">
            {conMes && (
            <div className="adm-fin__mes">
              <button onClick={() => setMes((m) => moverMes(m, -1))} aria-label="Mes anterior">
                ‹
              </button>
              <strong>{nombreMes(mes)}</strong>
              <button onClick={() => setMes((m) => moverMes(m, 1))} aria-label="Mes siguiente">
                ›
              </button>
              {mes !== mesActual() && (
                <button className="adm-fin__hoy" onClick={() => setMes(mesActual())}>
                  Hoy
                </button>
              )}
            </div>
            )}
            <select className="adm-select adm-fin__filtro" value={cuenta} onChange={(e) => setCuenta(e.target.value)} aria-label="Cuenta">
              <option value="">Todas las cuentas</option>
              {catalogos.cuentas.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                  {!c.activa ? " (desactivada)" : ""}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {pestana === "resumen" && <Resumen mes={mes} cuenta={cuenta} version={version} onAbrir={setFicha} onCambio={refrescar} />}
      {pestana === "movimientos" && (
        <Movimientos
          mes={mes}
          cuenta={cuenta}
          version={version}
          catalogos={catalogos}
          onAbrir={setFicha}
          onNuevo={(tipo) => setFicha({ tipo, cuenta_id: cuenta ? Number(cuenta) : undefined })}
          onCambio={refrescar}
        />
      )}
      {pestana === "proyeccion" && <Proyeccion cuenta={cuenta} version={version} catalogos={catalogos} />}
      {pestana === "recurrentes" && <Recurrentes catalogos={catalogos} onCambio={refrescar} />}
      {pestana === "config" && <Configuracion catalogos={catalogos} onCambio={refrescar} />}

      {ficha && (
        <MovimientoFicha
          inicial={ficha}
          catalogos={catalogos}
          onGuardado={() => {
            setFicha(null);
            refrescar();
          }}
          onEliminado={() => {
            setFicha(null);
            refrescar();
          }}
          onCerrar={() => setFicha(null)}
        />
      )}
    </div>
  );
}

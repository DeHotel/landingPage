import { useEffect, useState } from "react";
import { api, onSesionExpirada } from "./api";
import { CLAVE_NO_CONTAR } from "../visitas";
import Acceso from "./Acceso";
import Panel from "./Panel";

// Desde el navegador del administrador no se cuentan visitas a la landing.
function noContarEsteNavegador() {
  try {
    localStorage.setItem(CLAVE_NO_CONTAR, "1");
  } catch {
    // sin almacenamiento: no pasa nada
  }
}

export default function AdminApp() {
  const [estado, setEstado] = useState({ cargando: true });

  const cargar = () =>
    api
      .estado()
      .then((r) => setEstado({ usuario: r.usuario, requiereInstalacion: r.requiereInstalacion }))
      .catch((e) => setEstado({ error: e.message }));

  useEffect(() => {
    cargar();
    onSesionExpirada(() => setEstado((s) => ({ ...s, usuario: null, aviso: "Tu sesión expiró. Vuelve a ingresar." })));
  }, []);

  useEffect(() => {
    if (estado.usuario) noContarEsteNavegador();
  }, [estado.usuario]);

  if (estado.cargando) {
    return (
      <div className="adm-centro">
        <span className="adm-spinner" aria-label="Cargando" />
      </div>
    );
  }

  if (estado.error) {
    return (
      <div className="adm-centro">
        <div className="adm-tarjeta adm-tarjeta--error">
          <h1>No se pudo conectar</h1>
          <p>{estado.error}</p>
          <button className="adm-boton" onClick={() => { setEstado({ cargando: true }); cargar(); }}>
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!estado.usuario) {
    return (
      <Acceso
        modo={estado.requiereInstalacion ? "instalar" : "login"}
        aviso={estado.aviso}
        onIngreso={(usuario) => setEstado({ usuario })}
      />
    );
  }

  return (
    <Panel
      usuario={estado.usuario}
      onSalir={async () => {
        await api.logout().catch(() => {});
        setEstado({ usuario: null });
      }}
    />
  );
}

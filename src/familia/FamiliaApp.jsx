import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api, onAccesoVencido, urlVideo } from "./api";
import { duracion } from "../admin/formato";

const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const fechaBonita = (texto) => {
  const [a, m, d] = texto.slice(0, 10).split("-").map(Number);
  return `${d} de ${MESES[m - 1]} de ${a}`;
};

export default function FamiliaApp() {
  const [estado, setEstado] = useState({ cargando: true });

  const revisar = useCallback(
    () =>
      api
        .estado()
        .then((r) => setEstado({ activo: r.activo, dentro: r.autenticado }))
        .catch((e) => setEstado({ error: e.message })),
    []
  );

  useEffect(() => {
    revisar();
    onAccesoVencido(() => setEstado({ activo: true, dentro: false, aviso: "Vuelve a escribir la clave para seguir viendo los videos." }));
  }, [revisar]);

  if (estado.cargando) {
    return (
      <div className="fam-centro">
        <span className="fam-spinner" aria-label="Cargando" />
      </div>
    );
  }
  if (estado.error) {
    return (
      <Tarjeta titulo="No se pudo cargar">
        <p className="fam-suave">{estado.error}</p>
        <button className="fam-boton" onClick={() => { setEstado({ cargando: true }); revisar(); }}>
          Reintentar
        </button>
      </Tarjeta>
    );
  }
  if (!estado.activo) {
    return (
      <Tarjeta titulo="Videos de la familia">
        <p className="fam-suave">Esta página no está disponible por ahora. Vuelve a intentarlo más tarde.</p>
      </Tarjeta>
    );
  }
  if (!estado.dentro) {
    return <Entrar aviso={estado.aviso} onEntrar={() => setEstado({ activo: true, dentro: true })} />;
  }
  return (
    <Galeria
      onSalir={async () => {
        await api.salir().catch(() => {});
        setEstado({ activo: true, dentro: false });
      }}
    />
  );
}

function Tarjeta({ titulo, children }) {
  return (
    <div className="fam-acceso">
      <div className="fam-tarjeta">
        <div className="fam-icono" aria-hidden="true">
          <IconoPlay />
        </div>
        <h1>{titulo}</h1>
        {children}
      </div>
    </div>
  );
}

function Entrar({ aviso, onEntrar }) {
  const [clave, setClave] = useState("");
  const [ver, setVer] = useState(false);
  const [recordar, setRecordar] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  const enviar = async (e) => {
    e.preventDefault();
    setEnviando(true);
    setError("");
    try {
      await api.entrar(clave, recordar);
      onEntrar();
    } catch (err) {
      setError(err.message);
      setEnviando(false);
    }
  };

  return (
    <Tarjeta titulo="Videos de la familia">
      <p className="fam-suave">Escribe la clave que te compartieron para ver los videos.</p>
      {aviso && !error && <p className="fam-aviso">{aviso}</p>}
      <form className="fam-form" onSubmit={enviar}>
        <label className="fam-campo">
          <span>Clave</span>
          <div className="fam-campo__clave">
            <input
              type={ver ? "text" : "password"}
              value={clave}
              onChange={(e) => setClave(e.target.value)}
              autoComplete="current-password"
              autoFocus
              required
            />
            <button type="button" onClick={() => setVer((v) => !v)} aria-label={ver ? "Ocultar clave" : "Mostrar clave"}>
              {ver ? "Ocultar" : "Ver"}
            </button>
          </div>
        </label>
        <label className="fam-check">
          <input type="checkbox" checked={recordar} onChange={(e) => setRecordar(e.target.checked)} />
          Recordar este dispositivo por 30 días
        </label>
        {error && (
          <p className="fam-error" role="alert">
            {error}
          </p>
        )}
        <button className="fam-boton fam-boton--grande" disabled={enviando || !clave}>
          {enviando ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </Tarjeta>
  );
}

function Galeria({ onSalir }) {
  const [datos, setDatos] = useState(null); // {videos, grupos}
  const [error, setError] = useState("");
  const [buscar, setBuscar] = useState("");
  const [grupoSel, setGrupoSel] = useState("todos"); // "todos" | "otros" | id
  const [abierto, setAbierto] = useState(null);

  useEffect(() => {
    api
      .videos()
      .then((r) => setDatos({ videos: r.videos, grupos: r.grupos ?? [] }))
      .catch((e) => setError(e.message));
  }, []);

  const hayGrupos = (datos?.grupos.length ?? 0) > 0;
  const sinGrupo = useMemo(() => (datos?.videos ?? []).filter((v) => v.grupo_id == null), [datos]);

  // Secciones a mostrar: con "Todos", una por grupo (+ "Otros videos"); si no, solo la elegida.
  const secciones = useMemo(() => {
    if (!datos) return [];
    const q = buscar.trim().toLowerCase();
    const filtrar = (lista) => lista.filter((v) => !q || v.nombre.toLowerCase().includes(q));
    if (!hayGrupos) return [{ clave: "todos", titulo: null, videos: filtrar(datos.videos) }];

    const porGrupo = datos.grupos.map((g) => ({
      clave: g.id,
      titulo: g.nombre,
      videos: filtrar(datos.videos.filter((v) => v.grupo_id === g.id)),
    }));
    const otros = { clave: "otros", titulo: "Otros videos", videos: filtrar(sinGrupo) };
    const todas = [...porGrupo, otros].filter((s) => s.videos.length > 0);
    if (grupoSel === "todos") return todas;
    return todas.filter((s) => s.clave === grupoSel).map((s) => ({ ...s, titulo: null }));
  }, [datos, buscar, grupoSel, hayGrupos, sinGrupo]);

  // Anterior/siguiente recorre los videos en el mismo orden en que se ven.
  const enOrden = useMemo(() => secciones.flatMap((s) => s.videos), [secciones]);
  const indice = abierto === null ? -1 : enOrden.findIndex((v) => v.id === abierto);
  const total = datos?.videos.length ?? 0;

  return (
    <div className="fam-pagina">
      <header className="fam-cabecera">
        <div className="fam-cabecera__titulo">
          <span className="fam-icono fam-icono--chico" aria-hidden="true">
            <IconoPlay />
          </span>
          <h1>Videos de la familia</h1>
        </div>
        <button className="fam-boton fam-boton--suave" onClick={onSalir}>
          Salir
        </button>
      </header>

      <main className="fam-contenido">
        {error && <p className="fam-error">{error}</p>}
        {!datos && !error && (
          <div className="fam-centro fam-centro--bajo">
            <span className="fam-spinner" aria-label="Cargando" />
          </div>
        )}
        {datos && total === 0 && <p className="fam-vacio">Todavía no hay videos. ¡Pronto habrá novedades!</p>}

        {datos && hayGrupos && total > 0 && (
          <nav className="fam-grupos" aria-label="Grupos de videos">
            <button className={grupoSel === "todos" ? "activo" : ""} onClick={() => setGrupoSel("todos")}>
              Todos
            </button>
            {datos.grupos.map((g) => (
              <button key={g.id} className={grupoSel === g.id ? "activo" : ""} onClick={() => setGrupoSel(g.id)}>
                {g.nombre} <em>{g.cantidad}</em>
              </button>
            ))}
            {sinGrupo.length > 0 && (
              <button className={grupoSel === "otros" ? "activo" : ""} onClick={() => setGrupoSel("otros")}>
                Otros videos <em>{sinGrupo.length}</em>
              </button>
            )}
          </nav>
        )}

        {datos && total > 6 && (
          <input className="fam-buscar" type="search" placeholder="Buscar un video…" value={buscar} onChange={(e) => setBuscar(e.target.value)} />
        )}
        {datos && total > 0 && enOrden.length === 0 && <p className="fam-vacio">Ningún video se llama así.</p>}

        {secciones.map((s) => (
          <section key={s.clave} className="fam-seccion">
            {s.titulo && (
              <h2 className="fam-seccion__titulo">
                {s.titulo} <span>{s.videos.length}</span>
              </h2>
            )}
            <div className="fam-grilla">
              {s.videos.map((v) => (
                <button key={v.id} className="fam-video" onClick={() => setAbierto(v.id)}>
                  <span className="fam-video__portada">
                    {v.portada ? <img src={urlVideo(v.id, "&portada=1")} alt="" loading="lazy" /> : null}
                    <span className="fam-video__play" aria-hidden="true">
                      <IconoPlay />
                    </span>
                    {v.duracion != null && <span className="fam-video__duracion">{duracion(v.duracion)}</span>}
                  </span>
                  <span className="fam-video__nombre">{v.nombre}</span>
                  <span className="fam-video__fecha">{fechaBonita(v.creado_en)}</span>
                </button>
              ))}
            </div>
          </section>
        ))}
      </main>

      {indice >= 0 && (
        <Reproductor
          video={enOrden[indice]}
          anterior={indice > 0 ? () => setAbierto(enOrden[indice - 1].id) : null}
          siguiente={indice < enOrden.length - 1 ? () => setAbierto(enOrden[indice + 1].id) : null}
          onCerrar={() => setAbierto(null)}
        />
      )}
    </div>
  );
}

function Reproductor({ video, anterior, siguiente, onCerrar }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current.open) ref.current.showModal();
  }, []);

  return (
    <dialog
      ref={ref}
      className="fam-reproductor"
      aria-label={video.nombre}
      onCancel={(e) => {
        e.preventDefault();
        onCerrar();
      }}
      onClick={(e) => e.target === ref.current && onCerrar()}
    >
      <div className="fam-reproductor__caja">
        <video
          key={video.id}
          src={urlVideo(video.id)}
          poster={video.portada ? urlVideo(video.id, "&portada=1") : undefined}
          controls
          autoPlay
          playsInline
          preload="metadata"
        />
        <div className="fam-reproductor__pie">
          <div>
            <h2>{video.nombre}</h2>
            <span className="fam-suave">{fechaBonita(video.creado_en)}</span>
          </div>
          <div className="fam-reproductor__botones">
            <button className="fam-boton fam-boton--suave" onClick={anterior} disabled={!anterior} aria-label="Video anterior">
              ←
            </button>
            <button className="fam-boton fam-boton--suave" onClick={siguiente} disabled={!siguiente} aria-label="Video siguiente">
              →
            </button>
            <button className="fam-boton" onClick={onCerrar}>
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </dialog>
  );
}

function IconoPlay() {
  return (
    <svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden="true">
      <path d="M8 5.5v13l11-6.5z" fill="currentColor" />
    </svg>
  );
}

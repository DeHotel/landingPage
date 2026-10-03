import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api, urlVideo } from "./api";
import { bytes, duracion, fechaHora } from "./formato";
import { EXTENSIONES, extension, nombreSugerido, subirVideo } from "./subidaVideo";
import Ventana from "./Ventana";
import AccesoFamiliar from "./AccesoFamiliar";


export default function Videos() {
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState("");
  const [buscar, setBuscar] = useState("");
  const [grupoSel, setGrupoSel] = useState("todos"); // "todos" | "sin" | id de grupo
  const [subiendo, setSubiendo] = useState(false);
  const [viendo, setViendo] = useState(null);
  const [familia, setFamilia] = useState(false);
  const [gestionar, setGestionar] = useState(false);

  const cargar = useCallback(() => {
    setError("");
    api
      .videos()
      .then(setDatos)
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  // Si el grupo elegido se eliminó, volver a "Todos".
  useEffect(() => {
    if (datos && typeof grupoSel === "number" && !datos.grupos.some((g) => g.id === grupoSel)) setGrupoSel("todos");
  }, [datos, grupoSel]);

  const conteo = useMemo(() => {
    const c = { todos: 0, sin: 0 };
    for (const v of datos?.videos ?? []) {
      c.todos++;
      const k = v.grupo_id ?? "sin";
      c[k] = (c[k] ?? 0) + 1;
    }
    return c;
  }, [datos]);

  const lista = useMemo(() => {
    const q = buscar.trim().toLowerCase();
    return (datos?.videos ?? []).filter(
      (v) =>
        (grupoSel === "todos" || (grupoSel === "sin" ? v.grupo_id == null : v.grupo_id === grupoSel)) &&
        (!q || v.nombre.toLowerCase().includes(q))
    );
  }, [datos, buscar, grupoSel]);

  const actualizar = (video) =>
    setDatos((d) => ({ ...d, videos: d.videos.map((v) => (v.id === video.id ? video : v)) }));

  const quitar = (id) =>
    setDatos((d) => {
      const v = d.videos.find((x) => x.id === id);
      return { ...d, videos: d.videos.filter((x) => x.id !== id), espacio: { ...d.espacio, usado: d.espacio.usado - (v?.tamano ?? 0) } };
    });

  const agregar = (video) =>
    setDatos((d) => ({ ...d, videos: [video, ...d.videos], espacio: { ...d.espacio, usado: d.espacio.usado + video.tamano } }));

  const nombreGrupo = (id) => datos?.grupos.find((g) => g.id === id)?.nombre;

  return (
    <div className="adm-seccion">
      <div className="adm-filtros">
        <input className="adm-buscar" type="search" placeholder="Buscar por nombre…" value={buscar} onChange={(e) => setBuscar(e.target.value)} />
        {datos && (
          <span className="adm-texto-suave adm-videos__espacio">
            {datos.videos.length} {datos.videos.length === 1 ? "video" : "videos"} · {bytes(datos.espacio.usado)} usados
            {datos.espacio.libre != null && ` · ${bytes(datos.espacio.libre)} libres en el hosting`}
          </span>
        )}
        <div className="adm-videos__acciones">
          <button className="adm-boton adm-boton--suave" onClick={() => setFamilia(true)}>
            <IconoFamilia /> Acceso familiar
          </button>
          <button className="adm-boton" onClick={() => setSubiendo(true)} disabled={!datos}>
            <IconoSubir /> Subir videos
          </button>
        </div>
      </div>

      {datos && (
        <div className="adm-grupos" role="group" aria-label="Grupos">
          <Chip activo={grupoSel === "todos"} onClick={() => setGrupoSel("todos")} texto="Todos" n={conteo.todos} />
          {datos.grupos.map((g) => (
            <Chip key={g.id} activo={grupoSel === g.id} onClick={() => setGrupoSel(g.id)} texto={g.nombre} n={conteo[g.id] ?? 0} carpeta />
          ))}
          {conteo.sin > 0 && datos.grupos.length > 0 && (
            <Chip activo={grupoSel === "sin"} onClick={() => setGrupoSel("sin")} texto="Sin grupo" n={conteo.sin} />
          )}
          <NuevoGrupo
            onCreado={(r) => {
              setDatos((d) => ({ ...d, grupos: r.grupos }));
              setGrupoSel(r.grupo.id);
            }}
          />
          {datos.grupos.length > 0 && (
            <button className="adm-grupos__gestionar" onClick={() => setGestionar(true)}>
              Gestionar grupos
            </button>
          )}
        </div>
      )}

      {error && <p className="adm-error">{error}</p>}

      {!datos && !error ? (
        <div className="adm-centro adm-centro--bajo">
          <span className="adm-spinner" aria-label="Cargando" />
        </div>
      ) : datos && datos.videos.length === 0 ? (
        <button className="adm-videos__vacio" onClick={() => setSubiendo(true)}>
          <IconoSubir grande />
          <strong>Aún no hay videos</strong>
          <span>Sube el primero: haz clic aquí o usa «Subir videos».</span>
        </button>
      ) : datos ? (
        <>
          {lista.length === 0 && (
            <p className="adm-vacio">
              {buscar.trim() ? `Ningún video coincide con «${buscar}».` : "Este grupo todavía no tiene videos. Muévelos aquí desde el selector de cada video."}
            </p>
          )}
          <div className="adm-videos__grilla">
            {lista.map((v) => (
              <TarjetaVideo
                key={v.id}
                video={v}
                grupos={datos.grupos}
                mostrarGrupo={grupoSel === "todos" ? nombreGrupo(v.grupo_id) : null}
                onAbrir={() => setViendo(v)}
                onActualizado={actualizar}
                onError={setError}
              />
            ))}
          </div>
        </>
      ) : null}

      {subiendo && datos && (
        <SubirVideos
          limites={datos.limites}
          grupos={datos.grupos}
          grupoInicial={typeof grupoSel === "number" ? grupoSel : null}
          onSubido={agregar}
          onCerrar={() => {
            setSubiendo(false);
            cargar();
          }}
        />
      )}
      {familia && <AccesoFamiliar onCerrar={() => setFamilia(false)} />}
      {gestionar && datos && (
        <GestionarGrupos
          grupos={datos.grupos}
          conteo={conteo}
          onCambio={cargar}
          onCerrar={() => setGestionar(false)}
        />
      )}
      {viendo && (
        <VerVideo
          video={viendo}
          grupos={datos.grupos}
          onActualizado={(v) => {
            actualizar(v);
            setViendo(v);
          }}
          onEliminado={(id) => {
            quitar(id);
            setViendo(null);
          }}
          onCerrar={() => setViendo(null)}
        />
      )}
    </div>
  );
}

function Chip({ activo, onClick, texto, n, carpeta }) {
  return (
    <button className={`adm-grupos__chip ${activo ? "adm-grupos__chip--activo" : ""}`} onClick={onClick} aria-pressed={activo}>
      {carpeta && <IconoCarpeta />}
      <span>{texto}</span>
      <em>{n}</em>
    </button>
  );
}

// "+ Nuevo grupo": se transforma en un campo para escribir el nombre.
function NuevoGrupo({ onCreado }) {
  const [abierto, setAbierto] = useState(false);
  const [nombre, setNombre] = useState("");
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  const crear = async (e) => {
    e.preventDefault();
    if (!nombre.trim()) return;
    setGuardando(true);
    setError("");
    try {
      onCreado(await api.crearGrupo(nombre.trim()));
      setNombre("");
      setAbierto(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  };

  if (!abierto) {
    return (
      <button className="adm-grupos__nuevo" onClick={() => setAbierto(true)}>
        + Nuevo grupo
      </button>
    );
  }
  return (
    <form className="adm-grupos__form" onSubmit={crear}>
      <input
        autoFocus
        value={nombre}
        maxLength={80}
        placeholder="Nombre del grupo"
        onChange={(e) => setNombre(e.target.value)}
        onKeyDown={(e) => e.key === "Escape" && setAbierto(false)}
      />
      <button className="adm-boton" disabled={guardando || !nombre.trim()}>
        Crear
      </button>
      <button type="button" className="adm-boton adm-boton--suave" onClick={() => setAbierto(false)}>
        Cancelar
      </button>
      {error && <span className="adm-grupos__error">{error}</span>}
    </form>
  );
}

function SelectorGrupo({ valor, grupos, onCambiar, deshabilitado, etiqueta = "Grupo" }) {
  return (
    <select
      className="adm-select"
      value={valor ?? ""}
      disabled={deshabilitado}
      aria-label={etiqueta}
      onChange={(e) => onCambiar(e.target.value === "" ? null : Number(e.target.value))}
    >
      <option value="">Sin grupo</option>
      {grupos.map((g) => (
        <option key={g.id} value={g.id}>
          {g.nombre}
        </option>
      ))}
    </select>
  );
}

function TarjetaVideo({ video: v, grupos, mostrarGrupo, onAbrir, onActualizado, onError }) {
  const [editando, setEditando] = useState(false);
  const [nombre, setNombre] = useState(v.nombre);
  const [ocupado, setOcupado] = useState(false);
  const cerrandoEdicion = useRef(false); // evita guardar dos veces (Enter + blur)

  const empezarEdicion = () => {
    cerrandoEdicion.current = false;
    setNombre(v.nombre);
    setEditando(true);
  };

  const guardarNombre = async () => {
    if (cerrandoEdicion.current) return;
    cerrandoEdicion.current = true;
    const nuevo = nombre.trim();
    setEditando(false);
    if (!nuevo || nuevo === v.nombre) return setNombre(v.nombre);
    setOcupado(true);
    try {
      onActualizado((await api.renombrarVideo(v.id, nuevo)).video);
    } catch (e) {
      setNombre(v.nombre);
      onError(e.message);
    } finally {
      setOcupado(false);
    }
  };

  const mover = async (grupoId) => {
    setOcupado(true);
    try {
      onActualizado((await api.moverVideo(v.id, grupoId)).video);
    } catch (e) {
      onError(e.message);
    } finally {
      setOcupado(false);
    }
  };

  return (
    <article className={`adm-video ${ocupado ? "adm-video--ocupado" : ""}`}>
      <button className="adm-video__abrir" onClick={onAbrir} aria-label={`Ver «${v.nombre}»`}>
        <span className="adm-video__portada">
          {v.portada ? <img src={urlVideo(v.id, "&portada=1")} alt="" loading="lazy" /> : <span className="adm-video__sin">{v.extension.toUpperCase()}</span>}
          <span className="adm-video__play" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="22" height="22">
              <path d="M8 5.5v13l11-6.5z" fill="currentColor" />
            </svg>
          </span>
          {v.duracion != null && <span className="adm-video__duracion">{duracion(v.duracion)}</span>}
          {!v.visible_familia && (
            <span className="adm-video__privado" title="La familia no ve este video">
              Solo tú
            </span>
          )}
        </span>
      </button>

      <div className="adm-video__cuerpo">
        {editando ? (
          <input
            className="adm-video__editar"
            autoFocus
            value={nombre}
            maxLength={150}
            aria-label="Nuevo nombre del video"
            onChange={(e) => setNombre(e.target.value)}
            onBlur={guardarNombre}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                guardarNombre();
              }
              if (e.key === "Escape") {
                cerrandoEdicion.current = true;
                setNombre(v.nombre);
                setEditando(false);
              }
            }}
          />
        ) : (
          <div className="adm-video__titulo">
            <span className="adm-video__nombre" title={v.nombre}>
              {v.nombre}
            </span>
            <button className="adm-video__lapiz" onClick={empezarEdicion} title="Cambiar nombre" aria-label={`Cambiar el nombre de «${v.nombre}»`}>
              ✎
            </button>
          </div>
        )}
        <span className="adm-video__meta">
          {fechaHora(v.creado_en).slice(0, 10)} · {bytes(v.tamano)}
          {mostrarGrupo && <> · {mostrarGrupo}</>}
        </span>
        {grupos.length > 0 && (
          <label className="adm-video__grupo">
            <IconoCarpeta />
            <SelectorGrupo valor={v.grupo_id} grupos={grupos} onCambiar={mover} deshabilitado={ocupado} etiqueta={`Grupo de «${v.nombre}»`} />
          </label>
        )}
      </div>
    </article>
  );
}

function GestionarGrupos({ grupos, conteo, onCambio, onCerrar }) {
  const [nombres, setNombres] = useState(() => Object.fromEntries(grupos.map((g) => [g.id, g.nombre])));
  const [confirmar, setConfirmar] = useState(null);
  const [mensaje, setMensaje] = useState({ tipo: "", texto: "" });
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    setNombres((n) => Object.fromEntries(grupos.map((g) => [g.id, n[g.id] ?? g.nombre])));
  }, [grupos]);

  const hacer = async (fn, ok) => {
    setOcupado(true);
    setMensaje({ tipo: "", texto: "" });
    try {
      await fn();
      setMensaje({ tipo: "ok", texto: ok });
      onCambio();
    } catch (e) {
      setMensaje({ tipo: "error", texto: e.message });
    } finally {
      setOcupado(false);
      setConfirmar(null);
    }
  };

  return (
    <Ventana titulo="Gestionar grupos" ancho="560px" onCerrar={onCerrar}>
      <p className="adm-texto-suave adm-familia__intro">
        Cambia el nombre de tus grupos o elimínalos. Al eliminar un grupo sus videos <b>no se borran</b>: quedan «Sin grupo».
      </p>
      {mensaje.texto && <p className={mensaje.tipo === "error" ? "adm-error" : "adm-aviso"}>{mensaje.texto}</p>}
      {grupos.length === 0 ? (
        <p className="adm-vacio">No hay grupos.</p>
      ) : (
        <ul className="adm-lista-grupos">
          {grupos.map((g) => {
            const n = conteo[g.id] ?? 0;
            const cambio = (nombres[g.id] ?? "").trim() && nombres[g.id].trim() !== g.nombre;
            return (
              <li key={g.id}>
                {confirmar === g.id ? (
                  <div className="adm-confirmar">
                    <span>
                      ¿Eliminar «{g.nombre}»? {n > 0 ? `Sus ${n} ${n === 1 ? "video quedará" : "videos quedarán"} sin grupo.` : ""}
                    </span>
                    <button className="adm-boton adm-boton--peligro" disabled={ocupado} onClick={() => hacer(() => api.eliminarGrupo(g.id), `Grupo «${g.nombre}» eliminado.`)}>
                      Sí, eliminar
                    </button>
                    <button className="adm-boton adm-boton--suave" onClick={() => setConfirmar(null)}>
                      No
                    </button>
                  </div>
                ) : (
                  <form
                    className="adm-lista-grupos__fila"
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (cambio) hacer(() => api.renombrarGrupo(g.id, nombres[g.id].trim()), "Nombre del grupo actualizado.");
                    }}
                  >
                    <IconoCarpeta />
                    <input
                      value={nombres[g.id] ?? ""}
                      maxLength={80}
                      aria-label={`Nombre del grupo ${g.nombre}`}
                      onChange={(e) => setNombres((x) => ({ ...x, [g.id]: e.target.value }))}
                    />
                    <span className="adm-texto-suave adm-lista-grupos__n">
                      {n} {n === 1 ? "video" : "videos"}
                    </span>
                    <button className="adm-boton adm-boton--suave" disabled={!cambio || ocupado}>
                      Guardar
                    </button>
                    <button type="button" className="adm-boton adm-boton--suave adm-boton--texto-peligro" onClick={() => setConfirmar(g.id)}>
                      Eliminar
                    </button>
                  </form>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Ventana>
  );
}

function SubirVideos({ limites, grupos, grupoInicial, onSubido, onCerrar }) {
  const [cola, setCola] = useState([]); // {clave, archivo, nombre, estado, progreso, mensaje}
  const [grupoId, setGrupoId] = useState(grupoInicial);
  const [trabajando, setTrabajando] = useState(false);
  const [arrastrando, setArrastrando] = useState(false);
  const control = useRef(null);
  const input = useRef(null);

  // Aviso si se intenta cerrar la pestaña con una subida en curso.
  useEffect(() => {
    if (!trabajando) return;
    const aviso = (e) => e.preventDefault();
    window.addEventListener("beforeunload", aviso);
    return () => window.removeEventListener("beforeunload", aviso);
  }, [trabajando]);

  const cambiar = (clave, cambios) => setCola((c) => c.map((x) => (x.clave === clave ? { ...x, ...cambios } : x)));

  const agregarArchivos = (archivos) => {
    const nuevos = [...archivos].map((archivo) => {
      let mensaje = "";
      if (!EXTENSIONES.includes(extension(archivo))) mensaje = "Formato no permitido (usa MP4, WebM o MOV).";
      else if (archivo.size > limites.maximo) mensaje = `Supera el máximo de ${bytes(limites.maximo)}.`;
      return {
        clave: `${archivo.name}-${archivo.size}-${Math.random()}`,
        archivo,
        nombre: nombreSugerido(archivo),
        visible: true,
        estado: mensaje ? "invalido" : "pendiente",
        progreso: 0,
        mensaje,
      };
    });
    setCola((c) => [...c, ...nuevos]);
  };

  const pendientes = cola.filter((x) => x.estado === "pendiente" || x.estado === "error");

  const empezar = async () => {
    setTrabajando(true);
    for (const item of pendientes) {
      if (!item.nombre.trim()) {
        cambiar(item.clave, { estado: "error", mensaje: "Ponle un nombre." });
        continue;
      }
      const ctrl = new AbortController();
      control.current = ctrl;
      cambiar(item.clave, { estado: "subiendo", progreso: 0, mensaje: "Preparando…" });
      try {
        const video = await subirVideo(item.archivo, item.nombre.trim(), {
          signal: ctrl.signal,
          visibleFamilia: item.visible,
          grupoId,
          onEtapa: (mensaje) => cambiar(item.clave, { mensaje }),
          onProgreso: (progreso) => cambiar(item.clave, { progreso }),
        });
        cambiar(item.clave, { estado: "listo", progreso: 1, mensaje: "Listo" });
        onSubido(video);
      } catch (e) {
        if (e.name === "AbortError") {
          cambiar(item.clave, { estado: "pendiente", progreso: 0, mensaje: "Cancelado" });
          break;
        }
        cambiar(item.clave, { estado: "error", mensaje: e.message });
      }
    }
    control.current = null;
    setTrabajando(false);
  };

  const puedeCerrar = () => !trabajando || window.confirm("Hay una subida en curso. ¿Cancelarla y cerrar?") && (control.current?.abort(), true);

  return (
    <Ventana titulo="Subir videos" ancho="640px" onCerrar={onCerrar} bloquear={puedeCerrar}>
      <div
        className={`adm-soltar ${arrastrando ? "adm-soltar--activo" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setArrastrando(true);
        }}
        onDragLeave={() => setArrastrando(false)}
        onDrop={(e) => {
          e.preventDefault();
          setArrastrando(false);
          agregarArchivos(e.dataTransfer.files);
        }}
        onClick={() => input.current.click()}
      >
        <IconoSubir grande />
        <strong>Arrastra tus videos aquí o haz clic para elegirlos</strong>
        <span>MP4, WebM o MOV · hasta {bytes(limites.maximo)} cada uno</span>
        <input
          ref={input}
          type="file"
          accept="video/mp4,video/webm,video/quicktime,video/ogg,.mp4,.m4v,.webm,.mov,.ogv"
          multiple
          hidden
          onChange={(e) => {
            agregarArchivos(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {grupos.length > 0 && (
        <label className="adm-subir__grupo">
          <IconoCarpeta />
          <span>Guardar en el grupo</span>
          <SelectorGrupo valor={grupoId} grupos={grupos} onCambiar={setGrupoId} deshabilitado={trabajando} etiqueta="Grupo para estos videos" />
        </label>
      )}

      {cola.length > 0 && (
        <p className="adm-texto-suave adm-subir__ayuda">Puedes cambiar el nombre de cada video antes de subirlo.</p>
      )}

      {cola.length > 0 && (
        <ul className="adm-cola">
          {cola.map((x) => (
            <li key={x.clave} className={`adm-cola__item adm-cola__item--${x.estado}`}>
              <div className="adm-cola__fila">
                <input
                  className="adm-cola__nombre"
                  value={x.nombre}
                  maxLength={150}
                  placeholder="Nombre del video"
                  aria-label={`Nombre para ${x.archivo.name}`}
                  disabled={x.estado === "subiendo" || x.estado === "listo" || x.estado === "invalido"}
                  onChange={(e) => cambiar(x.clave, { nombre: e.target.value })}
                />
                {x.estado !== "subiendo" && x.estado !== "listo" && (
                  <button className="adm-cola__quitar" onClick={() => setCola((c) => c.filter((y) => y.clave !== x.clave))} aria-label="Quitar">
                    ×
                  </button>
                )}
              </div>
              <div className="adm-cola__info">
                <span className="adm-texto-suave">
                  {x.archivo.name} · {bytes(x.archivo.size)}
                </span>
                {x.estado !== "invalido" && (
                  <label className="adm-check">
                    <input
                      type="checkbox"
                      checked={x.visible}
                      disabled={x.estado === "subiendo" || x.estado === "listo"}
                      onChange={(e) => cambiar(x.clave, { visible: e.target.checked })}
                    />
                    Visible para la familia
                  </label>
                )}
                <span className={`adm-cola__estado adm-cola__estado--${x.estado}`}>
                  {x.estado === "subiendo" && x.mensaje === "Subiendo…" ? `${Math.floor(x.progreso * 100)}%` : x.mensaje}
                </span>
              </div>
              {(x.estado === "subiendo" || x.estado === "listo") && (
                <div className="adm-dist__barra">
                  <i style={{ width: `${Math.max(2, x.progreso * 100)}%` }} />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <footer className="adm-ventana__pie">
        {trabajando ? (
          <button className="adm-boton adm-boton--suave" onClick={() => control.current?.abort()}>
            Cancelar subida
          </button>
        ) : (
          <button className="adm-boton adm-boton--suave" onClick={onCerrar}>
            {cola.some((x) => x.estado === "listo") ? "Cerrar" : "Cancelar"}
          </button>
        )}
        <button className="adm-boton" onClick={empezar} disabled={trabajando || pendientes.length === 0}>
          {trabajando ? "Subiendo…" : pendientes.length > 1 ? `Subir ${pendientes.length} videos` : "Subir video"}
        </button>
      </footer>
    </Ventana>
  );
}

function VerVideo({ video, grupos, onActualizado, onEliminado, onCerrar }) {
  const [nombre, setNombre] = useState(video.nombre);
  const [guardando, setGuardando] = useState(false);
  const [confirmar, setConfirmar] = useState(false);
  const [error, setError] = useState("");
  const cambio = nombre.trim() !== video.nombre;

  const guardar = async (e) => {
    e.preventDefault();
    if (!cambio || !nombre.trim()) return;
    setGuardando(true);
    setError("");
    try {
      const r = await api.renombrarVideo(video.id, nombre.trim());
      onActualizado(r.video);
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  };

  const mover = async (grupoId) => {
    setError("");
    try {
      onActualizado((await api.moverVideo(video.id, grupoId)).video);
    } catch (err) {
      setError(err.message);
    }
  };

  const cambiarVisibilidad = async (visible) => {
    setError("");
    try {
      const r = await api.visibilidadVideo(video.id, visible);
      onActualizado(r.video);
    } catch (err) {
      setError(err.message);
    }
  };

  const eliminar = async () => {
    setGuardando(true);
    try {
      await api.eliminarVideo(video.id);
      onEliminado(video.id);
    } catch (err) {
      setError(err.message);
      setGuardando(false);
    }
  };

  return (
    <Ventana titulo={video.nombre} ancho="960px" onCerrar={onCerrar}>
      <div className="adm-reproductor">
        <video
          key={video.id}
          src={urlVideo(video.id)}
          poster={video.portada ? urlVideo(video.id, "&portada=1") : undefined}
          controls
          autoPlay
          playsInline
          preload="metadata"
        />
      </div>

      <form className="adm-ver__nombre" onSubmit={guardar}>
        <label className="adm-campo">
          <span>Nombre</span>
          <input value={nombre} maxLength={150} onChange={(e) => setNombre(e.target.value)} />
        </label>
        <button className="adm-boton" disabled={!cambio || !nombre.trim() || guardando}>
          Guardar nombre
        </button>
      </form>

      {grupos.length > 0 && (
        <label className="adm-subir__grupo">
          <IconoCarpeta />
          <span>Grupo</span>
          <SelectorGrupo valor={video.grupo_id} grupos={grupos} onCambiar={mover} etiqueta="Grupo del video" />
        </label>
      )}

      <label className="adm-check adm-check--grande">
        <input type="checkbox" checked={video.visible_familia} onChange={(e) => cambiarVisibilidad(e.target.checked)} />
        <span>
          <strong>Visible para la familia</strong>
          <small className="adm-texto-suave">
            {video.visible_familia ? "Aparece en dehotel.cl/familia/" : "Solo tú lo ves (no aparece en /familia/)"}
          </small>
        </span>
      </label>

      <dl className="adm-ver__datos">
        <div>
          <dt>Subido</dt>
          <dd>{fechaHora(video.creado_en)}</dd>
        </div>
        <div>
          <dt>Tamaño</dt>
          <dd>{bytes(video.tamano)}</dd>
        </div>
        {video.duracion != null && (
          <div>
            <dt>Duración</dt>
            <dd>{duracion(video.duracion)}</dd>
          </div>
        )}
        {video.ancho && (
          <div>
            <dt>Resolución</dt>
            <dd>
              {video.ancho}×{video.alto}
            </dd>
          </div>
        )}
        <div>
          <dt>Formato</dt>
          <dd>{video.extension.toUpperCase()}</dd>
        </div>
      </dl>

      {error && <p className="adm-error">{error}</p>}

      <footer className="adm-ventana__pie">
        {confirmar ? (
          <div className="adm-confirmar">
            <span>¿Eliminar este video para siempre?</span>
            <button className="adm-boton adm-boton--peligro" onClick={eliminar} disabled={guardando}>
              Sí, eliminar
            </button>
            <button className="adm-boton adm-boton--suave" onClick={() => setConfirmar(false)}>
              No
            </button>
          </div>
        ) : (
          <button className="adm-boton adm-boton--suave adm-boton--texto-peligro" onClick={() => setConfirmar(true)}>
            Eliminar
          </button>
        )}
        <a className="adm-boton adm-boton--suave" href={urlVideo(video.id, "&descargar=1")}>
          Descargar
        </a>
      </footer>
    </Ventana>
  );
}

function IconoCarpeta() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 6.5A1.5 1.5 0 0 1 4.5 5h4.6l2 2.2h8.4A1.5 1.5 0 0 1 21 8.7v9.8a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18.5z" />
    </svg>
  );
}

function IconoFamilia() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 11.5 12 4l9 7.5M5.5 9.5V20h13V9.5" />
      <path d="M10 20v-5h4v5" />
    </svg>
  );
}

function IconoSubir({ grande }) {
  const t = grande ? 34 : 18;
  return (
    <svg width={t} height={t} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 16V4M7 9l5-5 5 5" />
      <path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
    </svg>
  );
}

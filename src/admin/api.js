// Cliente de la API del panel (/api/admin/*.php). La sesión viaja en una cookie
// HttpOnly que solo se envía a /api/admin/, así que aquí no se maneja ningún token.

let alExpirar = () => {};
export const onSesionExpirada = (fn) => {
  alExpirar = fn;
};

async function llamar(ruta, opciones = {}) {
  const res = await fetch(`/api/admin/${ruta}`, {
    credentials: "same-origin",
    cache: "no-store",
    ...opciones,
  });
  const json = await res.json().catch(() => ({}));
  if (res.status === 401 && ruta !== "login.php") alExpirar();
  if (!res.ok) {
    const error = new Error(json.error || `Error ${res.status}`);
    error.status = res.status;
    error.datos = json;
    throw error;
  }
  return json;
}

const binario = (ruta, cuerpo, tipo, signal) =>
  llamar(ruta, { method: "POST", headers: { "Content-Type": tipo }, body: cuerpo, signal });

const post = (ruta, datos) =>
  llamar(ruta, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datos ?? {}),
  });

export const api = {
  estado: () => llamar("estado.php"),
  login: (email, clave) => post("login.php", { email, clave }),
  instalar: (datos) => post("instalar.php", datos),
  logout: () => post("logout.php"),
  visitas: (params) => llamar(`visitas.php?${new URLSearchParams(params)}`),

  videos: () => llamar("videos.php"),
  renombrarVideo: (id, nombre) => post("videos.php", { accion: "renombrar", id, nombre }),
  eliminarVideo: (id) => post("videos.php", { accion: "eliminar", id }),
  visibilidadVideo: (id, visible) => post("videos.php", { accion: "visibilidad", id, visible }),
  moverVideo: (id, grupo_id) => post("videos.php", { accion: "mover", id, grupo_id }),
  crearGrupo: (nombre) => post("video-grupos.php", { accion: "crear", nombre }),
  renombrarGrupo: (id, nombre) => post("video-grupos.php", { accion: "renombrar", id, nombre }),
  eliminarGrupo: (id) => post("video-grupos.php", { accion: "eliminar", id }),

  clientes: (params) => llamar(`clientes.php?${new URLSearchParams(params)}`),
  cliente: (id) => llamar(`clientes.php?id=${id}`),
  guardarCliente: (cliente, contactos, desdeMensaje) =>
    post("clientes.php", { accion: "guardar", cliente, contactos, desde_mensaje: desdeMensaje ?? null }),
  eliminarCliente: (id) => post("clientes.php", { accion: "eliminar", id }),

  mensajes: (params) => llamar(`mensajes.php?${new URLSearchParams(params)}`),
  mensajesNuevos: () => llamar("mensajes.php?resumen=1"),
  estadoMensaje: (id, estado) => post("mensajes.php", { accion: "estado", id, estado }),
  eliminarMensaje: (id) => post("mensajes.php", { accion: "eliminar", id }),

  finanzas: (params) => llamar(`finanzas.php?${new URLSearchParams(params)}`),
  guardarMovimiento: (movimiento) => post("finanzas.php", { accion: "guardar", movimiento }),
  estadoMovimiento: (id, estado) => post("finanzas.php", { accion: "estado", id, estado }),
  eliminarMovimiento: (id) => post("finanzas.php", { accion: "eliminar", id }),
  finanzasConfig: () => llamar("finanzas-config.php"),
  finanzasAccion: (accion, datos) => post("finanzas-config.php", { accion, ...datos }),
  subirComprobante: (id, archivo, nombre) =>
    llamar(`finanzas-comprobante.php?id=${id}`, {
      method: "POST",
      headers: { "Content-Type": archivo.type, "X-Nombre-Archivo": encodeURIComponent(nombre) },
      body: archivo,
    }),
  quitarComprobante: (id) => post("finanzas-comprobante.php", { accion: "quitar", id }),

  productos: (params = {}) => llamar(`productos.php?${new URLSearchParams(params)}`),
  guardarProducto: (producto) => post("productos.php", { accion: "guardar", producto }),
  eliminarProducto: (id) => post("productos.php", { accion: "eliminar", id }),

  documentos: (params) => llamar(`documentos.php?${new URLSearchParams(params)}`),
  documento: (id) => llamar(`documentos.php?id=${id}`),
  configFacturacion: () => llamar("documentos.php?config=1"),
  guardarConfigFacturacion: (config) => post("documentos.php", { accion: "config", config }),
  guardarDocumento: (documento, items) => post("documentos.php", { accion: "guardar", documento, items }),
  estadoDocumento: (id, estado) => post("documentos.php", { accion: "estado", id, estado }),
  folioDocumento: (id, folio) => post("documentos.php", { accion: "folio", id, folio }),
  convertirDocumento: (id, a) => post("documentos.php", { accion: "convertir", id, a }),
  eliminarDocumento: (id) => post("documentos.php", { accion: "eliminar", id }),
  subirArchivoDocumento: (id, archivo) =>
    llamar(`documento-archivo.php?id=${id}`, {
      method: "POST",
      headers: { "Content-Type": archivo.type, "X-Nombre-Archivo": encodeURIComponent(archivo.name) },
      body: archivo,
    }),
  quitarArchivoDocumento: (id) => post("documento-archivo.php", { accion: "quitar", id }),

  familia: () => llamar("familia.php"),
  familiaClave: (clave) => post("familia.php", { accion: "clave", clave }),
  familiaActivo: (activo) => post("familia.php", { accion: "activo", activo }),
  familiaCerrarAccesos: () => post("familia.php", { accion: "cerrar_accesos" }),
  iniciarSubida: (datos) => post("videos-subida.php?accion=iniciar", datos),
  subirParte: (id, desde, trozo, signal) =>
    binario(`videos-subida.php?accion=parte&id=${id}&desde=${desde}`, trozo, "application/octet-stream", signal),
  subirPortada: (id, jpg) => binario(`videos-subida.php?accion=portada&id=${id}`, jpg, "image/jpeg"),
  terminarSubida: (id) => post("videos-subida.php?accion=terminar", { id }),
  cancelarSubida: (id) => post("videos-subida.php?accion=cancelar", { id }),
};

// URLs para <video>/<img>: la cookie de sesión viaja sola (misma ruta /api/admin/).
export const urlVideo = (id, extra = "") => `/api/admin/video-ver.php?id=${id}${extra}`;
export const urlArchivoDocumento = (id) => `/api/admin/documento-archivo.php?id=${id}`;
export const urlComprobante =(id, descargar = false) => `/api/admin/finanzas-comprobante.php?id=${id}${descargar ? "&descargar=1" : ""}`;

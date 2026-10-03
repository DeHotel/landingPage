// API de la página familiar (/api/familia/*). El acceso viaja en una cookie HttpOnly
// que solo se envía a /api/familia/: no sirve para el panel de administración.

let alExpirar = () => {};
export const onAccesoVencido = (fn) => {
  alExpirar = fn;
};

async function llamar(ruta, opciones = {}) {
  const res = await fetch(`/api/familia/${ruta}`, { credentials: "same-origin", cache: "no-store", ...opciones });
  const json = await res.json().catch(() => ({}));
  if (res.status === 401 && ruta !== "login.php") alExpirar();
  if (!res.ok) throw new Error(json.error || `Error ${res.status}`);
  return json;
}

const post = (ruta, datos) =>
  llamar(ruta, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(datos ?? {}) });

export const api = {
  estado: () => llamar("estado.php"),
  entrar: (clave, recordar) => post("login.php", { clave, recordar }),
  salir: () => post("logout.php"),
  videos: () => llamar("videos.php"),
};

export const urlVideo = (id, extra = "") => `/api/familia/video-ver.php?id=${id}${extra}`;

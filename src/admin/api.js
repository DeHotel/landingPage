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
  if (!res.ok) throw new Error(json.error || `Error ${res.status}`);
  return json;
}

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
};

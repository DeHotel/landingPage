// Registra la visita en /api/visita.php (se guarda en MySQL y solo se ve en /admin/).
// No usa cookies: el "visitante" es un id anónimo al azar guardado en este navegador,
// para distinguir personas nuevas de las que vuelven.

const CLAVE_VISITANTE = "dh_visitante";
export const CLAVE_NO_CONTAR = "dh_no_contar"; // la activa el panel de administración

function leer(clave) {
  try {
    return localStorage.getItem(clave);
  } catch {
    return null;
  }
}

function idVisitante() {
  let id = leer(CLAVE_VISITANTE);
  if (!id) {
    id =
      crypto.randomUUID?.() ??
      "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) =>
        (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16)
      );
    try {
      localStorage.setItem(CLAVE_VISITANTE, id);
    } catch {
      // modo privado: se cuenta igual, pero como visitante nuevo
    }
  }
  return id;
}

export function registrarVisita() {
  if (leer(CLAVE_NO_CONTAR) === "1") return;

  const params = new URLSearchParams(location.search);
  fetch("/api/visita.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    keepalive: true,
    body: JSON.stringify({
      visitante: idVisitante(),
      pagina: location.pathname,
      referencia: document.referrer,
      utm: params.get("utm_source") || "",
    }),
  }).catch(() => {});
}

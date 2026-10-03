import { api } from "./api";

export const EXTENSIONES = ["mp4", "m4v", "webm", "mov", "ogv"];

export const extension = (archivo) => archivo.name.split(".").pop().toLowerCase();

// "mi_video-final.mp4" → "mi video final"
export const nombreSugerido = (archivo) =>
  archivo.name
    .replace(/\.[^.]+$/, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 150);

// Lee duración, resolución y una miniatura del video en el propio navegador.
// Si el formato no se puede reproducir aquí (ej. algunos .mov), sigue sin miniatura.
export function analizarVideo(archivo) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(archivo);
    const video = document.createElement("video");
    const fin = (datos) => {
      clearTimeout(reloj);
      video.removeAttribute("src");
      video.load();
      URL.revokeObjectURL(url);
      resolve(datos);
    };
    const reloj = setTimeout(() => fin({}), 10000);
    let info = {};

    video.muted = true;
    video.playsInline = true;
    video.preload = "metadata";
    video.onerror = () => fin(info);
    video.onloadedmetadata = () => {
      info = {
        duracion: Number.isFinite(video.duration) ? Math.round(video.duration) : null,
        ancho: video.videoWidth || null,
        alto: video.videoHeight || null,
      };
      // Un cuadro al 10% del video (máx. 3 s) suele ser más representativo que el primero.
      video.currentTime = Math.min(3, (video.duration || 0) * 0.1) || 0.1;
    };
    video.onseeked = () => {
      try {
        const ancho = Math.min(640, video.videoWidth || 640);
        const alto = Math.round(ancho * ((video.videoHeight || 9) / (video.videoWidth || 16)));
        const canvas = document.createElement("canvas");
        canvas.width = ancho;
        canvas.height = alto;
        canvas.getContext("2d").drawImage(video, 0, 0, ancho, alto);
        canvas.toBlob((blob) => fin({ ...info, portada: blob }), "image/jpeg", 0.8);
      } catch {
        fin(info);
      }
    };
    video.src = url;
  });
}

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Sube un video por trozos. Reintenta cada trozo hasta 4 veces (cortes de red) y,
 * si el servidor informa otro punto de avance, continúa desde ahí.
 * onProgreso(fraccion 0..1). Cancelable con signal (AbortController).
 */
export async function subirVideo(archivo, nombre, { onProgreso, onEtapa, signal, visibleFamilia = true, grupoId = null } = {}) {
  onEtapa?.("Preparando…");
  const info = await analizarVideo(archivo);
  if (signal?.aborted) throw new DOMException("Cancelado", "AbortError");

  const { id, parte } = await api.iniciarSubida({
    nombre,
    tamano: archivo.size,
    extension: extension(archivo),
    duracion: info.duracion,
    ancho: info.ancho,
    alto: info.alto,
    visible_familia: visibleFamilia,
    grupo_id: grupoId,
  });

  try {
    if (info.portada) await api.subirPortada(id, info.portada).catch(() => {});

    onEtapa?.("Subiendo…");
    let enviado = 0;
    let fallos = 0;
    while (enviado < archivo.size) {
      if (signal?.aborted) throw new DOMException("Cancelado", "AbortError");
      const trozo = archivo.slice(enviado, Math.min(enviado + parte, archivo.size));
      try {
        const r = await api.subirParte(id, enviado, trozo, signal);
        enviado = r.recibido;
        fallos = 0;
        onProgreso?.(enviado / archivo.size);
      } catch (e) {
        if (e.name === "AbortError") throw e;
        if (typeof e.datos?.recibido === "number") enviado = e.datos.recibido;
        if (++fallos > 4 || e.status === 404 || e.status === 401) throw e;
        await esperar(1000 * fallos);
      }
    }

    onEtapa?.("Terminando…");
    const { video } = await api.terminarSubida(id);
    return video;
  } catch (e) {
    api.cancelarSubida(id).catch(() => {});
    throw e;
  }
}

import { StrictMode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import LatidoPos from "./LatidoPos";
import { registrarVisita } from "../visitas";
import "../styles.css";

registrarVisita();

const raiz = document.getElementById("root");
const app = (
  <StrictMode>
    <LatidoPos />
  </StrictMode>
);

// Igual que la portada: en producción el HTML viene prerenderizado y se hidrata.
if (raiz.hasChildNodes()) {
  hydrateRoot(raiz, app);
} else {
  createRoot(raiz).render(app);
}

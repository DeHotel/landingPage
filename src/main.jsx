import { StrictMode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import App from "./App";
import { registrarVisita } from "./visitas";
import "./styles.css";

registrarVisita();

const raiz = document.getElementById("root");
const app = (
  <StrictMode>
    <App />
  </StrictMode>
);

// En producción el HTML viene prerenderizado (scripts/prerender.mjs): se hidrata.
// En desarrollo (npm run dev) #root llega vacío y se dibuja desde cero.
if (raiz.hasChildNodes()) {
  hydrateRoot(raiz, app);
} else {
  createRoot(raiz).render(app);
}

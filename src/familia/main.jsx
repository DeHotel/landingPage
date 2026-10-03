import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import FamiliaApp from "./FamiliaApp";
import "./familia.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <FamiliaApp />
  </StrictMode>
);

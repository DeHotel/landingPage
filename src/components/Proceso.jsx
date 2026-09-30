import { proceso, tecnologias } from "../data/contenido";

export default function Proceso() {
  return (
    <section id="proceso" className="seccion seccion--alterna">
      <div className="contenedor">
        <div className="encabezado">
          <p className="sobretitulo">Cómo trabajamos</p>
          <h2>Un proceso simple, con avances que puedes ver</h2>
        </div>

        <ol className="pasos">
          {proceso.map((p, i) => (
            <li key={p.titulo} className="paso">
              <span className="paso__numero">{String(i + 1).padStart(2, "0")}</span>
              <h3>{p.titulo}</h3>
              <p className="texto-suave">{p.texto}</p>
            </li>
          ))}
        </ol>

        <div className="tecnologias">
          <p>Trabajamos con</p>
          <ul>
            {tecnologias.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

import Navbar from "../components/Navbar";
import Contacto from "../components/Contacto";
import Footer from "../components/Footer";
import WhatsAppBoton from "../components/WhatsAppBoton";
import Privacidad from "../components/Privacidad";
import Icono from "../components/Icono";
import { latidoPos as lp } from "../data/contenido";

const IMG = "/img/proyectos/latido-pos";

// Captura con marco de ventana; en celulares se carga la versión de 800 px.
function Captura({ nombre, alt, prioridad = false }) {
  return (
    <figure className="latido-captura">
      <div className="latido-captura__barra" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <img
        src={`${IMG}/${nombre}.webp`}
        srcSet={`${IMG}/${nombre}-800.webp 800w, ${IMG}/${nombre}.webp 1600w`}
        sizes="(max-width: 960px) 100vw, 640px"
        width="1600"
        height="1000"
        alt={alt}
        loading={prioridad ? "eager" : "lazy"}
        fetchPriority={prioridad ? "high" : undefined}
      />
    </figure>
  );
}

export default function LatidoPos() {
  return (
    <>
      <Navbar base="/" />
      <main>
        <section id="inicio" className="latido-hero">
          <div className="contenedor latido-hero__fila">
            <div>
              <nav className="latido-migas" aria-label="Ruta">
                <a href="/">Inicio</a> <span aria-hidden="true">/</span> <a href="/#proyectos">Proyectos</a>{" "}
                <span aria-hidden="true">/</span> <span aria-current="page">Latido POS</span>
              </nav>
              <p className="latido-marca">
                <img src={`${IMG}/latido-marca.svg`} alt="" width="44" height="44" />
                Latido POS
              </p>
              <h1>{lp.titulo}</h1>
              <p className="latido-hero__sub">{lp.subtitulo}</p>
              <div className="hero__acciones">
                <a href="#contacto" className="boton boton--latido">
                  Solicitar una demostración
                </a>
                <a href="#funciones" className="boton boton--contorno">
                  Ver funciones
                </a>
              </div>
            </div>
            <Captura nombre="venta" alt={lp.pantallas[0].alt} prioridad />
          </div>
          <div className="contenedor">
            <dl className="latido-destacados">
              {lp.destacados.map((d) => (
                <div key={d.valor}>
                  <dt>{d.valor}</dt>
                  <dd>{d.etiqueta}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section id="funciones" className="seccion">
          <div className="contenedor">
            <div className="encabezado">
              <p className="sobretitulo latido-sobretitulo">Funciones</p>
              <h2>Todo lo que un almacén necesita para vender y controlar su negocio</h2>
              <p className="texto-suave">
                Desarrollado por dehotel.cl para el día a día de un negocio de barrio: rápido para el cajero y claro
                para el dueño.
              </p>
            </div>
            <div className="grilla grilla--3">
              {lp.funciones.map((f) => (
                <article key={f.titulo} className="latido-funcion">
                  <span className="latido-funcion__icono">
                    <Icono nombre={f.icono} size={24} />
                  </span>
                  <h3>{f.titulo}</h3>
                  <p className="texto-suave">{f.texto}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="pantallas" className="seccion seccion--alterna">
          <div className="contenedor">
            <div className="encabezado">
              <p className="sobretitulo latido-sobretitulo">Pantallas</p>
              <h2>Así se ve Latido POS</h2>
            </div>
            {lp.pantallas.map((s, i) => (
              <div key={s.imagen} className={`latido-pantalla ${i % 2 ? "latido-pantalla--invertida" : ""}`}>
                <Captura nombre={s.imagen} alt={s.alt} />
                <div>
                  <h3>{s.titulo}</h3>
                  <p className="texto-suave">{s.texto}</p>
                </div>
              </div>
            ))}
            <p className="latido-nota">Capturas con datos de ejemplo.</p>
          </div>
        </section>

        <section className="seccion">
          <div className="contenedor latido-dos">
            <div>
              <p className="sobretitulo latido-sobretitulo">Para quién</p>
              <h2>Pensado para el comercio de barrio</h2>
              <ul className="latido-lista">
                {lp.paraQuien.map((x) => (
                  <li key={x}>
                    <Icono nombre="check" size={20} /> {x}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="sobretitulo latido-sobretitulo">Tecnología</p>
              <h2>Rápido, local y seguro</h2>
              <p className="texto-suave">
                Un servicio local con base de datos SQLite en el computador del negocio, una interfaz web moderna dentro
                de una ventana de escritorio y un instalador que incluye todo lo necesario.
              </p>
              <ul className="latido-chips">
                {lp.tecnologia.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section id="preguntas" className="seccion seccion--alterna">
          <div className="contenedor latido-preguntas">
            <div className="encabezado">
              <p className="sobretitulo latido-sobretitulo">Preguntas frecuentes</p>
              <h2>Lo que más nos preguntan</h2>
            </div>
            {lp.preguntas.map((q) => (
              <details key={q.p} className="latido-pregunta">
                <summary>{q.p}</summary>
                <p className="texto-suave">{q.r}</p>
              </details>
            ))}
          </div>
        </section>

        <Contacto
          temaInicial={lp.tema}
          titulo="¿Quieres ver Latido POS en tu negocio?"
          texto="Escríbenos y coordinamos una demostración. Te contamos cómo se instala, qué equipos necesitas y cómo cargar tus productos."
        />
      </main>
      <Footer base="/" />
      <WhatsAppBoton />
      <Privacidad />
    </>
  );
}

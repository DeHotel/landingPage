import Navbar from "../components/Navbar";
import Contacto from "../components/Contacto";
import Footer from "../components/Footer";
import WhatsAppBoton from "../components/WhatsAppBoton";
import Privacidad from "../components/Privacidad";
import Icono from "../components/Icono";
import { contacto, latidoPos as lp } from "../data/contenido";

const IMG = "/img/proyectos/latido-pos";
const MENSAJE_PRUEBA = `Hola, quiero la prueba gratis de ${lp.prueba.dias} días de Latido POS para mi negocio.`;

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
              <p className="latido-insignia">
                <span aria-hidden="true" /> Prueba gratis por {lp.prueba.dias} días
              </p>
              <h1>{lp.titulo}</h1>
              <p className="latido-hero__sub">{lp.subtitulo}</p>
              <div className="hero__acciones">
                <a href="#prueba" className="boton boton--latido">
                  Probar gratis {lp.prueba.dias} días
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

        <section id="prueba" className="seccion latido-prueba">
          <div className="contenedor">
            <div className="encabezado">
              <p className="sobretitulo latido-sobretitulo">Prueba gratis</p>
              <h2>{lp.prueba.titulo}</h2>
              <p className="texto-suave">{lp.prueba.texto}</p>
            </div>
            <ol className="latido-pasos">
              {lp.prueba.pasos.map((p, i) => (
                <li key={p.titulo}>
                  <span className="latido-pasos__numero">{i + 1}</span>
                  <h3>{p.titulo}</h3>
                  <p className="texto-suave">{p.texto}</p>
                </li>
              ))}
            </ol>
            <div className="latido-prueba__acciones">
              <a href="#contacto" className="boton boton--latido">
                Solicitar mi prueba gratis
              </a>
              <a
                href={`https://wa.me/${contacto.whatsapp}?text=${encodeURIComponent(MENSAJE_PRUEBA)}`}
                className="boton boton--contorno-oscuro"
                target="_blank"
                rel="noopener noreferrer"
              >
                Pedirla por WhatsApp
              </a>
            </div>
          </div>
        </section>

        <section id="funciones" className="seccion seccion--alterna">
          <div className="contenedor">
            <div className="encabezado">
              <p className="sobretitulo latido-sobretitulo">Funciones</p>
              <h2>Todo lo que un minimarket o bazar necesita para vender y controlar su negocio</h2>
              <p className="texto-suave">
                Desarrollado por dehotel.cl para el día a día de los pequeños negocios de barrio: rápido para el cajero
                y claro para el dueño.
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

        <section id="pantallas" className="seccion">
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

        <section className="seccion seccion--alterna">
          <div className="contenedor latido-dos">
            <div>
              <p className="sobretitulo latido-sobretitulo">Para quién</p>
              <h2>Para minimarkets, bazares y pequeños negocios de barrio</h2>
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

        <section id="preguntas" className="seccion">
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
          titulo={`Pide tu prueba gratis de ${lp.prueba.dias} días`}
          texto="Cuéntanos el nombre y el tipo de tu negocio. Te contactamos para coordinar la instalación, ver qué equipos tienes y ayudarte a cargar tus productos."
        />
      </main>
      <Footer base="/" />
      <WhatsAppBoton mensaje={MENSAJE_PRUEBA} />
      <Privacidad />
    </>
  );
}

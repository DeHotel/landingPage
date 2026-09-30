import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Servicios from "./components/Servicios";
import Proceso from "./components/Proceso";
import Proyectos from "./components/Proyectos";
import Contacto from "./components/Contacto";
import Footer from "./components/Footer";
import WhatsAppBoton from "./components/WhatsAppBoton";

export default function App() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Servicios />
        <Proceso />
        <Proyectos />
        <Contacto />
      </main>
      <Footer />
      <WhatsAppBoton />
    </>
  );
}

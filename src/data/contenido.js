// Todo el contenido de la landing vive aquí: textos, datos de contacto e imágenes.
// Los valores marcados con "EJEMPLO" son de relleno y deben reemplazarse por los reales.
// Las imágenes apuntan a fotos de stock de Unsplash; para usar fotos propias,
// déjalas en /public/img y cambia la URL por "/img/nombre.jpg".

const unsplash = (id, w = 1600) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=75`;

export const marca = {
  nombre: "dehotel",
  dominio: ".cl",
  eslogan: "Desarrollo de software e integraciones a la medida",
};

export const contacto = {
  email: "contacto@dehotel.cl",
  telefono: "+56 9 3616 7691",
  whatsapp: "56936167691", // solo dígitos, con código de país
  direccion: "Santiago, Chile", // EJEMPLO
  horario: "Lunes a viernes, 9:00 a 18:00",
};

export const navegacion = [
  { id: "servicios", label: "Servicios" },
  { id: "proceso", label: "Cómo trabajamos" },
  { id: "proyectos", label: "Proyectos" },
  { id: "contacto", label: "Contacto" },
];

export const hero = {
  sobretitulo: "Tecnología para tu negocio",
  titulo: "Construimos el software que tu empresa necesita",
  subtitulo:
    "Desarrollamos aplicaciones, interfaces e integraciones a la medida para que tus sistemas trabajen juntos y tu equipo trabaje menos.",
  imagen: unsplash("photo-1518770660439-4636190af475", 2000),
  ctaPrincipal: "Conversemos tu proyecto",
  ctaSecundario: "Ver servicios",
};

export const cifras = [
  { valor: "+10", etiqueta: "años desarrollando software" }, // EJEMPLO
  { valor: "+60", etiqueta: "proyectos entregados" }, // EJEMPLO
  { valor: "+30", etiqueta: "integraciones en producción" }, // EJEMPLO
  { valor: "24/7", etiqueta: "monitoreo de sistemas" }, // EJEMPLO
];

export const servicios = [
  {
    icono: "codigo",
    titulo: "Desarrollo de aplicaciones",
    texto: "Aplicaciones web y móviles a la medida, desde el prototipo hasta la puesta en producción.",
  },
  {
    icono: "interfaz",
    titulo: "Diseño de interfaces",
    texto: "Interfaces claras y responsivas (UI/UX) que tus usuarios entienden a la primera.",
  },
  {
    icono: "integracion",
    titulo: "Integraciones y APIs",
    texto: "Conectamos tus sistemas: ERP, pasarelas de pago, channel managers, facturación y más.",
  },
  {
    icono: "engranaje",
    titulo: "Automatización de procesos",
    texto: "Eliminamos planillas y tareas manuales con flujos automáticos, reportes y notificaciones.",
  },
  {
    icono: "base-datos",
    titulo: "Bases de datos y reportería",
    texto: "Modelamos tus datos y construimos dashboards e informes para decidir con información real.",
  },
  {
    icono: "nube",
    titulo: "Hosting, soporte y mantención",
    texto: "Publicamos, monitoreamos y mantenemos tus aplicaciones para que sigan funcionando.",
  },
];

export const proceso = [
  {
    titulo: "Descubrimiento",
    texto: "Entendemos tu operación, tus sistemas actuales y el problema que hay que resolver.",
  },
  {
    titulo: "Diseño",
    texto: "Definimos alcance, arquitectura e interfaces, y lo validamos contigo antes de programar.",
  },
  {
    titulo: "Desarrollo",
    texto: "Entregamos por etapas cortas para que veas avances reales cada pocas semanas.",
  },
  {
    titulo: "Puesta en marcha",
    texto: "Publicamos, capacitamos a tu equipo y quedamos a cargo del soporte y la mejora continua.",
  },
];

export const tecnologias = [
  "React",
  "Node.js",
  "MySQL",
  "SQL Server",
  "APIs REST",
  "Vite",
  "Material UI",
  "Docker",
];

export const proyectos = [
  {
    titulo: "Sistema de gestión hotelera", // EJEMPLO
    categoria: "Aplicación web",
    texto: "Reservas, estados de pago, reportes e integración con channel manager para una cadena de recintos.",
    imagen: unsplash("photo-1551288049-bebda4e38f71", 900),
  },
  {
    titulo: "Portal de clientes", // EJEMPLO
    categoria: "Interfaz + API",
    texto: "Autoatención para clientes corporativos con consulta de documentos y seguimiento en línea.",
    imagen: unsplash("photo-1460925895917-afdab827c52f", 900),
  },
  {
    titulo: "Mantención por código QR", // EJEMPLO
    categoria: "App móvil + panel",
    texto: "Solicitudes de mantención con fotos desde cada habitación y panel de órdenes de trabajo.",
    imagen: unsplash("photo-1512941937669-90a1b58e7e9c", 900),
  },
];

export const temasContacto = [
  "Desarrollo de aplicación",
  "Diseño de interfaces",
  "Integración / API",
  "Automatización",
  "Soporte o mantención",
  "Otro",
];

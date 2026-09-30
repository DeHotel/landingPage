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
  { valor: "+25", etiqueta: "años desarrollando software" },
  { valor: "+60", etiqueta: "proyectos entregados" }, // EJEMPLO
  { valor: "+30", etiqueta: "integraciones en producción" }, // EJEMPLO
  { valor: "24/7", etiqueta: "monitoreo de sistemas" }, // EJEMPLO
];

// Cada servicio abre un detalle (ServicioDetalle.jsx) con una ilustración animada.
// "tema" debe coincidir con una opción de temasContacto: el botón "Conversemos"
// deja ese tema preseleccionado en el formulario.
export const servicios = [
  {
    icono: "codigo",
    titulo: "Desarrollo de aplicaciones",
    texto: "Aplicaciones web y móviles a la medida, desde el prototipo hasta la puesta en producción.",
    tema: "Desarrollo de aplicación",
    frase: "Del «¿y si tuviéramos un sistema para esto?» a una aplicación que tu equipo usa todos los días.",
    resumen:
      "Construimos aplicaciones pensadas para tu operación, no plantillas genéricas. Partimos por lo que más duele, entregamos por etapas y cada versión queda funcionando en producción, con usuarios reales dándonos retroalimentación.",
    incluye: [
      "Levantamiento de procesos y requerimientos",
      "Aplicaciones web y móviles (responsive o PWA)",
      "Usuarios, roles y permisos",
      "Paneles de administración",
      "Carga masiva y exportación a Excel/PDF",
      "Documentación y capacitación",
    ],
    ideal: [
      "Tu operación depende de planillas que ya no dan abasto.",
      "Usas un software genérico que te obliga a trabajar a su manera.",
      "Necesitas que tus clientes o proveedores hagan trámites en línea.",
    ],
    stack: ["React", "Node.js", "PHP", "SQL Server", "MySQL"],
  },
  {
    icono: "interfaz",
    titulo: "Diseño de interfaces",
    texto: "Interfaces claras y responsivas (UI/UX) que tus usuarios entienden a la primera.",
    tema: "Diseño de interfaces",
    frase: "Si hay que explicar cómo se usa, todavía se puede diseñar mejor.",
    resumen:
      "Diseñamos pantallas que se entienden solas: menos clics, menos errores y menos capacitación. Probamos con prototipos navegables antes de programar, para que las decisiones se tomen viendo y no imaginando.",
    incluye: [
      "Prototipos navegables antes de programar",
      "Diseño responsive: escritorio, tablet y celular",
      "Rediseño de sistemas existentes",
      "Guía de estilos y componentes reutilizables",
      "Accesibilidad y buena legibilidad",
      "Dashboards e informes fáciles de leer",
    ],
    ideal: [
      "Tu sistema funciona, pero a la gente le cuesta usarlo.",
      "Vas a construir algo nuevo y quieres validarlo antes de invertir.",
      "Tus usuarios trabajan desde el celular, en terreno.",
    ],
    stack: ["Figma", "React", "Material UI", "CSS"],
  },
  {
    icono: "integracion",
    titulo: "Integraciones y APIs",
    texto: "Conectamos tus sistemas: ERP, pasarelas de pago, channel managers, facturación y más.",
    tema: "Integración / API",
    frase: "Tus sistemas ya tienen la información. Solo falta que conversen entre ellos.",
    resumen:
      "Hacemos que la información fluya sola entre tus plataformas: sin copiar y pegar, sin digitar dos veces y sin descuadres. Construimos APIs propias y nos conectamos a las de terceros, con registros de cada intercambio para saber siempre qué pasó.",
    incluye: [
      "Conexión con ERP, CRM y software contable",
      "Pasarelas de pago (Transbank, Webpay y otras)",
      "Channel managers y sistemas de reservas",
      "Facturación electrónica",
      "APIs REST propias, documentadas y seguras",
      "Sincronizaciones programadas y registro de errores",
    ],
    ideal: [
      "Alguien de tu equipo pasa datos a mano de un sistema a otro.",
      "Tienes cifras distintas según el sistema que mires.",
      "Un proveedor o cliente te pide conectarse a tus datos.",
    ],
    stack: ["APIs REST", "Webhooks", "JSON / XML", "Node.js", "PHP"],
  },
  {
    icono: "engranaje",
    titulo: "Automatización de procesos",
    texto: "Eliminamos planillas y tareas manuales con flujos automáticos, reportes y notificaciones.",
    tema: "Automatización",
    frase: "Lo repetitivo, que lo haga el sistema. Tu equipo, a lo importante.",
    resumen:
      "Identificamos las tareas que se repiten cada día, semana o mes y las convertimos en procesos automáticos que corren solos, avisan cuando algo se sale de lo normal y dejan todo registrado.",
    incluye: [
      "Reportes que se generan y envían solos por correo",
      "Alertas y notificaciones ante excepciones",
      "Tareas programadas (diarias, semanales, mensuales)",
      "Generación automática de documentos Excel y PDF",
      "Validaciones y cuadraturas automáticas",
      "Flujos de aprobación",
    ],
    ideal: [
      "Cierras el mes armando planillas durante días.",
      "Te enteras de los problemas cuando ya es tarde.",
      "Los procesos dependen de que una persona se acuerde.",
    ],
    stack: ["Tareas programadas", "Correo SMTP", "ExcelJS", "SQL"],
  },
  {
    icono: "base-datos",
    titulo: "Bases de datos y reportería",
    texto: "Modelamos tus datos y construimos dashboards e informes para decidir con información real.",
    tema: "Datos y reportería",
    frase: "Datos ordenados hoy, mejores decisiones mañana.",
    resumen:
      "Ordenamos y modelamos tu información para que sea confiable y rápida de consultar, y la convertimos en dashboards e informes que responden las preguntas del negocio sin tener que pedírselas a nadie.",
    incluye: [
      "Diseño y modelado de bases de datos",
      "Optimización de consultas lentas",
      "Dashboards con indicadores clave (KPI)",
      "Informes descargables en Excel y PDF",
      "Migración y limpieza de datos",
      "Respaldos y seguridad de la información",
    ],
    ideal: [
      "Cada informe se arma a mano y nadie confía en el resultado.",
      "Tu sistema se puso lento a medida que crecieron los datos.",
      "Quieres ver el estado del negocio de un vistazo.",
    ],
    stack: ["SQL Server", "MySQL", "Procedimientos almacenados", "Power BI"],
  },
  {
    icono: "nube",
    titulo: "Hosting, soporte y mantención",
    texto: "Publicamos, monitoreamos y mantenemos tus aplicaciones para que sigan funcionando.",
    tema: "Soporte o mantención",
    frase: "El software no se termina el día que se entrega: ahí empieza a trabajar.",
    resumen:
      "Nos hacemos cargo de que tus aplicaciones sigan funcionando: las publicamos, las monitoreamos, respaldamos la información y atendemos incidencias y mejoras con tiempos de respuesta acordados.",
    incluye: [
      "Publicación en tu hosting o en la nube",
      "Monitoreo y alertas de disponibilidad",
      "Respaldos automáticos",
      "Actualizaciones de seguridad",
      "Mesa de ayuda para incidencias",
      "Bolsa de horas para mejoras continuas",
    ],
    ideal: [
      "Tienes un sistema que nadie mantiene desde hace tiempo.",
      "Tu proveedor anterior ya no responde.",
      "Necesitas tranquilidad: que alguien vigile que todo funcione.",
    ],
    stack: ["Linux", "Windows Server", "IIS / Apache", "Nginx", "Docker"],
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
  "Datos y reportería",
  "Soporte o mantención",
  "Otro",
];

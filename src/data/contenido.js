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

// "enlace": el proyecto tiene página propia; sin enlace, la tarjeta lleva a Contacto.
// "destacado": se muestra como tarjeta ancha sobre las demás.
export const proyectos = [
  {
    titulo: "Latido POS: punto de venta para almacenes",
    categoria: "Producto propio · Windows",
    texto: "Sistema de punto de venta para almacenes y minimarkets en Chile: código de barras y balanza, boleta electrónica, caja con varios cajeros, fiado, stock e informes de ventas y utilidad. Funciona sin internet.",
    imagen: "/img/proyectos/latido-pos/venta-800.webp",
    logo: "/img/proyectos/latido-pos/latido-marca.svg",
    enlace: "/proyectos/latido-pos/",
    destacado: true,
  },
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
  "Latido POS (punto de venta)",
  "Otro",
];

// Página de Latido POS (/proyectos/latido-pos/). El título y la descripción para Google
// están en proyectos/latido-pos/index.html; las capturas, en public/img/proyectos/latido-pos/.
export const latidoPos = {
  ruta: "/proyectos/latido-pos/",
  tema: "Latido POS (punto de venta)",
  titulo: "Latido POS: sistema de punto de venta para almacenes y minimarkets",
  subtitulo:
    "Vende rápido con código de barras, balanza o botones; emite boleta electrónica, controla la caja, el fiado y el stock, y mira cuánto vendes y cuánto ganas. Se instala en el computador del negocio y funciona sin internet.",
  destacados: [
    { valor: "Sin internet", etiqueta: "la venta nunca se detiene" },
    { valor: "Boleta SII", etiqueta: "con proveedor autorizado" },
    { valor: "Varias cajas", etiqueta: "en la red del local" },
    { valor: "Hecho en Chile", etiqueta: "pesos, RUT e IVA" },
  ],
  funciones: [
    { icono: "carro", titulo: "Venta rápida", texto: "Lector de códigos de barras, búsqueda por nombre, «3*pan» para varias unidades y un panel de botones por grupo para pan, verduras o pantallas táctiles." },
    { icono: "balanza", titulo: "Productos por kilo", texto: "Venta a granel con balanza o tecleando el peso, y lectura de etiquetas de balanza con el precio o el peso incluido." },
    { icono: "documento", titulo: "Boleta electrónica", texto: "Emisión a través de un proveedor autorizado por el SII. Si se corta internet, la boleta queda pendiente y se reintenta sola." },
    { icono: "caja", titulo: "Caja y turnos", texto: "Apertura y cierre con arqueo, efectivo esperado, ingresos y retiros. Efectivo, débito, crédito, transferencia y fiado." },
    { icono: "usuarios", titulo: "Cajeros y permisos", texto: "Un usuario por persona. Cambios de precio y devoluciones con autorización del administrador, y todo queda registrado." },
    { icono: "libreta", titulo: "Fiado y clientes", texto: "Cupo por cliente, abonos y estado de cuenta. La deuda se calcula de los movimientos, así que no se descuadra." },
    { icono: "etiqueta", titulo: "Promociones y paquetes", texto: "Descuentos por período, precio fijo, «lleva 3 paga 2» y paquetes que descuentan el stock de cada componente." },
    { icono: "cajas", titulo: "Stock, compras y kardex", texto: "Compras a proveedores con pagos y saldos, kardex por producto, niveles de stock, vencimientos por lote y pedidos a proveedores." },
    { icono: "grafico", titulo: "Informes de ventas y utilidad", texto: "Venta neta, costo, utilidad y margen por día, grupo y producto, y ventas por hora del día. Exporta a Excel o imprime." },
    { icono: "red", titulo: "Varias cajas en red", texto: "Un computador principal con la base de datos y cajas secundarias conectadas por la red del local, con el mismo stock al instante." },
    { icono: "escudo", titulo: "Respaldos automáticos", texto: "Copia diaria verificada de toda la información, con una copia adicional en un pendrive o en una carpeta en la nube." },
    { icono: "nube", titulo: "Actualizaciones y panel central", texto: "Se actualiza solo con instaladores firmados y, si se activa, envía un resumen de actividad a un panel central para ver varios locales." },
  ],
  pantallas: [
    {
      imagen: "venta",
      titulo: "Una pantalla de venta pensada para la fila",
      texto: "El carro a la izquierda, los grupos y productos al centro y el cobro a la derecha. Se escanea, se toca o se busca: lo que sea más rápido para cada producto. El vuelto se calcula solo.",
      alt: "Pantalla de venta de Latido POS con productos en el carro, panel de grupos y medios de pago",
    },
    {
      imagen: "informes",
      titulo: "Cuánto vendiste y cuánto ganaste",
      texto: "El informe de ventas y utilidades muestra la venta neta, el costo de lo vendido, la utilidad con su margen y el ticket promedio, día por día y por grupo o producto: qué vende más y qué deja más.",
      alt: "Informe de ventas y utilidades de Latido POS con resumen y gráfico de ventas por día",
    },
    {
      imagen: "horarios",
      titulo: "¿A qué hora se vende más?",
      texto: "Las ventas por hora del día y por día de la semana ayudan a decidir turnos, horarios de reposición y qué productos tener a mano en cada momento.",
      alt: "Estadísticas de Latido POS con las ventas por hora del día y las horas más fuertes destacadas",
    },
  ],
  paraQuien: ["Almacenes y negocios de barrio", "Minimarkets", "Botillerías", "Panaderías y amasanderías", "Verdulerías y fruterías", "Kioscos y bazares"],
  tecnologia: [".NET 9", "React 19", "TypeScript", "SQLite", "WPF + WebView2", "PHP + MySQL (panel central)", "Instalador para Windows"],
  preguntas: [
    {
      p: "¿Necesita internet para funcionar?",
      r: "No. Latido POS se instala en el computador del negocio y guarda la información ahí mismo, así que se puede vender aunque se corte internet. La conexión solo se usa para las boletas electrónicas (las pendientes se envían solas al volver la conexión), las actualizaciones y, si se activa, el panel central.",
    },
    {
      p: "¿Emite boleta electrónica?",
      r: "Sí, a través de un proveedor autorizado por el SII. Cada negocio usa su propia cuenta en el proveedor y el sistema guarda su clave cifrada.",
    },
    {
      p: "¿Qué equipos necesito?",
      r: "Un computador con Windows. Opcionalmente: impresora térmica de tickets con cajón de dinero, lector de códigos de barras y balanza. El instalador incluye todo lo necesario para que el programa funcione.",
    },
    {
      p: "¿Sirve para más de una caja?",
      r: "Sí. Un computador principal guarda la base de datos y las demás cajas se conectan por la red del local; todas ven el mismo stock al instante y cada cajero abre y cierra su propia caja.",
    },
    {
      p: "¿Puedo cargar mis productos de una vez?",
      r: "Sí. Se importan cientos de productos desde Excel o CSV, con una revisión previa que muestra los errores fila por fila antes de guardar.",
    },
    {
      p: "¿Qué pasa con mis datos?",
      r: "Quedan en el computador del negocio. Se respaldan automáticamente todos los días y se puede guardar una copia adicional en un pendrive o en una carpeta sincronizada con la nube.",
    },
  ],
};

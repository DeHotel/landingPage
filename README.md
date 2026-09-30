# dehotel.cl — Landing page y panel de administración

Sitio público de dehotel.cl: portada, servicios (desarrollo de aplicaciones,
interfaces, integraciones, etc.), proceso de trabajo, proyectos y contacto.
Incluye un panel privado en `/admin/` con el conteo de visitas.

- **Frontend:** React + Vite, dos páginas: la landing (`index.html`) y el panel (`admin/index.html`).
  Se compila a archivos estáticos (`dist/`).
- **API:** PHP + PDO (`public/api/`) sobre **MySQL**. Funciona en cualquier hosting compartido
  con PHP 7.4+ (no requiere Node en el servidor).
- **Base de datos:** scripts en `database/` (se ejecutan en orden).

## Estructura en el servidor

Todo el contenido de `dist/` va a la carpeta pública del hosting (normalmente `public_html/`):

```
public_html/
├── index.html           ← landing
├── admin/index.html     ← panel de administración
├── assets/              ← JS y CSS compilados
├── brand/               ← archivos del logo
└── api/
    ├── contacto.php     ← POST del formulario
    ├── visita.php       ← POST: registra cada visita a la landing
    ├── salud.php        ← GET: verifica conexión a MySQL
    ├── admin/           ← login, sesión y datos del panel
    └── config.php       ← credenciales del hosting (lo sube el deploy)
```

## Base de datos

En phpMyAdmin, con la base del hosting seleccionada (`cde100242_dehotel`), ejecutar en orden
desde la pestaña **SQL** o **Importar**:

| Script | Crea |
| --- | --- |
| `database/schema.sql` | `contactos` (mensajes del formulario) |
| `database/002_visitas_admin.sql` | `visitas`, `admin_usuarios`, `admin_intentos` |

Los scripts solo crean tablas nuevas; no tocan las demás tablas de la base.

## Publicar

1. **Credenciales MySQL:** copiar `public/api/config.example.php` como `config.production.php`
   en la raíz del proyecto y completarlo (base, usuario, clave, avisos por correo y código de
   instalación del panel).
2. **Credenciales FTP:** copiar `.env.deploy.example` como `.env.deploy` y completarlo.
3. Publicar:

   ```bash
   npm run deploy
   ```

   Compila, sube `dist/` por FTP y sube `config.production.php` como `api/config.php`.
4. Verificar abriendo `https://dehotel.cl/api/salud.php` → debe responder `{"ok":true,"db":true}`.

## Panel de administración (`/admin/`)

- **Primer ingreso:** si no hay administradores, el panel muestra «Configuración inicial» y pide
  el `codigo_instalacion` de `config.production.php`. Después de crear el primer administrador
  esa pantalla deja de estar disponible.
- **Claves:** se guardan con `password_hash()` (bcrypt); nunca en texto plano.
- **Sesión:** cookie `HttpOnly` + `SameSite=Strict` (y `Secure` en HTTPS), válida solo en
  `/api/admin/`; expira tras 8 h sin uso.
- **Fuerza bruta:** 5 intentos fallidos desde una IP la bloquean por 15 minutos (tabla `admin_intentos`).
- **Visitas del administrador:** al ingresar al panel, ese navegador deja de contarse como visita.
- **Módulos:** se definen en `src/admin/Panel.jsx`. Clientes, Productos y Facturación aparecen
  como «Pronto» hasta construirlos.

## Conteo de visitas

`src/visitas.js` llama a `/api/visita.php` al abrir la landing. Se guarda fecha/hora (hora de Chile),
IP, un id anónimo del navegador (para distinguir visitantes nuevos de recurrentes), el sitio de origen,
`utm_source` si viene en el enlace, y dispositivo/navegador/sistema. No se cuentan bots ni vistas
previas de enlaces (Google, WhatsApp, etc.). En el sitio no se muestra ningún contador.

Para medir campañas, compartir enlaces con `?utm_source=`, por ejemplo
`https://dehotel.cl/?utm_source=linkedin`.

## Desarrollo local

```bash
npm install
npm run api    # API PHP en http://localhost:8000 (usa el php del PATH, ej. el de WAMP)
npm run dev    # sitio en http://localhost:5180 y panel en http://localhost:5180/admin/
```

Para probar con base de datos, crear `public/api/config.php` (desde `config.example.php`)
apuntando a un MySQL local con las tablas creadas. `config.php` se excluye automáticamente del build.

## Dónde se edita cada cosa

| Qué | Archivo |
| --- | --- |
| Textos, servicios, proceso, proyectos, cifras, contacto e imágenes | `src/data/contenido.js` |
| Colores y tipografías del sitio | variables al inicio de `src/styles.css` |
| Estilos del panel | `src/admin/admin.css` |
| Logo, favicon e imagen para compartir en redes | `scripts/generar-logo.mjs` → `npm run logo` |
| Título y descripción para buscadores | `index.html` |
| API | `public/api/` |

Los valores marcados con `// EJEMPLO` en `contenido.js` son de relleno. Las fotos
actuales son de stock (Unsplash); para usar fotos propias, cópialas a `public/img/`
y usa rutas como `"/img/proyecto-1.jpg"`.

## Archivos con credenciales (no se versionan)

`.env.deploy`, `config.production.php` y `public/api/config.php` están en `.gitignore`.

## Mensajes recibidos

Quedan en la tabla `contactos` (campo `estado`: nuevo / contactado / descartado) y llega
un aviso por correo a la casilla configurada en `notificaciones`.

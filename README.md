# dehotel.cl — Landing page

Sitio público de dehotel.cl: portada, servicios (desarrollo de aplicaciones,
interfaces, integraciones, etc.), proceso de trabajo, proyectos y contacto.

- **Frontend:** React + Vite. Se compila a archivos estáticos (`dist/`).
- **API:** PHP + PDO (`public/api/`), guarda los mensajes de contacto en **MySQL**.
  Funciona en cualquier hosting compartido con PHP 7.4+ y MySQL (no requiere Node en el servidor).
- **Base de datos:** esquema en `database/schema.sql`.

## Estructura en el servidor

Todo el contenido de `dist/` va a la carpeta pública del hosting (normalmente `public_html/`):

```
public_html/
├── index.html
├── favicon.svg
├── assets/            ← JS y CSS compilados
└── api/
    ├── .htaccess      ← bloquea el acceso directo a config.php y _db.php
    ├── _db.php
    ├── contacto.php   ← POST del formulario
    ├── salud.php      ← GET: verifica conexión a MySQL
    └── config.php     ← credenciales MySQL del hosting (se crea una sola vez)
```

## Primera publicación

1. **Base de datos:** en phpMyAdmin, seleccionar la base del hosting (`cde100242_dehotel`)
   y ejecutar `database/schema.sql` desde la pestaña **SQL** (pegando el contenido) o **Importar**.
   Solo crea la tabla `contactos`; no toca las demás tablas de la base.
2. **Credenciales MySQL:** copiar `public/api/config.example.php` como `config.production.php`
   en la raíz del proyecto y completar host, base, usuario y contraseña del hosting.
3. **Credenciales FTP:** copiar `.env.deploy.example` como `.env.deploy` y completarlo.
4. Publicar:

   ```bash
   npm run deploy
   ```

   Compila, sube `dist/` por FTP y sube `config.production.php` como `api/config.php`.
5. Verificar abriendo `https://dehotel.cl/api/salud.php` → debe responder `{"ok":true,"db":true}`.

Sin el script también se puede publicar a mano: `npm run build` y subir el contenido de `dist/`
con FileZilla, más `config.production.php` renombrado a `api/config.php`.

## Desarrollo local

```bash
npm install
npm run api    # API PHP en http://localhost:8000 (usa el php del PATH, ej. el de WAMP)
npm run dev    # sitio en http://localhost:5180 (redirige /api a la API PHP)
```

Para que el formulario guarde localmente, crear `public/api/config.php` (desde
`config.example.php`) apuntando a un MySQL local (ej. WAMP) con la tabla creada.
Sin eso, el formulario muestra "No pudimos guardar tu mensaje".
`config.php` se excluye automáticamente del build.

## Dónde se edita cada cosa

| Qué | Archivo |
| --- | --- |
| Textos, servicios, proceso, proyectos, cifras, contacto e imágenes | `src/data/contenido.js` |
| Colores y tipografías | variables al inicio de `src/styles.css` |
| Logo (hoy es texto provisorio) | `src/components/Logo.jsx` y `public/favicon.svg` |
| Título y descripción para buscadores | `index.html` |
| API del formulario | `public/api/contacto.php` |

Los valores marcados con `// EJEMPLO` en `contenido.js` son de relleno. Las fotos
actuales son de stock (Unsplash); para usar fotos propias, cópialas a `public/img/`
y usa rutas como `"/img/proyecto-1.jpg"`.

## Archivos con credenciales (no se versionan)

`.env.deploy`, `config.production.php` y `public/api/config.php` están en `.gitignore`.

## Mensajes recibidos

Quedan en la tabla `contactos` (campo `estado`: nuevo / contactado / descartado).
Por ahora se revisan desde phpMyAdmin; más adelante se puede agregar un aviso por
correo o un pequeño panel de administración.

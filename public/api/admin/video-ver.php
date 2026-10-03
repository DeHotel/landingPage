<?php
// GET /api/admin/video-ver.php?id=N                → reproduce el video (con soporte de Range)
// GET /api/admin/video-ver.php?id=N&portada=1      → miniatura JPEG
// GET /api/admin/video-ver.php?id=N&descargar=1    → descarga con el nombre del video
// Solo con sesión de administrador: los archivos están fuera de public_html.
require __DIR__ . '/_videos.php';

soloMetodo('GET');
requiereAdmin();
liberarSesion(); // un video puede durar mucho: no bloquear el resto del panel

try {
    $v = buscarVideo((int) ($_GET['id'] ?? 0));
} catch (Throwable $e) {
    error_log('dehotel admin/video-ver: ' . $e->getMessage());
    responder(500, ['error' => 'No se pudo abrir el video.']);
}
if (!$v) {
    responder(404, ['error' => 'El video no existe.']);
}

enviarArchivoVideo($v, !empty($_GET['portada']), !empty($_GET['descargar']));

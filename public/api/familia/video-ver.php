<?php
// GET /api/familia/video-ver.php?id=N[&portada=1] → reproduce un video visible para la familia.
require __DIR__ . '/_familia.php';

soloMetodo('GET');
try {
    requiereFamilia();
    $v = buscarVideo((int) ($_GET['id'] ?? 0));
} catch (Throwable $e) {
    errorFamilia($e, 'video-ver');
}
if (!$v || !(int) $v['visible_familia']) {
    responder(404, ['error' => 'El video no existe.']);
}

enviarArchivoVideo($v, !empty($_GET['portada']));

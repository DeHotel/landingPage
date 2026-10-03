<?php
// GET /api/familia/videos.php → videos visibles para la familia (solo lectura) y sus grupos.
require __DIR__ . '/_familia.php';

soloMetodo('GET');
try {
    requiereFamilia();
    $lista = db()->query(
        "SELECT * FROM videos WHERE estado = 'listo' AND visible_familia = 1 ORDER BY creado_en DESC, id DESC"
    )->fetchAll();
    responder(200, [
        // Solo grupos que tengan al menos un video visible.
        'grupos' => array_values(array_filter(listarGrupos(true), fn ($g) => $g['cantidad'] > 0)),
        'videos' => array_map(fn ($v) => [
            'id' => (int) $v['id'],
            'nombre' => $v['nombre'],
            'grupo_id' => isset($v['grupo_id']) ? (int) $v['grupo_id'] : null,
            'duracion' => $v['duracion'] !== null ? (int) $v['duracion'] : null,
            'portada' => (bool) $v['tiene_portada'],
            'creado_en' => $v['creado_en'],
        ], $lista),
    ]);
} catch (Throwable $e) {
    errorFamilia($e, 'videos');
}

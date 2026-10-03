<?php
// /api/admin/videos.php
//   GET                                      → videos, grupos, límites de subida y espacio usado
//   POST {accion:'renombrar', id, nombre}    → cambia el nombre
//   POST {accion:'visibilidad', id, visible} → si la familia lo ve en /familia/
//   POST {accion:'mover', id, grupo_id}      → lo mueve a un grupo (null = "Sin grupo")
//   POST {accion:'eliminar', id}             → borra el video y sus archivos
require __DIR__ . '/_videos.php';

requiereAdmin();

try {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        limpiarSubidasAbandonadas();
        $lista = db()->query("SELECT * FROM videos WHERE estado = 'listo' ORDER BY creado_en DESC, id DESC")->fetchAll();
        $usado = array_sum(array_map(fn ($v) => (int) $v['tamano'], $lista));
        $carpeta = carpetaVideos();
        $libre = @disk_free_space($carpeta);
        responder(200, [
            'videos' => array_map('videoPublico', $lista),
            'grupos' => listarGrupos(),
            'limites' => limitesSubida(),
            'espacio' => ['usado' => $usado, 'libre' => $libre === false ? null : (int) $libre],
        ]);
    }

    $body = requiereJson();
    $id = (int) ($body['id'] ?? 0);
    $v = buscarVideo($id);
    if (!$v) {
        responder(404, ['error' => 'El video no existe.']);
    }

    switch ($body['accion'] ?? '') {
        case 'renombrar':
            $nombre = limpiar($body['nombre'] ?? '', 150);
            if ($nombre === '') {
                responder(400, ['error' => 'El nombre no puede quedar vacío.']);
            }
            db()->prepare('UPDATE videos SET nombre = ? WHERE id = ?')->execute([$nombre, $id]);
            responder(200, ['video' => videoPublico(array_merge($v, ['nombre' => $nombre]))]);
            // no break
        case 'visibilidad':
            $visible = !empty($body['visible']);
            db()->prepare('UPDATE videos SET visible_familia = ? WHERE id = ?')->execute([$visible ? 1 : 0, $id]);
            responder(200, ['video' => videoPublico(array_merge($v, ['visible_familia' => $visible ? 1 : 0]))]);
            // no break
        case 'mover':
            $grupo = grupoValido($body['grupo_id'] ?? null);
            db()->prepare('UPDATE videos SET grupo_id = ? WHERE id = ?')->execute([$grupo, $id]);
            responder(200, ['video' => videoPublico(array_merge($v, ['grupo_id' => $grupo]))]);
            // no break
        case 'eliminar':
            borrarArchivosVideo($v);
            db()->prepare('DELETE FROM videos WHERE id = ?')->execute([$id]);
            responder(200, ['ok' => true]);
            // no break
        default:
            responder(400, ['error' => 'Acción no válida.']);
    }
} catch (PDOException $e) {
    error_log('dehotel admin/videos: ' . $e->getMessage());
    responder(500, ['error' => mensajeFaltaSql($e, 'No se pudieron cargar los videos.')]);
} catch (Throwable $e) {
    error_log('dehotel admin/videos: ' . $e->getMessage());
    responder(500, ['error' => 'No se pudieron cargar los videos: ' . $e->getMessage()]);
}

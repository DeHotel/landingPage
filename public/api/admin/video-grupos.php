<?php
// /api/admin/video-grupos.php — grupos de videos.
//   POST {accion:'crear', nombre}         → {grupo}
//   POST {accion:'renombrar', id, nombre} → {grupo}
//   POST {accion:'eliminar', id}          → sus videos quedan "Sin grupo"
// Siempre responde también la lista actualizada de grupos.
require __DIR__ . '/_videos.php';

requiereAdmin();
$body = requiereJson();

function nombreGrupo(array $body): string
{
    $nombre = limpiar($body['nombre'] ?? '', 80);
    if ($nombre === '') {
        responder(400, ['error' => 'Escribe un nombre para el grupo.']);
    }
    return $nombre;
}

try {
    switch ($body['accion'] ?? '') {
        case 'crear':
            $nombre = nombreGrupo($body);
            db()->prepare('INSERT INTO video_grupos (nombre) VALUES (?)')->execute([$nombre]);
            responder(201, ['grupo' => ['id' => (int) db()->lastInsertId(), 'nombre' => $nombre, 'cantidad' => 0], 'grupos' => listarGrupos()]);
            // no break
        case 'renombrar':
            $id = grupoValido($body['id'] ?? null);
            if ($id === null) {
                responder(400, ['error' => 'Grupo no válido.']);
            }
            db()->prepare('UPDATE video_grupos SET nombre = ? WHERE id = ?')->execute([nombreGrupo($body), $id]);
            responder(200, ['grupos' => listarGrupos()]);
            // no break
        case 'eliminar':
            $id = grupoValido($body['id'] ?? null);
            if ($id === null) {
                responder(400, ['error' => 'Grupo no válido.']);
            }
            // Explícito (además de la clave foránea) por si el hosting no aplica ON DELETE SET NULL.
            db()->prepare('UPDATE videos SET grupo_id = NULL WHERE grupo_id = ?')->execute([$id]);
            db()->prepare('DELETE FROM video_grupos WHERE id = ?')->execute([$id]);
            responder(200, ['grupos' => listarGrupos()]);
            // no break
        default:
            responder(400, ['error' => 'Acción no válida.']);
    }
} catch (PDOException $e) {
    error_log('dehotel admin/video-grupos: ' . $e->getMessage());
    // 23000 = nombre duplicado (índice único).
    responder($e->getCode() === '23000' ? 409 : 500, ['error' => $e->getCode() === '23000'
        ? 'Ya existe un grupo con ese nombre.'
        : mensajeFaltaSql($e, 'No se pudo guardar el grupo.')]);
} catch (Throwable $e) {
    error_log('dehotel admin/video-grupos: ' . $e->getMessage());
    responder(500, ['error' => 'No se pudo guardar el grupo.']);
}

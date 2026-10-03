<?php
// Subida de videos por trozos (el hosting limita el tamaño de cada envío).
//   POST ?accion=iniciar   JSON {nombre, tamano, extension, duracion?, ancho?, alto?, visible_familia?, grupo_id?} → {id, parte}
//   POST ?accion=parte&id=N&desde=BYTES   cuerpo binario (application/octet-stream)  → {recibido}
//   POST ?accion=portada&id=N             cuerpo JPEG (image/jpeg)                   → {ok}
//   POST ?accion=terminar  JSON {id}                                                 → {video}
//   POST ?accion=cancelar  JSON {id}                                                 → {ok}
require __DIR__ . '/_videos.php';

soloMetodo('POST');
$usuario = requiereAdmin();
liberarSesion(); // las partes pueden tardar: no bloquear el resto del panel
set_time_limit(300);

function tipoContenido(string $esperado): void
{
    if (stripos($_SERVER['CONTENT_TYPE'] ?? '', $esperado) !== 0) {
        responder(415, ['error' => 'Formato no soportado.']);
    }
}

// Firma del archivo: confirma que de verdad es un video (MP4/MOV, WebM u Ogg).
function pareceVideo(string $ruta): bool
{
    $f = fopen($ruta, 'rb');
    $cabecera = $f ? fread($f, 12) : '';
    if ($f) {
        fclose($f);
    }
    return strlen($cabecera) === 12 && (
        substr($cabecera, 4, 4) === 'ftyp'              // MP4, M4V, MOV
        || substr($cabecera, 0, 4) === "\x1A\x45\xDF\xA3" // WebM / Matroska
        || substr($cabecera, 0, 4) === 'OggS'             // Ogg
    );
}

$accion = $_GET['accion'] ?? '';

try {
    switch ($accion) {
        case 'iniciar':
            tipoContenido('application/json');
            $b = leerJson();
            $nombre = limpiar($b['nombre'] ?? '', 150);
            $ext = strtolower(limpiar($b['extension'] ?? '', 5));
            $tamano = (int) ($b['tamano'] ?? 0);
            $limites = limitesSubida();

            if ($nombre === '') {
                responder(400, ['error' => 'Ponle un nombre al video.']);
            }
            if (!isset(VIDEO_TIPOS[$ext])) {
                responder(400, ['error' => 'Formato no permitido. Usa MP4, WebM o MOV.']);
            }
            if ($tamano <= 0 || $tamano > $limites['maximo']) {
                responder(400, ['error' => 'El video supera el tamaño máximo permitido (' . round($limites['maximo'] / 1073741824, 1) . ' GB).']);
            }
            $libre = @disk_free_space(carpetaVideos());
            if ($libre !== false && $libre < $tamano * 1.05) {
                responder(507, ['error' => 'No queda espacio suficiente en el hosting para este video.']);
            }

            $entero = fn ($k, $max) => isset($b[$k]) && is_numeric($b[$k]) && $b[$k] > 0 ? min((int) round($b[$k]), $max) : null;
            $v = [
                'archivo' => bin2hex(random_bytes(16)),
                'extension' => $ext,
            ];
            $grupo = grupoValido($b['grupo_id'] ?? null); // antes de crear el archivo temporal
            touch(rutaVideo($v, true));
            db()->prepare(
                'INSERT INTO videos (nombre, grupo_id, archivo, extension, mime, tamano, duracion, ancho, alto, visible_familia, subido_por)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
            )->execute([
                $nombre, $grupo, $v['archivo'], $ext, VIDEO_TIPOS[$ext], $tamano,
                $entero('duracion', 4294967295), $entero('ancho', 65535), $entero('alto', 65535),
                array_key_exists('visible_familia', $b) && !$b['visible_familia'] ? 0 : 1,
                $usuario['id'],
            ]);
            responder(201, ['id' => (int) db()->lastInsertId(), 'parte' => $limites['parte']]);
            // no break

        case 'parte':
            tipoContenido('application/octet-stream');
            $v = buscarVideo((int) ($_GET['id'] ?? 0), 'subiendo');
            if (!$v) {
                responder(404, ['error' => 'La subida no existe o ya terminó.']);
            }
            $desde = (int) ($_GET['desde'] ?? -1);
            if ($desde !== (int) $v['recibido']) {
                // El cliente usa "recibido" para retomar desde el punto correcto.
                responder(409, ['error' => 'Desfase en la subida.', 'recibido' => (int) $v['recibido']]);
            }

            $ruta = rutaVideo($v, true);
            $entrada = fopen('php://input', 'rb');
            $salida = fopen($ruta, 'ab');
            $limite = limitesSubida()['parte'] + 1024;
            $copiados = stream_copy_to_stream($entrada, $salida, $limite);
            fclose($entrada);
            fclose($salida);
            clearstatcache(true, $ruta);

            $nuevo = $desde + (int) $copiados;
            if ($copiados === false || $copiados === 0 || $nuevo > (int) $v['tamano'] || filesize($ruta) !== $nuevo) {
                // Se deshace lo escrito para mantener el archivo consistente.
                $f = fopen($ruta, 'r+b');
                ftruncate($f, $desde);
                fclose($f);
                responder(400, ['error' => 'El trozo llegó incompleto. Se reintentará.', 'recibido' => $desde]);
            }
            db()->prepare('UPDATE videos SET recibido = ? WHERE id = ?')->execute([$nuevo, $v['id']]);
            responder(200, ['recibido' => $nuevo]);
            // no break

        case 'portada':
            tipoContenido('image/jpeg');
            $v = buscarVideo((int) ($_GET['id'] ?? 0), null);
            if (!$v) {
                responder(404, ['error' => 'El video no existe.']);
            }
            $jpg = file_get_contents('php://input', false, null, 0, VIDEO_PORTADA_MAX + 1);
            if ($jpg === false || strlen($jpg) > VIDEO_PORTADA_MAX || substr($jpg, 0, 3) !== "\xFF\xD8\xFF") {
                responder(400, ['error' => 'Miniatura no válida.']);
            }
            file_put_contents(rutaPortada($v), $jpg);
            db()->prepare('UPDATE videos SET tiene_portada = 1 WHERE id = ?')->execute([$v['id']]);
            responder(200, ['ok' => true]);
            // no break

        case 'terminar':
            tipoContenido('application/json');
            $v = buscarVideo((int) (leerJson()['id'] ?? 0), 'subiendo');
            if (!$v) {
                responder(404, ['error' => 'La subida no existe o ya terminó.']);
            }
            $parcial = rutaVideo($v, true);
            clearstatcache(true, $parcial);
            if ((int) $v['recibido'] !== (int) $v['tamano'] || filesize($parcial) !== (int) $v['tamano']) {
                responder(409, ['error' => 'Faltan partes del video.', 'recibido' => (int) $v['recibido']]);
            }
            if (!pareceVideo($parcial)) {
                borrarArchivosVideo($v);
                db()->prepare('DELETE FROM videos WHERE id = ?')->execute([$v['id']]);
                responder(400, ['error' => 'El archivo no parece un video válido.']);
            }
            rename($parcial, rutaVideo($v));
            db()->prepare("UPDATE videos SET estado = 'listo' WHERE id = ?")->execute([$v['id']]);
            responder(200, ['video' => videoPublico(array_merge($v, ['estado' => 'listo']))]);
            // no break

        case 'cancelar':
            tipoContenido('application/json');
            $v = buscarVideo((int) (leerJson()['id'] ?? 0), 'subiendo');
            if ($v) {
                borrarArchivosVideo($v);
                db()->prepare('DELETE FROM videos WHERE id = ?')->execute([$v['id']]);
            }
            responder(200, ['ok' => true]);
            // no break

        default:
            responder(400, ['error' => 'Acción no válida.']);
    }
} catch (PDOException $e) {
    error_log('dehotel admin/videos-subida: ' . $e->getMessage());
    responder(500, ['error' => mensajeFaltaSql($e, 'Error de base de datos al subir el video.')]);
} catch (Throwable $e) {
    error_log('dehotel admin/videos-subida: ' . $e->getMessage());
    responder(500, ['error' => 'No se pudo subir el video: ' . $e->getMessage()]);
}

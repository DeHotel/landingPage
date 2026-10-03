<?php
// Utilidades del módulo de videos privados.
require_once __DIR__ . '/_auth.php';

const VIDEO_TIPOS = [
    'mp4' => 'video/mp4',
    'm4v' => 'video/mp4',
    'webm' => 'video/webm',
    'mov' => 'video/quicktime',
    'ogv' => 'video/ogg',
];
const VIDEO_PARTE_MAX = 8 * 1024 * 1024;       // tope de cada trozo subido
const VIDEO_PORTADA_MAX = 1024 * 1024;         // miniatura JPEG
const VIDEO_SUBIDA_ABANDONADA_HORAS = 24;

// Carpeta privada: por defecto FUERA de public_html (no tiene URL pública).
// Se puede fijar en config.php → 'videos' → 'carpeta'.
function carpetaVideos(): string
{
    $cfg = config()['videos']['carpeta'] ?? '';
    $carpeta = $cfg !== ''
        ? $cfg
        : dirname(rtrim($_SERVER['DOCUMENT_ROOT'] ?? dirname(__DIR__, 3), '/\\')) . '/dehotel_privado/videos';

    if (!is_dir($carpeta) && !@mkdir($carpeta, 0750, true)) {
        throw new RuntimeException("No se pudo crear la carpeta de videos: $carpeta");
    }
    if (!is_writable($carpeta)) {
        throw new RuntimeException("La carpeta de videos no tiene permisos de escritura: $carpeta");
    }
    // Por si alguna vez se configura dentro de public_html: sin listado ni acceso directo.
    if (!is_file("$carpeta/index.html")) {
        @file_put_contents("$carpeta/index.html", '');
        @file_put_contents("$carpeta/.htaccess", "Require all denied\n");
    }
    return $carpeta;
}

function rutaVideo(array $v, bool $parcial = false): string
{
    return carpetaVideos() . '/' . $v['archivo'] . '.' . $v['extension'] . ($parcial ? '.part' : '');
}

function rutaPortada(array $v): string
{
    return carpetaVideos() . '/' . $v['archivo'] . '.jpg';
}

function iniBytes(string $clave): int
{
    $v = trim((string) ini_get($clave));
    if ($v === '' || $v === '-1' || $v === '0') {
        return PHP_INT_MAX;
    }
    $n = (int) $v;
    switch (strtolower(substr($v, -1))) {
        case 'g': $n *= 1024;
        // no break
        case 'm': $n *= 1024;
        // no break
        case 'k': $n *= 1024;
    }
    return $n;
}

// Tamaño de cada trozo: lo que permita el hosting (post_max_size) con margen, hasta 8 MB.
function limitesSubida(): array
{
    $parte = min(VIDEO_PARTE_MAX, (int) (iniBytes('post_max_size') * 0.9));
    $maxMb = (int) (config()['videos']['max_mb'] ?? 4096);
    return ['parte' => max(256 * 1024, $parte), 'maximo' => $maxMb * 1024 * 1024];
}

function buscarVideo(int $id, ?string $estado = 'listo'): ?array
{
    $sql = 'SELECT * FROM videos WHERE id = ?' . ($estado ? ' AND estado = ?' : '');
    $st = db()->prepare($sql);
    $st->execute($estado ? [$id, $estado] : [$id]);
    $v = $st->fetch();
    return $v ?: null;
}

function borrarArchivosVideo(array $v): void
{
    foreach ([rutaVideo($v), rutaVideo($v, true), rutaPortada($v)] as $f) {
        if (is_file($f)) {
            @unlink($f);
        }
    }
}

// Subidas que quedaron a medias (se cerró la pestaña, se cortó internet…).
function limpiarSubidasAbandonadas(): void
{
    $st = db()->query(
        "SELECT * FROM videos WHERE estado = 'subiendo'
         AND actualizado_en < (NOW() - INTERVAL " . VIDEO_SUBIDA_ABANDONADA_HORAS . ' HOUR)'
    );
    foreach ($st->fetchAll() as $v) {
        borrarArchivosVideo($v);
        db()->prepare('DELETE FROM videos WHERE id = ?')->execute([$v['id']]);
    }
}

function videoPublico(array $v): array
{
    return [
        'id' => (int) $v['id'],
        'nombre' => $v['nombre'],
        'extension' => $v['extension'],
        'tamano' => (int) $v['tamano'],
        'duracion' => $v['duracion'] !== null ? (int) $v['duracion'] : null,
        'ancho' => $v['ancho'] !== null ? (int) $v['ancho'] : null,
        'alto' => $v['alto'] !== null ? (int) $v['alto'] : null,
        'portada' => (bool) $v['tiene_portada'],
        'visible_familia' => (bool) ($v['visible_familia'] ?? true),
        'grupo_id' => isset($v['grupo_id']) ? (int) $v['grupo_id'] : null,
        'creado_en' => $v['creado_en'],
    ];
}

// Grupos con la cantidad de videos (todos, o solo los visibles para la familia).
function listarGrupos(bool $soloFamilia = false): array
{
    $filtro = $soloFamilia ? 'AND v.visible_familia = 1' : '';
    $filas = db()->query(
        "SELECT g.id, g.nombre, COUNT(v.id) AS cantidad
         FROM video_grupos g
         LEFT JOIN videos v ON v.grupo_id = g.id AND v.estado = 'listo' $filtro
         GROUP BY g.id, g.nombre
         ORDER BY g.nombre"
    )->fetchAll();
    return array_map(fn ($g) => ['id' => (int) $g['id'], 'nombre' => $g['nombre'], 'cantidad' => (int) $g['cantidad']], $filas);
}

// Id de grupo recibido del navegador: null = "Sin grupo"; si no existe, error 400.
function grupoValido($valor): ?int
{
    if ($valor === null || $valor === '' || (int) $valor === 0) {
        return null;
    }
    $st = db()->prepare('SELECT id FROM video_grupos WHERE id = ?');
    $st->execute([(int) $valor]);
    $id = $st->fetchColumn();
    if ($id === false) {
        responder(400, ['error' => 'Ese grupo ya no existe. Recarga la página.']);
    }
    return (int) $id;
}

// Mensaje claro si falta ejecutar algún script SQL (tabla o columna inexistente).
function mensajeFaltaSql(PDOException $e, string $porDefecto): string
{
    if ($e->getCode() === '42S02' || $e->getCode() === '42S22') {
        return 'Falta actualizar la base de datos: ejecuta en phpMyAdmin los scripts pendientes de la carpeta database/ (003, 004 y 005).';
    }
    return $porDefecto;
}

/**
 * Envía el video (o su miniatura) al navegador, con soporte de Range para que el
 * reproductor pueda adelantar/retroceder sin descargar todo. Lo usan el panel y /familia/.
 */
function enviarArchivoVideo(array $v, bool $portada = false, bool $descargar = false): void
{
    $ruta = $portada ? rutaPortada($v) : rutaVideo($v);
    if (!is_file($ruta)) {
        responder(404, ['error' => $portada ? 'El video no tiene miniatura.' : 'No se encontró el archivo del video.']);
    }

    $tamano = filesize($ruta);
    $modificado = filemtime($ruta);
    $etag = '"' . $v['archivo'] . '-' . $tamano . '-' . $modificado . '"';

    // Sin buffers ni compresión: el archivo se envía tal cual, por partes.
    while (ob_get_level()) {
        ob_end_clean();
    }
    if (function_exists('apache_setenv')) {
        @apache_setenv('no-gzip', '1');
    }
    @ini_set('zlib.output_compression', '0');
    set_time_limit(0);

    header_remove('Cache-Control');
    header('Content-Type: ' . ($portada ? 'image/jpeg' : $v['mime']));
    header('Cache-Control: private, max-age=86400');
    header('ETag: ' . $etag);
    header('Last-Modified: ' . gmdate('D, d M Y H:i:s', $modificado) . ' GMT');
    header('Accept-Ranges: bytes');
    header('X-Content-Type-Options: nosniff');

    if ($descargar && !$portada) {
        $limpio = trim(preg_replace('/[^\p{L}\p{N} ._-]+/u', '', $v['nombre'])) ?: 'video';
        $nombre = $limpio . '.' . $v['extension'];
        // filename = versión ASCII para navegadores antiguos; filename* = nombre real con tildes.
        $ascii = function_exists('iconv') ? @iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $nombre) : false;
        $ascii = preg_replace('/[^A-Za-z0-9 ._-]+/', '', $ascii ?: $nombre) ?: 'video.' . $v['extension'];
        header('Content-Disposition: attachment; filename="' . $ascii . '"; filename*=UTF-8\'\'' . rawurlencode($nombre));
    }

    if (($_SERVER['HTTP_IF_NONE_MATCH'] ?? '') === $etag) {
        http_response_code(304);
        exit;
    }

    // Rango pedido por el reproductor ("bytes=inicio-fin").
    $inicio = 0;
    $fin = $tamano - 1;
    if (!$portada && preg_match('/^bytes=(\d*)-(\d*)$/', $_SERVER['HTTP_RANGE'] ?? '', $m)) {
        if ($m[1] === '' && $m[2] !== '') {        // últimos N bytes
            $inicio = max(0, $tamano - (int) $m[2]);
        } else {
            $inicio = (int) $m[1];
            if ($m[2] !== '') {
                $fin = min((int) $m[2], $tamano - 1);
            }
        }
        if ($inicio > $fin || $inicio >= $tamano) {
            http_response_code(416);
            header("Content-Range: bytes */$tamano");
            exit;
        }
        http_response_code(206);
        header("Content-Range: bytes $inicio-$fin/$tamano");
    }

    $largo = $fin - $inicio + 1;
    header('Content-Length: ' . $largo);

    $f = fopen($ruta, 'rb');
    fseek($f, $inicio);
    $pendiente = $largo;
    while ($pendiente > 0 && !feof($f) && !connection_aborted()) {
        $bloque = fread($f, (int) min(1024 * 1024, $pendiente));
        if ($bloque === false || $bloque === '') {
            break;
        }
        echo $bloque;
        flush();
        $pendiente -= strlen($bloque);
    }
    fclose($f);
    exit;
}

// Para descargas/streaming: libera la sesión (PHP la bloquea mientras dura la petición,
// y un video largo dejaría el resto del panel esperando).
function liberarSesion(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        session_write_close();
    }
}

<?php
// /api/admin/documento-archivo.php — PDF (o imagen) del documento emitido en el SII.
//   POST ?id=N  cuerpo binario (application/pdf, image/jpeg, image/png) + cabecera X-Nombre-Archivo
//   POST {accion:'quitar', id}
//   GET  ?id=N[&descargar=1]
// Se guarda en la carpeta privada (fuera de public_html); solo con sesión de administrador.
require __DIR__ . '/_facturacion.php';
require_once __DIR__ . '/_videos.php'; // iniBytes(), liberarSesion()

requiereAdmin();

const DOC_ARCHIVO_TIPOS = ['application/pdf' => 'pdf', 'image/jpeg' => 'jpg', 'image/png' => 'png'];

function documentoConArchivo(int $id): array
{
    $st = db()->prepare('SELECT id, tipo, numero, archivo, archivo_nombre FROM documentos WHERE id = ?');
    $st->execute([$id]);
    $d = $st->fetch();
    if (!$d) {
        responder(404, ['error' => 'El documento no existe.']);
    }
    return $d;
}

try {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $d = documentoConArchivo((int) ($_GET['id'] ?? 0));
        $ruta = $d['archivo'] ? carpetaDocumentos() . '/' . $d['archivo'] : '';
        if (!$ruta || !is_file($ruta)) {
            responder(404, ['error' => 'Este documento no tiene archivo adjunto.']);
        }
        liberarSesion();
        while (ob_get_level()) {
            ob_end_clean();
        }
        $ext = pathinfo($d['archivo'], PATHINFO_EXTENSION);
        $mime = array_search($ext, DOC_ARCHIVO_TIPOS, true) ?: 'application/octet-stream';
        $nombre = $d['archivo_nombre'] ?: codigoDocumento($d['tipo'], (int) $d['numero']) . ".$ext";
        $ascii = preg_replace('/[^A-Za-z0-9 ._-]+/', '', (function_exists('iconv') ? @iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $nombre) : '') ?: '') ?: "documento.$ext";
        header_remove('Cache-Control');
        header("Content-Type: $mime");
        header('Content-Length: ' . filesize($ruta));
        header('Cache-Control: private, max-age=3600');
        header('X-Content-Type-Options: nosniff');
        header('Content-Disposition: ' . (!empty($_GET['descargar']) ? 'attachment' : 'inline') . '; filename="' . $ascii . '"; filename*=UTF-8\'\'' . rawurlencode($nombre));
        readfile($ruta);
        exit;
    }

    soloMetodo('POST');
    $tipo = strtolower(trim(explode(';', $_SERVER['CONTENT_TYPE'] ?? '')[0]));
    if ($tipo === 'application/json') {
        $body = leerJson();
        $d = documentoConArchivo((int) ($body['id'] ?? 0));
        db()->prepare('UPDATE documentos SET archivo = NULL, archivo_nombre = NULL WHERE id = ?')->execute([$d['id']]);
        borrarArchivoDocumento($d['archivo']);
        responder(200, ['ok' => true]);
    }
    if (!isset(DOC_ARCHIVO_TIPOS[$tipo])) {
        responder(415, ['error' => 'Adjunta el PDF que entrega el SII (o una imagen JPG/PNG).']);
    }
    $d = documentoConArchivo((int) ($_GET['id'] ?? 0));
    $limite = min(DOC_ARCHIVO_MAX, (int) (iniBytes('post_max_size') * 0.95));
    $datos = file_get_contents('php://input', false, null, 0, $limite + 1);
    if ($datos === false || $datos === '' || strlen($datos) > $limite) {
        responder(413, ['error' => 'El archivo está vacío o es muy grande (máximo ' . round($limite / 1048576, 1) . ' MB).']);
    }
    $firma = substr($datos, 0, 4);
    $valido = ($tipo === 'application/pdf' && $firma === '%PDF')
        || ($tipo === 'image/jpeg' && strncmp($firma, "\xFF\xD8\xFF", 3) === 0)
        || ($tipo === 'image/png' && $firma === "\x89PNG");
    if (!$valido) {
        responder(400, ['error' => 'El archivo no corresponde al formato indicado.']);
    }
    $archivo = bin2hex(random_bytes(16)) . '.' . DOC_ARCHIVO_TIPOS[$tipo];
    file_put_contents(carpetaDocumentos() . '/' . $archivo, $datos);
    $nombre = limpiar(rawurldecode($_SERVER['HTTP_X_NOMBRE_ARCHIVO'] ?? ''), 150) ?: $archivo;
    db()->prepare('UPDATE documentos SET archivo = ?, archivo_nombre = ? WHERE id = ?')->execute([$archivo, $nombre, $d['id']]);
    borrarArchivoDocumento($d['archivo']);
    responder(200, ['ok' => true, 'archivo_nombre' => $nombre]);
} catch (Throwable $e) {
    errorFacturacion($e, 'documento-archivo', 'No se pudo procesar el archivo: ' . $e->getMessage());
}

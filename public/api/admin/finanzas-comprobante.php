<?php
// /api/admin/finanzas-comprobante.php — comprobante (foto o PDF) de un movimiento.
//   POST ?id=N   cuerpo binario (image/jpeg, image/png, image/webp o application/pdf),
//                cabecera X-Nombre-Archivo con el nombre original (codificado)  → sube o reemplaza
//   POST {accion:'quitar', id}                                                   → lo borra
//   GET  ?id=N[&descargar=1]                                                     → lo muestra
// Los archivos quedan en la carpeta privada (fuera de public_html); solo con sesión.
require __DIR__ . '/_finanzas.php';
require_once __DIR__ . '/_videos.php'; // iniBytes()

requiereAdmin();

function buscarMovimiento(int $id): array
{
    $st = db()->prepare('SELECT id, comprobante, comprobante_nombre, comprobante_mime FROM fin_movimientos WHERE id = ?');
    $st->execute([$id]);
    $m = $st->fetch();
    if (!$m) {
        responder(404, ['error' => 'El movimiento no existe.']);
    }
    return $m;
}

// Firma real del archivo (no basta con la extensión).
function firmaValida(string $inicio, string $mime): bool
{
    switch ($mime) {
        case 'image/jpeg': return strncmp($inicio, "\xFF\xD8\xFF", 3) === 0;
        case 'image/png': return strncmp($inicio, "\x89PNG", 4) === 0;
        case 'image/webp': return strncmp($inicio, 'RIFF', 4) === 0 && substr($inicio, 8, 4) === 'WEBP';
        case 'application/pdf': return strncmp($inicio, '%PDF', 4) === 0;
    }
    return false;
}

try {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $m = buscarMovimiento((int) ($_GET['id'] ?? 0));
        $ruta = $m['comprobante'] ? carpetaComprobantes() . '/' . $m['comprobante'] : '';
        if (!$ruta || !is_file($ruta)) {
            responder(404, ['error' => 'Este movimiento no tiene comprobante.']);
        }
        liberarSesion();
        while (ob_get_level()) {
            ob_end_clean();
        }
        $nombre = $m['comprobante_nombre'] ?: 'comprobante.' . pathinfo($m['comprobante'], PATHINFO_EXTENSION);
        $ascii = preg_replace('/[^A-Za-z0-9 ._-]+/', '', (function_exists('iconv') ? @iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $nombre) : '') ?: '') ?: 'comprobante';
        header_remove('Cache-Control');
        header('Content-Type: ' . $m['comprobante_mime']);
        header('Content-Length: ' . filesize($ruta));
        header('Cache-Control: private, max-age=3600');
        header('X-Content-Type-Options: nosniff');
        header('Content-Disposition: ' . (!empty($_GET['descargar']) ? 'attachment' : 'inline')
            . '; filename="' . $ascii . '"; filename*=UTF-8\'\'' . rawurlencode($nombre));
        readfile($ruta);
        exit;
    }

    soloMetodo('POST');
    $tipo = strtolower(trim(explode(';', $_SERVER['CONTENT_TYPE'] ?? '')[0]));

    if ($tipo === 'application/json') {
        $body = leerJson();
        if (($body['accion'] ?? '') !== 'quitar') {
            responder(400, ['error' => 'Acción no válida.']);
        }
        $m = buscarMovimiento((int) ($body['id'] ?? 0));
        db()->prepare('UPDATE fin_movimientos SET comprobante = NULL, comprobante_nombre = NULL, comprobante_mime = NULL WHERE id = ?')->execute([$m['id']]);
        borrarComprobante($m['comprobante']);
        responder(200, ['ok' => true]);
    }

    if (!isset(FIN_COMPROBANTE_TIPOS[$tipo])) {
        responder(415, ['error' => 'Formato no permitido: usa una foto (JPG, PNG, WebP) o un PDF.']);
    }
    $m = buscarMovimiento((int) ($_GET['id'] ?? 0));
    $limite = min(FIN_COMPROBANTE_MAX, (int) (iniBytes('post_max_size') * 0.95));
    $datos = file_get_contents('php://input', false, null, 0, $limite + 1);
    if ($datos === false || $datos === '') {
        responder(400, ['error' => 'El archivo llegó vacío.']);
    }
    if (strlen($datos) > $limite) {
        responder(413, ['error' => 'El archivo es muy grande (máximo ' . round($limite / 1048576, 1) . ' MB).']);
    }
    if (!firmaValida(substr($datos, 0, 12), $tipo)) {
        responder(400, ['error' => 'El archivo no corresponde al formato indicado.']);
    }

    $archivo = bin2hex(random_bytes(16)) . '.' . FIN_COMPROBANTE_TIPOS[$tipo];
    file_put_contents(carpetaComprobantes() . '/' . $archivo, $datos);
    $nombre = limpiar(rawurldecode($_SERVER['HTTP_X_NOMBRE_ARCHIVO'] ?? ''), 150) ?: 'comprobante.' . FIN_COMPROBANTE_TIPOS[$tipo];
    db()->prepare('UPDATE fin_movimientos SET comprobante = ?, comprobante_nombre = ?, comprobante_mime = ? WHERE id = ?')
        ->execute([$archivo, $nombre, $tipo, $m['id']]);
    borrarComprobante($m['comprobante']); // el anterior, si lo había
    responder(200, ['ok' => true, 'comprobante_nombre' => $nombre, 'comprobante_mime' => $tipo]);
} catch (Throwable $e) {
    errorFinanzas($e, 'finanzas-comprobante', 'No se pudo procesar el comprobante: ' . $e->getMessage());
}

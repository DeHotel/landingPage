<?php
// POST /api/contacto.php — guarda un mensaje del formulario de contacto en MySQL.
require __DIR__ . '/_db.php';
require __DIR__ . '/_correo.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Allow: POST');
    responder(405, ['error' => 'Método no permitido']);
}

$body = json_decode(file_get_contents('php://input') ?: '', true);
if (!is_array($body)) {
    responder(400, ['error' => 'Solicitud inválida.']);
}

// Campo trampa: si viene lleno es un bot. Se responde OK para no darle pistas.
if (!empty($body['website'])) {
    responder(200, ['ok' => true]);
}

function limpiar($valor, int $max): string
{
    if (!is_string($valor)) {
        return '';
    }
    $valor = trim($valor);
    return function_exists('mb_substr') ? mb_substr($valor, 0, $max, 'UTF-8') : substr($valor, 0, $max);
}

$datos = [
    'nombre' => limpiar($body['nombre'] ?? '', 120),
    'empresa' => limpiar($body['empresa'] ?? '', 120),
    'email' => limpiar($body['email'] ?? '', 160),
    'telefono' => limpiar($body['telefono'] ?? '', 40),
    'tema' => limpiar($body['tema'] ?? '', 60),
    'mensaje' => limpiar($body['mensaje'] ?? '', 4000),
];

if ($datos['nombre'] === '' || $datos['email'] === '' || $datos['tema'] === '' || $datos['mensaje'] === '') {
    responder(400, ['error' => 'Completa nombre, correo, tema y mensaje.']);
}
if (!filter_var($datos['email'], FILTER_VALIDATE_EMAIL)) {
    responder(400, ['error' => 'El correo no parece válido.']);
}

$ip = $_SERVER['REMOTE_ADDR'] ?? null;
$userAgent = limpiar($_SERVER['HTTP_USER_AGENT'] ?? '', 255);

try {
    $pdo = db();

    // Límite por IP: máximo 5 mensajes cada 10 minutos.
    $st = $pdo->prepare(
        'SELECT COUNT(*) FROM contactos WHERE ip = ? AND creado_en > (NOW() - INTERVAL 10 MINUTE)'
    );
    $st->execute([$ip]);
    if ((int) $st->fetchColumn() >= 5) {
        responder(429, ['error' => 'Recibimos varios mensajes seguidos. Intenta en unos minutos.']);
    }

    $st = $pdo->prepare(
        'INSERT INTO contactos (nombre, empresa, email, telefono, tema, mensaje, ip, user_agent)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    );
    $st->execute([
        $datos['nombre'],
        $datos['empresa'] !== '' ? $datos['empresa'] : null,
        $datos['email'],
        $datos['telefono'] !== '' ? $datos['telefono'] : null,
        $datos['tema'],
        $datos['mensaje'],
        $ip,
        $userAgent !== '' ? $userAgent : null,
    ]);

    notificarContacto($datos, (int) $pdo->lastInsertId());

    responder(201, ['ok' => true]);
} catch (Throwable $e) {
    error_log('dehotel contacto: ' . $e->getMessage());
    responder(500, ['error' => 'No pudimos guardar tu mensaje en este momento.']);
}

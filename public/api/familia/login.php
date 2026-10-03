<?php
// POST /api/familia/login.php — {clave, recordar}
require __DIR__ . '/_familia.php';

$body = requiereJson();
$clave = is_string($body['clave'] ?? null) ? $body['clave'] : '';
$ip = ipCliente();

try {
    if (!familiaActiva()) {
        responder(403, ['error' => 'El acceso familiar está desactivado por ahora.']);
    }
    if (intentosFamiliaFallidos($ip) >= FAMILIA_INTENTOS_MAX) {
        responder(429, ['error' => 'Demasiados intentos. Espera ' . FAMILIA_INTENTOS_MIN . ' minutos e inténtalo de nuevo.']);
    }

    $ok = password_verify($clave, (string) ajuste('familia_clave_hash'));
    registrarAccesoFamilia($ip, $ok);
    if (!$ok) {
        responder(401, ['error' => 'La clave no es correcta.']);
    }

    emitirAccesoFamilia(!empty($body['recordar']));
    responder(200, ['ok' => true]);
} catch (Throwable $e) {
    errorFamilia($e, 'login');
}

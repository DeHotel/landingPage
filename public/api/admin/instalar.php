<?php
// POST /api/admin/instalar.php — crea el PRIMER administrador. { codigo, nombre, email, clave }
// Solo funciona mientras no exista ningún administrador y exige el código de instalación
// definido en config.php → 'admin' → 'codigo_instalacion'.
require __DIR__ . '/_auth.php';

$body = requiereJson();
$ip = ipCliente();

try {
    if (hayAdministradores()) {
        responder(403, ['error' => 'El panel ya está configurado. Inicia sesión.']);
    }
    if (intentosFallidos($ip) >= INTENTOS_MAX) {
        responder(429, ['error' => 'Demasiados intentos fallidos. Espera ' . INTENTOS_VENTANA_MIN . ' minutos.']);
    }

    $esperado = (string) (config()['admin']['codigo_instalacion'] ?? '');
    $codigo = is_string($body['codigo'] ?? null) ? trim($body['codigo']) : '';
    if (strlen($esperado) < 16 || !hash_equals($esperado, $codigo)) {
        registrarIntento($ip, 'instalacion', false);
        responder(403, ['error' => 'El código de instalación no es correcto.']);
    }

    $nombre = limpiar($body['nombre'] ?? '', 120);
    $email = strtolower(limpiar($body['email'] ?? '', 160));
    $clave = is_string($body['clave'] ?? null) ? $body['clave'] : '';

    if ($nombre === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        responder(400, ['error' => 'Ingresa tu nombre y un correo válido.']);
    }
    if ($error = validarClave($clave)) {
        responder(400, ['error' => $error]);
    }

    db()->prepare('INSERT INTO admin_usuarios (nombre, email, clave_hash) VALUES (?, ?, ?)')
        ->execute([$nombre, $email, password_hash($clave, PASSWORD_DEFAULT)]);
    $id = (int) db()->lastInsertId();

    registrarIntento($ip, $email, true);
    iniciarSesionComo(['id' => $id]);
    responder(201, ['usuario' => ['id' => $id, 'nombre' => $nombre, 'email' => $email]]);
} catch (Throwable $e) {
    error_log('dehotel admin/instalar: ' . $e->getMessage());
    responder(500, ['error' => 'No se pudo crear el administrador.']);
}

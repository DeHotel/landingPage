<?php
// POST /api/admin/login.php — { email, clave }
require __DIR__ . '/_auth.php';

$body = requiereJson();
$email = strtolower(limpiar($body['email'] ?? '', 160));
$clave = is_string($body['clave'] ?? null) ? $body['clave'] : '';
$ip = ipCliente();

try {
    if (intentosFallidos($ip) >= INTENTOS_MAX) {
        responder(429, ['error' => 'Demasiados intentos fallidos. Espera ' . INTENTOS_VENTANA_MIN . ' minutos e inténtalo de nuevo.']);
    }

    $st = db()->prepare('SELECT id, nombre, email, clave_hash FROM admin_usuarios WHERE email = ? AND activo = 1');
    $st->execute([$email]);
    $u = $st->fetch();

    // Se verifica siempre contra un hash (aunque el usuario no exista) para que el
    // tiempo de respuesta no revele qué correos están registrados.
    $hash = $u['clave_hash'] ?? password_hash('dehotel-sin-usuario', PASSWORD_DEFAULT);
    $ok = password_verify($clave, $hash) && $u;

    registrarIntento($ip, $email, (bool) $ok);
    if (!$ok) {
        responder(401, ['error' => 'Correo o clave incorrectos.']);
    }

    // Si el algoritmo por defecto de PHP cambia, se actualiza el hash guardado.
    if (password_needs_rehash($u['clave_hash'], PASSWORD_DEFAULT)) {
        db()->prepare('UPDATE admin_usuarios SET clave_hash = ? WHERE id = ?')
            ->execute([password_hash($clave, PASSWORD_DEFAULT), $u['id']]);
    }

    iniciarSesionComo($u);
    responder(200, ['usuario' => ['id' => (int) $u['id'], 'nombre' => $u['nombre'], 'email' => $u['email']]]);
} catch (Throwable $e) {
    error_log('dehotel admin/login: ' . $e->getMessage());
    responder(500, ['error' => 'No se pudo iniciar sesión en este momento.']);
}

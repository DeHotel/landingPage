<?php
// Sesión y autenticación del panel de administración.
require __DIR__ . '/../_db.php';

const SESION_INACTIVIDAD = 8 * 3600;   // cierra la sesión tras 8 h sin uso
const INTENTOS_MAX = 5;                // intentos fallidos permitidos…
const INTENTOS_VENTANA_MIN = 15;       // …por IP en esta ventana de minutos

function iniciarSesion(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }
    $https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');

    session_name('dh_admin');
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/api/admin/',
        'secure' => $https,
        'httponly' => true,
        'samesite' => 'Strict',
    ]);
    ini_set('session.use_strict_mode', '1');
    ini_set('session.gc_maxlifetime', (string) SESION_INACTIVIDAD);
    session_start();

    $ultimo = $_SESSION['ultimo_uso'] ?? null;
    if ($ultimo !== null && time() - $ultimo > SESION_INACTIVIDAD) {
        cerrarSesion();
        session_start();
    }
    $_SESSION['ultimo_uso'] = time();
}

function cerrarSesion(): void
{
    $_SESSION = [];
    if (session_status() === PHP_SESSION_ACTIVE) {
        $p = session_get_cookie_params();
        setcookie(session_name(), '', [
            'expires' => time() - 3600,
            'path' => $p['path'],
            'secure' => $p['secure'],
            'httponly' => true,
            'samesite' => 'Strict',
        ]);
        session_destroy();
    }
}

function usuarioActual(): ?array
{
    iniciarSesion();
    $id = $_SESSION['admin_id'] ?? null;
    if (!$id) {
        return null;
    }
    $st = db()->prepare('SELECT id, nombre, email FROM admin_usuarios WHERE id = ? AND activo = 1');
    $st->execute([$id]);
    $u = $st->fetch();
    return $u ?: null;
}

function requiereAdmin(): array
{
    $u = usuarioActual();
    if (!$u) {
        responder(401, ['error' => 'Sesión expirada. Vuelve a iniciar sesión.']);
    }
    return $u;
}

// Las llamadas que modifican datos deben venir como JSON del propio sitio
// (junto con SameSite=Strict, evita envíos desde formularios de otros sitios).
function requiereJson(): array
{
    soloMetodo('POST');
    if (stripos($_SERVER['CONTENT_TYPE'] ?? '', 'application/json') !== 0) {
        responder(415, ['error' => 'Formato no soportado.']);
    }
    return leerJson();
}

function hayAdministradores(): bool
{
    return (int) db()->query('SELECT COUNT(*) FROM admin_usuarios')->fetchColumn() > 0;
}

function intentosFallidos(?string $ip): int
{
    $st = db()->prepare(
        'SELECT COUNT(*) FROM admin_intentos
         WHERE ip = ? AND exito = 0 AND creado_en > (NOW() - INTERVAL ' . INTENTOS_VENTANA_MIN . ' MINUTE)'
    );
    $st->execute([$ip]);
    return (int) $st->fetchColumn();
}

function registrarIntento(?string $ip, string $email, bool $exito): void
{
    db()->prepare('INSERT INTO admin_intentos (ip, email, exito) VALUES (?, ?, ?)')
        ->execute([$ip, limpiar($email, 160), $exito ? 1 : 0]);
}

function iniciarSesionComo(array $usuario): void
{
    iniciarSesion();
    session_regenerate_id(true);
    $_SESSION['admin_id'] = (int) $usuario['id'];
    $_SESSION['ultimo_uso'] = time();
    db()->prepare('UPDATE admin_usuarios SET ultimo_acceso = NOW() WHERE id = ?')->execute([$usuario['id']]);
}

function validarClave(string $clave): ?string
{
    if (strlen($clave) < 10) {
        return 'La clave debe tener al menos 10 caracteres.';
    }
    if (!preg_match('/[A-Za-z]/', $clave) || !preg_match('/\d/', $clave)) {
        return 'La clave debe combinar letras y números.';
    }
    return null;
}

<?php
// Acceso familiar (/familia/): una clave general, solo para VER videos marcados como visibles.
// No usa la sesión del panel: la cookie es un token firmado (HMAC) con fecha de vencimiento
// y un número de versión. Cambiar la clave sube la versión e invalida todos los tokens.
require_once __DIR__ . '/../admin/_videos.php';

const FAMILIA_COOKIE = 'dh_familia';
const FAMILIA_DIAS_RECORDAR = 30;
const FAMILIA_HORAS_SIN_RECORDAR = 12;
const FAMILIA_INTENTOS_MAX = 5;
const FAMILIA_INTENTOS_MIN = 15;

function ajuste(string $clave, ?string $defecto = null): ?string
{
    $st = db()->prepare('SELECT valor FROM ajustes WHERE clave = ?');
    $st->execute([$clave]);
    $v = $st->fetchColumn();
    return $v === false ? $defecto : $v;
}

function guardarAjuste(string $clave, ?string $valor): void
{
    db()->prepare('INSERT INTO ajustes (clave, valor) VALUES (?, ?) ON DUPLICATE KEY UPDATE valor = VALUES(valor)')
        ->execute([$clave, $valor]);
}

function familiaActiva(): bool
{
    return ajuste('familia_activa') === '1' && ajuste('familia_clave_hash') !== null;
}

function secretoFamilia(): string
{
    $s = ajuste('familia_secreto');
    if (!$s) {
        $s = bin2hex(random_bytes(32));
        guardarAjuste('familia_secreto', $s);
    }
    return $s;
}

// Invalida todos los accesos familiares vigentes (al cambiar la clave o a pedido).
function nuevaVersionFamilia(): void
{
    guardarAjuste('familia_version', (string) ((int) ajuste('familia_version', '0') + 1));
}

function b64url(string $s): string
{
    return rtrim(strtr(base64_encode($s), '+/', '-_'), '=');
}

function emitirAccesoFamilia(bool $recordar): void
{
    $vence = time() + ($recordar ? FAMILIA_DIAS_RECORDAR * 86400 : FAMILIA_HORAS_SIN_RECORDAR * 3600);
    $datos = $vence . '.' . ajuste('familia_version', '0');
    $token = b64url($datos) . '.' . b64url(hash_hmac('sha256', $datos, secretoFamilia(), true));
    setcookie(FAMILIA_COOKIE, $token, [
        'expires' => $recordar ? $vence : 0,
        'path' => '/api/familia/',
        'secure' => esHttps(),
        'httponly' => true,
        'samesite' => 'Strict',
    ]);
}

function borrarAccesoFamilia(): void
{
    setcookie(FAMILIA_COOKIE, '', [
        'expires' => time() - 3600,
        'path' => '/api/familia/',
        'secure' => esHttps(),
        'httponly' => true,
        'samesite' => 'Strict',
    ]);
}

function esHttps(): bool
{
    return (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');
}

function accesoFamiliaValido(): bool
{
    $token = $_COOKIE[FAMILIA_COOKIE] ?? '';
    if (!is_string($token) || substr_count($token, '.') !== 1 || !familiaActiva()) {
        return false;
    }
    [$datos64, $firma64] = explode('.', $token);
    $datos = base64_decode(strtr($datos64, '-_', '+/'), true);
    if ($datos === false) {
        return false;
    }
    $esperada = b64url(hash_hmac('sha256', $datos, secretoFamilia(), true));
    if (!hash_equals($esperada, $firma64)) {
        return false;
    }
    [$vence, $version] = array_pad(explode('.', $datos), 2, '');
    return (int) $vence > time() && $version === ajuste('familia_version', '0');
}

function requiereFamilia(): void
{
    if (!accesoFamiliaValido()) {
        responder(401, ['error' => 'Ingresa la clave para ver los videos.']);
    }
}

function intentosFamiliaFallidos(?string $ip): int
{
    $st = db()->prepare(
        'SELECT COUNT(*) FROM familia_accesos
         WHERE ip = ? AND exito = 0 AND creado_en > (NOW() - INTERVAL ' . FAMILIA_INTENTOS_MIN . ' MINUTE)'
    );
    $st->execute([$ip]);
    return (int) $st->fetchColumn();
}

function registrarAccesoFamilia(?string $ip, bool $exito): void
{
    [$dispositivo, $navegador, $sistema] = detectarDispositivo(limpiar($_SERVER['HTTP_USER_AGENT'] ?? '', 255));
    db()->prepare('INSERT INTO familia_accesos (ip, dispositivo, navegador, sistema, exito) VALUES (?, ?, ?, ?, ?)')
        ->execute([$ip, $dispositivo, $navegador, $sistema, $exito ? 1 : 0]);
}

function errorFamilia(Throwable $e, string $donde): void
{
    error_log("dehotel familia/$donde: " . $e->getMessage());
    responder(500, ['error' => $e instanceof PDOException && in_array($e->getCode(), ['42S02', '42S22'], true)
        ? 'Falta configurar la base de datos (scripts 004 y 005 de la carpeta database/).'
        : 'No se pudo cargar en este momento. Inténtalo de nuevo.']);
}

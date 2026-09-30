<?php
// Utilidades comunes de la API: conexión PDO a MySQL y respuestas JSON.
// Compatible con PHP 7.4+.

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');

// Todas las fechas (PHP y MySQL) en hora de Chile.
date_default_timezone_set('America/Santiago');

function responder(int $status, array $datos): void
{
    http_response_code($status);
    echo json_encode($datos, JSON_UNESCAPED_UNICODE);
    exit;
}

function sinContenido(): void
{
    http_response_code(204);
    exit;
}

function leerJson(): array
{
    $body = json_decode(file_get_contents('php://input') ?: '', true);
    return is_array($body) ? $body : [];
}

function limpiar($valor, int $max): string
{
    if (!is_string($valor)) {
        return '';
    }
    $valor = trim($valor);
    return function_exists('mb_substr') ? mb_substr($valor, 0, $max, 'UTF-8') : substr($valor, 0, $max);
}

function ipCliente(): ?string
{
    return $_SERVER['REMOTE_ADDR'] ?? null;
}

function soloMetodo(string $metodo): void
{
    if ($_SERVER['REQUEST_METHOD'] !== $metodo) {
        header('Allow: ' . $metodo);
        responder(405, ['error' => 'Método no permitido']);
    }
}

function config(): array
{
    static $cfg = null;
    if ($cfg === null) {
        $archivo = __DIR__ . '/config.php';
        if (!is_file($archivo)) {
            throw new RuntimeException('Falta api/config.php (copiar desde config.example.php).');
        }
        $cfg = require $archivo;
    }
    return $cfg;
}

function db(): PDO
{
    static $pdo = null;
    if ($pdo !== null) {
        return $pdo;
    }

    $cfg = config();
    $dsn = sprintf(
        'mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4',
        $cfg['host'],
        $cfg['port'] ?? 3306,
        $cfg['database']
    );
    $pdo = new PDO($dsn, $cfg['user'], $cfg['password'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
        PDO::ATTR_TIMEOUT => 5,
    ]);
    // Alinea NOW() y DEFAULT CURRENT_TIMESTAMP con la hora de Chile (incluye horario de verano).
    $pdo->exec("SET time_zone = '" . date('P') . "'");
    return $pdo;
}

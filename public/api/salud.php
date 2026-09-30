<?php
// GET /api/salud.php — indica si la API logra conectarse a MySQL y qué tablas faltan.
// Solo informa nombres de tablas propias del sitio (sin datos ni credenciales).
require __DIR__ . '/_db.php';

const TABLAS = ['contactos', 'visitas', 'admin_usuarios', 'admin_intentos'];

try {
    $pdo = db();
} catch (Throwable $e) {
    responder(503, ['ok' => false, 'db' => false]);
}

$en = implode(',', array_fill(0, count(TABLAS), '?'));
$st = $pdo->prepare("SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME IN ($en)");
$st->execute(TABLAS);
$faltan = array_values(array_diff(TABLAS, $st->fetchAll(PDO::FETCH_COLUMN)));

responder($faltan ? 503 : 200, ['ok' => !$faltan, 'db' => true, 'faltanTablas' => $faltan]);

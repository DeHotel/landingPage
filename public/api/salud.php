<?php
// GET /api/salud.php — indica si la API logra conectarse a MySQL y si existe la tabla.
require __DIR__ . '/_db.php';

try {
    db()->query('SELECT 1 FROM contactos LIMIT 1');
    responder(200, ['ok' => true, 'db' => true]);
} catch (Throwable $e) {
    responder(503, ['ok' => false, 'db' => false]);
}

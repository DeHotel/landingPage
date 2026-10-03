<?php
// GET /api/familia/estado.php → {activo, autenticado}
require __DIR__ . '/_familia.php';

soloMetodo('GET');
try {
    responder(200, ['activo' => familiaActiva(), 'autenticado' => accesoFamiliaValido()]);
} catch (Throwable $e) {
    errorFamilia($e, 'estado');
}

<?php
// /api/admin/familia.php — administración del acceso familiar (/familia/).
//   GET                                 → estado, cantidad de videos visibles y últimos ingresos
//   POST {accion:'clave', clave}        → fija/cambia la clave (cierra los accesos anteriores)
//   POST {accion:'activo', activo}      → activa o desactiva la página familiar
//   POST {accion:'cerrar_accesos'}      → obliga a todos a ingresar la clave de nuevo
require __DIR__ . '/../familia/_familia.php';

requiereAdmin();

const FAMILIA_CLAVE_MIN = 8;

try {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $conteo = db()->query(
            "SELECT COUNT(*) AS total, COALESCE(SUM(visible_familia), 0) AS visibles FROM videos WHERE estado = 'listo'"
        )->fetch();
        $accesos = db()->query(
            'SELECT id, creado_en, ip, dispositivo, navegador, sistema, exito
             FROM familia_accesos ORDER BY id DESC LIMIT 30'
        )->fetchAll();
        responder(200, [
            'activo' => familiaActiva(),
            'tieneClave' => ajuste('familia_clave_hash') !== null,
            'claveCambiada' => db()->query("SELECT actualizado_en FROM ajustes WHERE clave = 'familia_clave_hash'")->fetchColumn() ?: null,
            'videos' => ['total' => (int) $conteo['total'], 'visibles' => (int) $conteo['visibles']],
            'accesos' => array_map(fn ($a) => array_merge($a, ['id' => (int) $a['id'], 'exito' => (bool) $a['exito']]), $accesos),
        ]);
    }

    $body = requiereJson();
    switch ($body['accion'] ?? '') {
        case 'clave':
            $clave = is_string($body['clave'] ?? null) ? $body['clave'] : '';
            if (mb_strlen($clave) < FAMILIA_CLAVE_MIN) {
                responder(400, ['error' => 'La clave familiar debe tener al menos ' . FAMILIA_CLAVE_MIN . ' caracteres.']);
            }
            guardarAjuste('familia_clave_hash', password_hash($clave, PASSWORD_DEFAULT));
            nuevaVersionFamilia();
            if (ajuste('familia_activa') === null) {
                guardarAjuste('familia_activa', '1'); // la primera vez queda activo
            }
            responder(200, ['ok' => true, 'activo' => familiaActiva()]);
            // no break
        case 'activo':
            guardarAjuste('familia_activa', !empty($body['activo']) ? '1' : '0');
            responder(200, ['ok' => true, 'activo' => familiaActiva()]);
            // no break
        case 'cerrar_accesos':
            nuevaVersionFamilia();
            responder(200, ['ok' => true]);
            // no break
        default:
            responder(400, ['error' => 'Acción no válida.']);
    }
} catch (PDOException $e) {
    error_log('dehotel admin/familia: ' . $e->getMessage());
    responder(500, ['error' => $e->getCode() === '42S02'
        ? 'Faltan las tablas del acceso familiar. Ejecuta database/004_familia.sql en phpMyAdmin.'
        : 'No se pudo cargar el acceso familiar.']);
} catch (Throwable $e) {
    error_log('dehotel admin/familia: ' . $e->getMessage());
    responder(500, ['error' => 'No se pudo cargar el acceso familiar.']);
}

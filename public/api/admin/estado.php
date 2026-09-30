<?php
// GET /api/admin/estado.php — ¿hay sesión iniciada? ¿falta crear el primer administrador?
require __DIR__ . '/_auth.php';

soloMetodo('GET');

try {
    $usuario = usuarioActual();
    responder(200, [
        'usuario' => $usuario,
        'requiereInstalacion' => $usuario ? false : !hayAdministradores(),
    ]);
} catch (PDOException $e) {
    error_log('dehotel admin/estado: ' . $e->getMessage());
    // 42S02 = la tabla no existe: falta ejecutar el script del panel en phpMyAdmin.
    $mensaje = $e->getCode() === '42S02'
        ? 'Faltan las tablas del panel en la base de datos. Ejecuta database/002_visitas_admin.sql en phpMyAdmin.'
        : 'No se pudo conectar con la base de datos.';
    responder(500, ['error' => $mensaje]);
} catch (Throwable $e) {
    error_log('dehotel admin/estado: ' . $e->getMessage());
    responder(500, ['error' => 'Error interno del panel: revisa el registro de errores de PHP del hosting.']);
}

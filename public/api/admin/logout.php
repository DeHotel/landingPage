<?php
// POST /api/admin/logout.php
require __DIR__ . '/_auth.php';

requiereJson();
iniciarSesion();
cerrarSesion();
responder(200, ['ok' => true]);

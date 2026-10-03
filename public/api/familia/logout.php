<?php
// POST /api/familia/logout.php — borra el acceso de este dispositivo.
require __DIR__ . '/_familia.php';

requiereJson();
borrarAccesoFamilia();
responder(200, ['ok' => true]);

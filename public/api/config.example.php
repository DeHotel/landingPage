<?php
// Copiar como config.php (local) o como config.production.php en la raíz del
// proyecto (servidor) y completar con los datos de MySQL.
// config.php no se versiona ni se incluye en el build.
return [
    'host' => 'localhost',
    'port' => 3306,
    'database' => 'dehotel_web',
    'user' => 'dehotel_web',
    'password' => '',

    // Aviso por correo de mensajes nuevos. Dejar 'para' vacío para desactivarlo.
    // 'desde' debe ser una casilla del mismo dominio del sitio (ayuda a no caer en spam).
    'notificaciones' => [
        'para' => 'contacto@dehotel.cl',
        'desde' => 'no-reply@dehotel.cl',
    ],

    // Panel de administración (/admin/). El código se pide UNA vez, al crear el primer
    // administrador; después deja de usarse. Mínimo 16 caracteres, al azar.
    'admin' => [
        'codigo_instalacion' => '',
    ],
];

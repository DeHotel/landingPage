<?php
// Aviso por correo de mensajes nuevos del formulario de contacto.
// Usa mail() de PHP (sin librerías). Destinatario y remitente en config.php → 'notificaciones'.

function sinSaltos(string $valor): string
{
    // Evita inyección de cabeceras: ningún valor usado en cabeceras puede tener saltos de línea.
    return trim(str_replace(["\r", "\n"], ' ', $valor));
}

function cabeceraUtf8(string $texto): string
{
    return '=?UTF-8?B?' . base64_encode($texto) . '?=';
}

/**
 * Envía el aviso. Devuelve true si mail() aceptó el correo.
 * Nunca lanza excepciones: si falla, el mensaje ya quedó guardado en MySQL.
 */
function notificarContacto(array $datos, int $id): bool
{
    try {
        $cfg = config()['notificaciones'] ?? null;
        if (empty($cfg['para']) || empty($cfg['desde'])) {
            return false; // avisos desactivados
        }

        $para = sinSaltos($cfg['para']);
        $desde = sinSaltos($cfg['desde']);
        $nombre = sinSaltos($datos['nombre']);

        $asunto = cabeceraUtf8("Nuevo contacto web: {$nombre} — {$datos['tema']}");

        $lineas = [
            'Llegó un nuevo mensaje desde el formulario de dehotel.cl.',
            '',
            "Nombre:   {$datos['nombre']}",
            'Empresa:  ' . ($datos['empresa'] !== '' ? $datos['empresa'] : '—'),
            "Correo:   {$datos['email']}",
            'Teléfono: ' . ($datos['telefono'] !== '' ? $datos['telefono'] : '—'),
            "Tema:     {$datos['tema']}",
            '',
            'Mensaje:',
            $datos['mensaje'],
            '',
            '—',
            "Registro #{$id} en la tabla contactos. Responde este correo para contestarle directamente.",
        ];
        $cuerpo = implode("\r\n", $lineas);

        $cabeceras = implode("\r\n", [
            'From: ' . cabeceraUtf8('Web dehotel.cl') . " <{$desde}>",
            'Reply-To: ' . cabeceraUtf8($nombre) . ' <' . sinSaltos($datos['email']) . '>',
            'MIME-Version: 1.0',
            'Content-Type: text/plain; charset=UTF-8',
            'Content-Transfer-Encoding: 8bit',
            'X-Mailer: dehotel.cl',
        ]);

        // -f fija el remitente del sobre (Return-Path); ayuda a que no caiga en spam.
        $ok = @mail($para, $asunto, $cuerpo, $cabeceras, '-f' . $desde);
        if (!$ok) {
            error_log("dehotel contacto: mail() no pudo enviar el aviso del registro #{$id}");
        }
        return $ok;
    } catch (Throwable $e) {
        error_log('dehotel contacto (correo): ' . $e->getMessage());
        return false;
    }
}

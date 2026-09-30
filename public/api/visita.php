<?php
// POST /api/visita.php — registra una apertura de la landing (lo llama src/visitas.js).
// No devuelve datos: el conteo solo se ve en el panel de administración.
require __DIR__ . '/_db.php';

soloMetodo('POST');

$ua = limpiar($_SERVER['HTTP_USER_AGENT'] ?? '', 255);

// Bots, rastreadores y vistas previas de enlaces no cuentan como visitas.
const PATRON_BOT = '/bot|crawl|spider|slurp|facebookexternalhit|whatsapp|telegram|preview|curl|wget|python|java\/|go-http|headless|lighthouse|pingdom|uptime|monitor/i';
if ($ua === '' || preg_match(PATRON_BOT, $ua)) {
    sinContenido();
}

$body = leerJson();

// Id anónimo del navegador: solo se acepta con formato UUID.
$visitante = limpiar($body['visitante'] ?? '', 36);
if (!preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $visitante)) {
    $visitante = null;
}

// Referencia: solo el dominio de origen, y solo si viene de otro sitio.
$referencia = null;
$host = parse_url(limpiar($body['referencia'] ?? '', 500), PHP_URL_HOST);
if ($host && strcasecmp($host, $_SERVER['HTTP_HOST'] ?? '') !== 0) {
    $referencia = limpiar(preg_replace('/^www\./i', '', $host), 255);
}

function detectar(string $ua): array
{
    $dispositivo = preg_match('/ipad|tablet|(android(?!.*mobile))/i', $ua) ? 'Tablet'
        : (preg_match('/mobile|iphone|ipod|android/i', $ua) ? 'Móvil' : 'Escritorio');

    $navegadores = [
        'Edge' => '/edg\//i',
        'Opera' => '/opr\/|opera/i',
        'Samsung' => '/samsungbrowser/i',
        'Chrome' => '/chrome|crios/i',
        'Firefox' => '/firefox|fxios/i',
        'Safari' => '/safari/i',
    ];
    $navegador = 'Otro';
    foreach ($navegadores as $nombre => $patron) {
        if (preg_match($patron, $ua)) {
            $navegador = $nombre;
            break;
        }
    }

    $sistemas = [
        'Windows' => '/windows/i',
        'Android' => '/android/i',
        'iOS' => '/iphone|ipad|ipod/i',
        'macOS' => '/mac os x|macintosh/i',
        'Linux' => '/linux/i',
    ];
    $sistema = 'Otro';
    foreach ($sistemas as $nombre => $patron) {
        if (preg_match($patron, $ua)) {
            $sistema = $nombre;
            break;
        }
    }

    return [$dispositivo, $navegador, $sistema];
}

[$dispositivo, $navegador, $sistema] = detectar($ua);
$ip = ipCliente();

try {
    $pdo = db();

    // Freno ante abusos: máximo 30 registros por IP por minuto.
    $st = $pdo->prepare('SELECT COUNT(*) FROM visitas WHERE ip = ? AND creado_en > (NOW() - INTERVAL 1 MINUTE)');
    $st->execute([$ip]);
    if ((int) $st->fetchColumn() >= 30) {
        sinContenido();
    }

    $st = $pdo->prepare(
        'INSERT INTO visitas (ip, visitante, pagina, referencia, utm_fuente, dispositivo, navegador, sistema, user_agent)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    // Conservación (ver política de privacidad): en ~1 de cada 100 registros se borran
    // las visitas de más de 24 meses y los intentos de login de más de 90 días.
    if (random_int(1, 100) === 1) {
        $pdo->exec('DELETE FROM visitas WHERE creado_en < (NOW() - INTERVAL 24 MONTH)');
        $pdo->exec('DELETE FROM admin_intentos WHERE creado_en < (NOW() - INTERVAL 90 DAY)');
    }

    $pagina = limpiar($body['pagina'] ?? '', 255);
    $utm = limpiar($body['utm'] ?? '', 100);
    $st->execute([
        $ip,
        $visitante,
        $pagina !== '' ? $pagina : '/',
        $referencia,
        $utm !== '' ? $utm : null,
        $dispositivo,
        $navegador,
        $sistema,
        $ua,
    ]);
    sinContenido();
} catch (Throwable $e) {
    error_log('dehotel visita: ' . $e->getMessage());
    sinContenido(); // nunca molestar al visitante
}

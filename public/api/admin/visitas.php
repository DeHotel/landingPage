<?php
// GET /api/admin/visitas.php?desde=YYYY-MM-DD&hasta=YYYY-MM-DD&pagina=1&ip=...
// Datos del dashboard de visitas (requiere sesión de administrador).
require __DIR__ . '/_auth.php';

soloMetodo('GET');
requiereAdmin();

const POR_PAGINA = 50;

function fechaParam(string $nombre, string $defecto): string
{
    $v = $_GET[$nombre] ?? '';
    $d = DateTime::createFromFormat('Y-m-d', is_string($v) ? $v : '');
    return ($d && $d->format('Y-m-d') === $v) ? $v : $defecto;
}

$hoy = date('Y-m-d');
$desde = fechaParam('desde', date('Y-m-d', strtotime('-29 days')));
$hasta = fechaParam('hasta', $hoy);
if ($desde > $hasta) {
    [$desde, $hasta] = [$hasta, $desde];
}
// Máximo un año por consulta.
if ((strtotime($hasta) - strtotime($desde)) / 86400 > 366) {
    $desde = date('Y-m-d', strtotime($hasta . ' -366 days'));
}
$pagina = max(1, (int) ($_GET['pagina'] ?? 1));
$ip = limpiar($_GET['ip'] ?? '', 45);

// Rango como [desde 00:00, hasta+1 00:00) para aprovechar el índice por fecha.
$ini = $desde . ' 00:00:00';
$fin = date('Y-m-d', strtotime($hasta . ' +1 day')) . ' 00:00:00';
const UNICO = 'COUNT(DISTINCT COALESCE(visitante, ip))';

try {
    $pdo = db();

    $uno = function (string $sql, array $params = []) use ($pdo) {
        $st = $pdo->prepare($sql);
        $st->execute($params);
        return $st->fetch();
    };
    $todos = function (string $sql, array $params = []) use ($pdo) {
        $st = $pdo->prepare($sql);
        $st->execute($params);
        return $st->fetchAll();
    };

    // Indicadores fijos (no dependen del filtro).
    $resumen = $uno(
        'SELECT
           SUM(creado_en >= CURDATE())                                                AS hoy,
           SUM(creado_en >= CURDATE() - INTERVAL 1 DAY AND creado_en < CURDATE())     AS ayer,
           SUM(creado_en >= CURDATE() - INTERVAL 6 DAY)                               AS ultimos7,
           SUM(creado_en >= CURDATE() - INTERVAL 29 DAY)                              AS ultimos30,
           COUNT(DISTINCT CASE WHEN creado_en >= CURDATE() - INTERVAL 29 DAY
                               THEN COALESCE(visitante, ip) END)                      AS unicos30,
           COUNT(*)                                                                   AS total,
           MIN(creado_en)                                                             AS primera
         FROM visitas'
    );
    $resumen = array_map(fn ($v) => is_numeric($v) ? (int) $v : $v, $resumen);

    // Visitas por día en el rango (se completan con 0 los días sin visitas).
    $filas = $todos(
        'SELECT DATE(creado_en) AS fecha, COUNT(*) AS visitas, ' . UNICO . ' AS unicos
         FROM visitas WHERE creado_en >= ? AND creado_en < ?
         GROUP BY DATE(creado_en)',
        [$ini, $fin]
    );
    $porFecha = array_column($filas, null, 'fecha');
    // Se recorre en UTC: en Chile hay días sin 00:00 por el cambio de hora, lo que
    // desfasaría el recorrido y haría perder el último día del rango.
    $porDia = [];
    $utc = new DateTimeZone('UTC');
    $limite = new DateTimeImmutable($hasta, $utc);
    for ($d = new DateTimeImmutable($desde, $utc); $d <= $limite; $d = $d->modify('+1 day')) {
        $f = $d->format('Y-m-d');
        $porDia[] = [
            'fecha' => $f,
            'visitas' => (int) ($porFecha[$f]['visitas'] ?? 0),
            'unicos' => (int) ($porFecha[$f]['unicos'] ?? 0),
        ];
    }

    $enRango = $uno(
        'SELECT COUNT(*) AS visitas, ' . UNICO . ' AS unicos FROM visitas WHERE creado_en >= ? AND creado_en < ?',
        [$ini, $fin]
    );

    $dispositivos = $todos(
        "SELECT COALESCE(dispositivo, 'Otro') AS nombre, COUNT(*) AS total
         FROM visitas WHERE creado_en >= ? AND creado_en < ?
         GROUP BY nombre ORDER BY total DESC",
        [$ini, $fin]
    );
    $origenes = $todos(
        "SELECT COALESCE(utm_fuente, referencia, 'Directo') AS nombre, COUNT(*) AS total
         FROM visitas WHERE creado_en >= ? AND creado_en < ?
         GROUP BY nombre ORDER BY total DESC LIMIT 8",
        [$ini, $fin]
    );

    // Detalle paginado (filtro opcional por IP).
    $where = 'creado_en >= ? AND creado_en < ?';
    $params = [$ini, $fin];
    if ($ip !== '') {
        $where .= ' AND ip LIKE ?';
        $params[] = str_replace(['%', '_'], ['\%', '\_'], $ip) . '%';
    }
    $totalFiltrado = (int) $uno("SELECT COUNT(*) AS n FROM visitas WHERE $where", $params)['n'];
    $offset = ($pagina - 1) * POR_PAGINA;
    $lista = $todos(
        "SELECT v.id, v.creado_en, v.ip, v.visitante, v.pagina, v.referencia, v.utm_fuente,
                v.dispositivo, v.navegador, v.sistema,
                (SELECT COUNT(*) FROM visitas v2
                  WHERE v2.visitante = v.visitante AND v2.id < v.id) AS previas
         FROM visitas v WHERE $where
         ORDER BY v.creado_en DESC, v.id DESC
         LIMIT " . POR_PAGINA . " OFFSET $offset",
        $params
    );
    foreach ($lista as &$fila) {
        $fila['id'] = (int) $fila['id'];
        $fila['recurrente'] = $fila['visitante'] !== null && (int) $fila['previas'] > 0;
        unset($fila['previas']);
    }
    unset($fila);

    responder(200, [
        'desde' => $desde,
        'hasta' => $hasta,
        'resumen' => $resumen,
        'rango' => ['visitas' => (int) $enRango['visitas'], 'unicos' => (int) $enRango['unicos']],
        'porDia' => $porDia,
        'dispositivos' => array_map(fn ($r) => ['nombre' => $r['nombre'], 'total' => (int) $r['total']], $dispositivos),
        'origenes' => array_map(fn ($r) => ['nombre' => $r['nombre'], 'total' => (int) $r['total']], $origenes),
        'lista' => $lista,
        'pagina' => $pagina,
        'paginas' => max(1, (int) ceil($totalFiltrado / POR_PAGINA)),
        'totalFiltrado' => $totalFiltrado,
    ]);
} catch (Throwable $e) {
    error_log('dehotel admin/visitas: ' . $e->getMessage());
    responder(500, ['error' => 'No se pudieron cargar las visitas.']);
}

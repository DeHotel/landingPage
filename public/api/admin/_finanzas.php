<?php
// Utilidades del módulo de finanzas (ingresos y egresos).
require_once __DIR__ . '/_auth.php';

const FIN_TIPOS = ['ingreso', 'egreso'];
const FIN_ESTADOS = ['pagado', 'pendiente'];
const FIN_MONTO_MAX = 999999999999; // casi un billón de pesos
const FIN_COMPROBANTE_TIPOS = [
    'image/jpeg' => 'jpg',
    'image/png' => 'png',
    'image/webp' => 'webp',
    'application/pdf' => 'pdf',
];
const FIN_COMPROBANTE_MAX = 10 * 1024 * 1024;

function montoValido($valor): int
{
    // Un texto se toma con formato chileno: "150.000" son ciento cincuenta mil, no 150,0.
    $n = is_int($valor) || is_float($valor) ? (int) round($valor) : (int) preg_replace('/\D/', '', (string) $valor);
    if ($n <= 0 || $n > FIN_MONTO_MAX) {
        responder(400, ['error' => 'Ingresa un monto mayor que cero.']);
    }
    return $n;
}

function fechaValida($valor, string $campo = 'fecha'): string
{
    $v = is_string($valor) ? $valor : '';
    $d = DateTimeImmutable::createFromFormat('!Y-m-d', $v);
    if (!$d || $d->format('Y-m-d') !== $v) {
        responder(400, ['error' => "La $campo no es válida."]);
    }
    return $v;
}

function tipoValido($valor): string
{
    if (!in_array($valor, FIN_TIPOS, true)) {
        responder(400, ['error' => 'Indica si es un ingreso o un egreso.']);
    }
    return $valor;
}

function cuentaValida($valor): int
{
    $st = db()->prepare('SELECT id FROM fin_cuentas WHERE id = ?');
    $st->execute([(int) $valor]);
    $id = $st->fetchColumn();
    if ($id === false) {
        responder(400, ['error' => 'Elige una cuenta.']);
    }
    return (int) $id;
}

// La categoría debe ser del mismo tipo (no una de ingreso en un egreso). Opcional.
function categoriaValida($valor, string $tipo): ?int
{
    if ($valor === null || $valor === '' || (int) $valor === 0) {
        return null;
    }
    $st = db()->prepare('SELECT id FROM fin_categorias WHERE id = ? AND tipo = ?');
    $st->execute([(int) $valor, $tipo]);
    $id = $st->fetchColumn();
    if ($id === false) {
        responder(400, ['error' => 'La categoría no corresponde al tipo de movimiento.']);
    }
    return (int) $id;
}

function clienteOpcional($valor): ?int
{
    if (!$valor) {
        return null;
    }
    $st = db()->prepare('SELECT id FROM clientes WHERE id = ?');
    $st->execute([(int) $valor]);
    $id = $st->fetchColumn();
    return $id === false ? null : (int) $id;
}

/**
 * Fecha de vencimiento de la cuota $n (1 = primera) de un recurrente.
 * Si el día de pago no existe en ese mes (ej. 31 en abril), se usa el último día.
 * Se calcula en UTC para no tropezar con los cambios de hora de Chile.
 */
function vencimientoCuota(array $r, int $n): DateTimeImmutable
{
    $inicio = new DateTimeImmutable($r['inicio'], new DateTimeZone('UTC'));
    $base = $inicio->modify('first day of this month');
    $mes = $r['frecuencia'] === 'anual' ? $base->modify('+' . ($n - 1) . ' year') : $base->modify('+' . ($n - 1) . ' month');
    $dia = min((int) $r['dia_pago'], (int) $mes->format('t'));
    return $mes->setDate((int) $mes->format('Y'), (int) $mes->format('m'), $dia);
}

function periodoCuota(array $r, DateTimeImmutable $fecha): string
{
    return $r['frecuencia'] === 'anual' ? $fecha->format('Y') : $fecha->format('Y-m');
}

/**
 * Crea los movimientos "pendiente" de los recurrentes activos, desde el mes en que se
 * creó cada uno (no rellena el pasado) hasta el fin del mes siguiente al actual.
 * Es idempotente: el índice único (recurrente_id, periodo) evita duplicados.
 */
function generarPendientes(?int $soloRecurrente = null): int
{
    $utc = new DateTimeZone('UTC');
    $hasta = (new DateTimeImmutable(date('Y-m-d'), $utc))->modify('first day of next month')->modify('last day of this month');
    $sql = 'SELECT * FROM fin_recurrentes WHERE activo = 1' . ($soloRecurrente ? ' AND id = ' . (int) $soloRecurrente : '');
    $insertar = db()->prepare(
        "INSERT IGNORE INTO fin_movimientos
           (cuenta_id, categoria_id, tipo, fecha, descripcion, monto, estado, recurrente_id, periodo, cuota)
         VALUES (?, ?, ?, ?, ?, ?, 'pendiente', ?, ?, ?)"
    );
    $creados = 0;
    foreach (db()->query($sql)->fetchAll() as $r) {
        $desde = max(
            new DateTimeImmutable($r['inicio'], $utc),
            (new DateTimeImmutable(substr($r['creado_en'], 0, 10), $utc))->modify('first day of this month')
        );
        for ($n = 1; $n <= 1200; $n++) {
            if ($r['cuotas'] !== null && $n > (int) $r['cuotas']) {
                break;
            }
            $venc = vencimientoCuota($r, $n);
            if ($venc > $hasta) {
                break;
            }
            if ($venc < $desde) {
                continue;
            }
            $insertar->execute([
                $r['cuenta_id'], $r['categoria_id'], $r['tipo'], $venc->format('Y-m-d'), $r['descripcion'],
                $r['monto'], $r['id'], periodoCuota($r, $venc), $n,
            ]);
            $creados += $insertar->rowCount();
        }
    }
    return $creados;
}

// Borra las cuotas pendientes futuras de un recurrente (al editarlo, pausarlo o eliminarlo).
function borrarPendientesFuturos(int $recurrenteId): void
{
    db()->prepare(
        "DELETE FROM fin_movimientos
         WHERE recurrente_id = ? AND estado = 'pendiente' AND fecha >= CURDATE() AND comprobante IS NULL"
    )->execute([$recurrenteId]);
}

function movimientoPublico(array $m): array
{
    return [
        'id' => (int) $m['id'],
        'cuenta_id' => (int) $m['cuenta_id'],
        'categoria_id' => $m['categoria_id'] !== null ? (int) $m['categoria_id'] : null,
        'categoria' => $m['categoria'] ?? null,
        'tipo' => $m['tipo'],
        'fecha' => $m['fecha'],
        'descripcion' => $m['descripcion'],
        'monto' => (int) $m['monto'],
        'estado' => $m['estado'],
        'recurrente_id' => $m['recurrente_id'] !== null ? (int) $m['recurrente_id'] : null,
        'cuota' => $m['cuota'] !== null ? (int) $m['cuota'] : null,
        'cuotas' => isset($m['cuotas']) && $m['cuotas'] !== null ? (int) $m['cuotas'] : null,
        'cliente_id' => $m['cliente_id'] !== null ? (int) $m['cliente_id'] : null,
        'cliente' => $m['cliente'] ?? null,
        'notas' => $m['notas'],
        'comprobante' => $m['comprobante'] !== null,
        'comprobante_nombre' => $m['comprobante_nombre'],
        'comprobante_mime' => $m['comprobante_mime'],
    ];
}

// Carpeta privada de comprobantes: al lado de public_html (fuera del sitio público).
function carpetaComprobantes(): string
{
    $cfg = config()['finanzas']['carpeta'] ?? '';
    $carpeta = $cfg !== ''
        ? $cfg
        : dirname(rtrim($_SERVER['DOCUMENT_ROOT'] ?? dirname(__DIR__, 3), '/\\')) . '/dehotel_privado/comprobantes';
    if (!is_dir($carpeta) && !@mkdir($carpeta, 0750, true)) {
        throw new RuntimeException("No se pudo crear la carpeta de comprobantes: $carpeta");
    }
    if (!is_file("$carpeta/index.html")) {
        @file_put_contents("$carpeta/index.html", '');
        @file_put_contents("$carpeta/.htaccess", "Require all denied\n");
    }
    return $carpeta;
}

function borrarComprobante(?string $archivo): void
{
    if ($archivo && preg_match('/^[0-9a-f]{32}\.(jpg|png|webp|pdf)$/', $archivo)) {
        $ruta = carpetaComprobantes() . '/' . $archivo;
        if (is_file($ruta)) {
            @unlink($ruta);
        }
    }
}

function errorFinanzas(Throwable $e, string $donde, string $porDefecto): void
{
    if (db()->inTransaction()) {
        db()->rollBack();
    }
    error_log("dehotel admin/$donde: " . $e->getMessage());
    if ($e instanceof PDOException && in_array($e->getCode(), ['42S02', '42S22'], true)) {
        responder(500, ['error' => 'Falta actualizar la base de datos: ejecuta database/007_finanzas.sql en phpMyAdmin.']);
    }
    responder(500, ['error' => $porDefecto]);
}

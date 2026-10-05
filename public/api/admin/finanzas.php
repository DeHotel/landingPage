<?php
// /api/admin/finanzas.php — ingresos y egresos.
//   GET ?vista=resumen&mes=AAAA-MM&cuenta=ID   → totales del mes, por categoría, 12 meses y vencimientos
//   GET ?vista=movimientos&mes=&cuenta=&tipo=&estado=&categoria=&buscar=  → movimientos del mes
//   POST {accion:'guardar', movimiento}        → crea o actualiza (si trae id)
//   POST {accion:'estado', id, estado}         → pagado / pendiente
//   POST {accion:'eliminar', id}
// "cuenta" vacío o "todas" = todas las cuentas. Cada GET genera las cuotas recurrentes pendientes.
require __DIR__ . '/_finanzas.php';

requiereAdmin();

function mesParam(): string
{
    $m = $_GET['mes'] ?? '';
    return is_string($m) && preg_match('/^\d{4}-(0[1-9]|1[0-2])$/', $m) ? $m : date('Y-m');
}

// Filtro de cuenta reutilizable: [sql, params]
function filtroCuenta(string $alias = 'm'): array
{
    $c = (int) ($_GET['cuenta'] ?? 0);
    return $c > 0 ? [" AND $alias.cuenta_id = ?", [$c]] : ['', []];
}

try {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        generarPendientes();
        $mes = mesParam();
        $ini = "$mes-01";
        $fin = (new DateTimeImmutable($ini))->modify('first day of next month')->format('Y-m-d');
        [$sqlCuenta, $pCuenta] = filtroCuenta();

        if (($_GET['vista'] ?? 'resumen') === 'movimientos') {
            $where = "m.fecha >= ? AND m.fecha < ?$sqlCuenta";
            $params = array_merge([$ini, $fin], $pCuenta);
            if (in_array($_GET['tipo'] ?? '', FIN_TIPOS, true)) {
                $where .= ' AND m.tipo = ?';
                $params[] = $_GET['tipo'];
            }
            if (in_array($_GET['estado'] ?? '', FIN_ESTADOS, true)) {
                $where .= ' AND m.estado = ?';
                $params[] = $_GET['estado'];
            }
            if ((int) ($_GET['categoria'] ?? 0) > 0) {
                $where .= ' AND m.categoria_id = ?';
                $params[] = (int) $_GET['categoria'];
            }
            $buscar = limpiar($_GET['buscar'] ?? '', 100);
            if ($buscar !== '') {
                $where .= ' AND (m.descripcion LIKE ? OR m.notas LIKE ?)';
                $like = '%' . str_replace(['%', '_'], ['\%', '\_'], $buscar) . '%';
                array_push($params, $like, $like);
            }
            $st = db()->prepare(
                "SELECT m.*, c.nombre AS categoria, r.cuotas, cl.nombre AS cliente
                 FROM fin_movimientos m
                 LEFT JOIN fin_categorias c ON c.id = m.categoria_id
                 LEFT JOIN fin_recurrentes r ON r.id = m.recurrente_id
                 LEFT JOIN clientes cl ON cl.id = m.cliente_id
                 WHERE $where ORDER BY m.fecha DESC, m.id DESC"
            );
            $st->execute($params);
            $lista = array_map('movimientoPublico', $st->fetchAll());
            $tot = ['ingresos' => 0, 'egresos' => 0];
            foreach ($lista as $m) {
                $tot[$m['tipo'] === 'ingreso' ? 'ingresos' : 'egresos'] += $m['monto'];
            }
            responder(200, ['mes' => $mes, 'movimientos' => $lista, 'totales' => $tot]);
        }

        // Resumen del mes
        $st = db()->prepare(
            "SELECT
               COALESCE(SUM(CASE WHEN tipo = 'ingreso' AND estado = 'pagado' THEN monto END), 0)   AS ingresos,
               COALESCE(SUM(CASE WHEN tipo = 'egreso'  AND estado = 'pagado' THEN monto END), 0)   AS egresos,
               COALESCE(SUM(CASE WHEN tipo = 'ingreso' AND estado = 'pendiente' THEN monto END), 0) AS por_cobrar,
               COALESCE(SUM(CASE WHEN tipo = 'egreso'  AND estado = 'pendiente' THEN monto END), 0) AS por_pagar
             FROM fin_movimientos m WHERE fecha >= ? AND fecha < ?$sqlCuenta"
        );
        $st->execute(array_merge([$ini, $fin], $pCuenta));
        $totales = array_map('intval', $st->fetch());

        $st = db()->prepare(
            "SELECT m.tipo, COALESCE(c.nombre, 'Sin categoría') AS categoria, SUM(m.monto) AS total
             FROM fin_movimientos m LEFT JOIN fin_categorias c ON c.id = m.categoria_id
             WHERE m.fecha >= ? AND m.fecha < ?$sqlCuenta
             GROUP BY m.tipo, categoria ORDER BY total DESC"
        );
        $st->execute(array_merge([$ini, $fin], $pCuenta));
        $porCategoria = array_map(fn ($f) => ['tipo' => $f['tipo'], 'categoria' => $f['categoria'], 'total' => (int) $f['total']], $st->fetchAll());

        // Últimos 12 meses (terminando en el mes elegido), solo lo pagado.
        $desde12 = (new DateTimeImmutable($ini))->modify('-11 months')->format('Y-m-d');
        $st = db()->prepare(
            "SELECT DATE_FORMAT(fecha, '%Y-%m') AS mes,
                    SUM(CASE WHEN tipo = 'ingreso' THEN monto ELSE 0 END) AS ingresos,
                    SUM(CASE WHEN tipo = 'egreso' THEN monto ELSE 0 END) AS egresos
             FROM fin_movimientos m WHERE estado = 'pagado' AND fecha >= ? AND fecha < ?$sqlCuenta
             GROUP BY mes"
        );
        $st->execute(array_merge([$desde12, $fin], $pCuenta));
        $porMes = array_column($st->fetchAll(), null, 'mes');
        $evolucion = [];
        for ($d = new DateTimeImmutable($desde12); $d->format('Y-m-d') < $fin; $d = $d->modify('+1 month')) {
            $k = $d->format('Y-m');
            $evolucion[] = ['mes' => $k, 'ingresos' => (int) ($porMes[$k]['ingresos'] ?? 0), 'egresos' => (int) ($porMes[$k]['egresos'] ?? 0)];
        }

        // Pendientes: vencidos (cualquier fecha pasada) y próximos 30 días.
        $st = db()->prepare(
            "SELECT m.*, c.nombre AS categoria, r.cuotas, NULL AS cliente
             FROM fin_movimientos m
             LEFT JOIN fin_categorias c ON c.id = m.categoria_id
             LEFT JOIN fin_recurrentes r ON r.id = m.recurrente_id
             WHERE m.estado = 'pendiente' AND m.fecha <= (CURDATE() + INTERVAL 30 DAY)$sqlCuenta
             ORDER BY m.fecha, m.id LIMIT 50"
        );
        $st->execute($pCuenta);
        $pendientes = array_map(fn ($m) => movimientoPublico($m) + ['vencido' => $m['fecha'] < date('Y-m-d')], $st->fetchAll());

        responder(200, [
            'mes' => $mes,
            'totales' => $totales + ['saldo' => $totales['ingresos'] - $totales['egresos']],
            'porCategoria' => $porCategoria,
            'evolucion' => $evolucion,
            'pendientes' => $pendientes,
        ]);
    }

    $body = requiereJson();
    switch ($body['accion'] ?? '') {
        case 'guardar':
            $m = is_array($body['movimiento'] ?? null) ? $body['movimiento'] : [];
            $id = (int) ($m['id'] ?? 0);
            $tipo = tipoValido($m['tipo'] ?? '');
            $descripcion = limpiar($m['descripcion'] ?? '', 150);
            if ($descripcion === '') {
                responder(400, ['error' => 'Escribe una descripción (ej. «Cuenta de internet octubre»).']);
            }
            $datos = [
                'cuenta_id' => cuentaValida($m['cuenta_id'] ?? 0),
                'categoria_id' => categoriaValida($m['categoria_id'] ?? null, $tipo),
                'tipo' => $tipo,
                'fecha' => fechaValida($m['fecha'] ?? ''),
                'descripcion' => $descripcion,
                'monto' => montoValido($m['monto'] ?? 0),
                'estado' => in_array($m['estado'] ?? '', FIN_ESTADOS, true) ? $m['estado'] : 'pagado',
                'cliente_id' => $tipo === 'ingreso' ? clienteOpcional($m['cliente_id'] ?? null) : null,
                'notas' => limpiar($m['notas'] ?? '', 5000) ?: null,
            ];
            if ($id) {
                $sets = implode(', ', array_map(fn ($c) => "$c = ?", array_keys($datos)));
                $st = db()->prepare("UPDATE fin_movimientos SET $sets WHERE id = ?");
                $st->execute([...array_values($datos), $id]);
                $existe = db()->prepare('SELECT COUNT(*) FROM fin_movimientos WHERE id = ?');
                $existe->execute([$id]);
                if (!(int) $existe->fetchColumn()) {
                    responder(404, ['error' => 'El movimiento ya no existe.']);
                }
            } else {
                $campos = implode(', ', array_keys($datos));
                $marcas = implode(', ', array_fill(0, count($datos), '?'));
                db()->prepare("INSERT INTO fin_movimientos ($campos) VALUES ($marcas)")->execute(array_values($datos));
                $id = (int) db()->lastInsertId();
            }
            $st = db()->prepare(
                'SELECT m.*, c.nombre AS categoria, r.cuotas, cl.nombre AS cliente FROM fin_movimientos m
                 LEFT JOIN fin_categorias c ON c.id = m.categoria_id
                 LEFT JOIN fin_recurrentes r ON r.id = m.recurrente_id
                 LEFT JOIN clientes cl ON cl.id = m.cliente_id WHERE m.id = ?'
            );
            $st->execute([$id]);
            responder(200, ['movimiento' => movimientoPublico($st->fetch())]);
            // no break

        case 'estado':
            $estado = $body['estado'] ?? '';
            if (!in_array($estado, FIN_ESTADOS, true)) {
                responder(400, ['error' => 'Estado no válido.']);
            }
            $st = db()->prepare('UPDATE fin_movimientos SET estado = ? WHERE id = ?');
            $st->execute([$estado, (int) ($body['id'] ?? 0)]);
            responder(200, ['ok' => true]);
            // no break

        case 'eliminar':
            $id = (int) ($body['id'] ?? 0);
            $st = db()->prepare('SELECT comprobante, recurrente_id, estado FROM fin_movimientos WHERE id = ?');
            $st->execute([$id]);
            $mov = $st->fetch();
            if (!$mov) {
                responder(404, ['error' => 'El movimiento no existe.']);
            }
            // Una cuota recurrente pendiente se volvería a generar sola: se pide pausar el recurrente.
            if ($mov['recurrente_id'] !== null && $mov['estado'] === 'pendiente') {
                responder(409, ['error' => 'Es una cuota automática: si ya no corresponde, edita o pausa el recurrente en la pestaña «Recurrentes».']);
            }
            db()->prepare('DELETE FROM fin_movimientos WHERE id = ?')->execute([$id]);
            borrarComprobante($mov['comprobante']);
            responder(200, ['ok' => true]);
            // no break

        default:
            responder(400, ['error' => 'Acción no válida.']);
    }
} catch (Throwable $e) {
    errorFinanzas($e, 'finanzas', 'No se pudo procesar la solicitud de finanzas.');
}

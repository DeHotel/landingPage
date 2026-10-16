<?php
// /api/admin/finanzas-config.php — cuentas, categorías y recurrentes.
//   GET                                                   → todo, con cantidades de uso
//   POST {accion:'guardar_cuenta', cuenta:{id?, nombre, color, activa}}
//   POST {accion:'eliminar_cuenta', id}                   → solo si no tiene movimientos
//   POST {accion:'guardar_categoria', categoria:{id?, tipo, nombre}}
//   POST {accion:'eliminar_categoria', id}                → sus movimientos quedan "Sin categoría"
//   POST {accion:'guardar_recurrente', recurrente:{...}}  → crea/edita y regenera cuotas futuras
//        (con incluir_anteriores = true registra como pagadas las cuotas de meses pasados)
//   POST {accion:'completar_historial', id}               → registra como pagadas las cuotas pasadas que falten
//   POST {accion:'activar_recurrente', id, activo}        → pausar / reanudar
//   POST {accion:'eliminar_recurrente', id}               → borra cuotas pendientes futuras; lo pagado queda
require __DIR__ . '/_finanzas.php';

requiereAdmin();

function listarRecurrentes(): array
{
    $filas = db()->query(
        "SELECT r.*, c.nombre AS categoria, cu.nombre AS cuenta,
                (SELECT COUNT(*) FROM fin_movimientos m WHERE m.recurrente_id = r.id AND m.estado = 'pagado') AS pagadas,
                (SELECT MIN(m.fecha) FROM fin_movimientos m WHERE m.recurrente_id = r.id AND m.estado = 'pendiente') AS proximo
         FROM fin_recurrentes r
         LEFT JOIN fin_categorias c ON c.id = r.categoria_id
         JOIN fin_cuentas cu ON cu.id = r.cuenta_id
         ORDER BY r.activo DESC, r.tipo, r.descripcion"
    )->fetchAll();
    return array_map(function ($r) {
        $ultima = $r['cuotas'] !== null ? vencimientoCuota($r, (int) $r['cuotas'])->format('Y-m-d') : null;
        [$esperadas, $registradas] = cuotasAnteriores($r);
        return [
            'id' => (int) $r['id'],
            'cuenta_id' => (int) $r['cuenta_id'],
            'cuenta' => $r['cuenta'],
            'categoria_id' => $r['categoria_id'] !== null ? (int) $r['categoria_id'] : null,
            'categoria' => $r['categoria'],
            'tipo' => $r['tipo'],
            'descripcion' => $r['descripcion'],
            'monto' => (int) $r['monto'],
            'frecuencia' => $r['frecuencia'],
            'dia_pago' => (int) $r['dia_pago'],
            'inicio' => $r['inicio'],
            'cuotas' => $r['cuotas'] !== null ? (int) $r['cuotas'] : null,
            'ultima' => $ultima,
            'activo' => (bool) $r['activo'],
            'notas' => $r['notas'],
            'pagadas' => (int) $r['pagadas'],
            'proximo' => $r['proximo'],
            // Cuotas de meses anteriores a su creación que aún no están registradas.
            'anteriores_faltantes' => max(0, $esperadas - $registradas),
        ];
    }, $filas);
}

function nombreCorto($valor, string $que): string
{
    $v = limpiar($valor ?? '', 60);
    if ($v === '') {
        responder(400, ['error' => "Escribe el nombre de la $que."]);
    }
    return $v;
}

try {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        generarPendientes();
        $cuentas = db()->query(
            'SELECT cu.*, (SELECT COUNT(*) FROM fin_movimientos m WHERE m.cuenta_id = cu.id) AS movimientos
             FROM fin_cuentas cu ORDER BY cu.activa DESC, cu.nombre'
        )->fetchAll();
        $categorias = db()->query(
            'SELECT c.*, (SELECT COUNT(*) FROM fin_movimientos m WHERE m.categoria_id = c.id) AS movimientos
             FROM fin_categorias c ORDER BY c.tipo, c.nombre'
        )->fetchAll();
        responder(200, [
            'cuentas' => array_map(fn ($c) => ['id' => (int) $c['id'], 'nombre' => $c['nombre'], 'color' => $c['color'], 'activa' => (bool) $c['activa'], 'movimientos' => (int) $c['movimientos']], $cuentas),
            'categorias' => array_map(fn ($c) => ['id' => (int) $c['id'], 'tipo' => $c['tipo'], 'nombre' => $c['nombre'], 'movimientos' => (int) $c['movimientos']], $categorias),
            'recurrentes' => listarRecurrentes(),
            'clientes' => array_map(fn ($c) => ['id' => (int) $c['id'], 'nombre' => $c['nombre']],
                db()->query("SELECT id, nombre FROM clientes WHERE estado <> 'inactivo' ORDER BY nombre")->fetchAll()),
        ]);
    }

    $body = requiereJson();
    $pdo = db();
    switch ($body['accion'] ?? '') {
        case 'guardar_cuenta':
            $c = $body['cuenta'] ?? [];
            $nombre = nombreCorto($c['nombre'] ?? '', 'cuenta');
            $color = preg_match('/^#[0-9a-fA-F]{6}$/', $c['color'] ?? '') ? $c['color'] : '#6366f1';
            $activa = array_key_exists('activa', $c) ? (!empty($c['activa']) ? 1 : 0) : 1;
            if (!empty($c['id'])) {
                $pdo->prepare('UPDATE fin_cuentas SET nombre = ?, color = ?, activa = ? WHERE id = ?')->execute([$nombre, $color, $activa, (int) $c['id']]);
            } else {
                $pdo->prepare('INSERT INTO fin_cuentas (nombre, color) VALUES (?, ?)')->execute([$nombre, $color]);
            }
            responder(200, ['ok' => true]);
            // no break

        case 'eliminar_cuenta':
            $id = (int) ($body['id'] ?? 0);
            $usos = $pdo->prepare('SELECT (SELECT COUNT(*) FROM fin_movimientos WHERE cuenta_id = ?) + (SELECT COUNT(*) FROM fin_recurrentes WHERE cuenta_id = ?)');
            $usos->execute([$id, $id]);
            if ((int) $usos->fetchColumn() > 0) {
                responder(409, ['error' => 'La cuenta tiene movimientos o recurrentes: no se puede eliminar, pero puedes desactivarla.']);
            }
            $pdo->prepare('DELETE FROM fin_cuentas WHERE id = ?')->execute([$id]);
            responder(200, ['ok' => true]);
            // no break

        case 'guardar_categoria':
            $c = $body['categoria'] ?? [];
            $nombre = nombreCorto($c['nombre'] ?? '', 'categoría');
            if (!empty($c['id'])) {
                $pdo->prepare('UPDATE fin_categorias SET nombre = ? WHERE id = ?')->execute([$nombre, (int) $c['id']]);
            } else {
                $pdo->prepare('INSERT INTO fin_categorias (tipo, nombre) VALUES (?, ?)')->execute([tipoValido($c['tipo'] ?? ''), $nombre]);
            }
            responder(200, ['ok' => true]);
            // no break

        case 'eliminar_categoria':
            $pdo->prepare('DELETE FROM fin_categorias WHERE id = ?')->execute([(int) ($body['id'] ?? 0)]);
            responder(200, ['ok' => true]);
            // no break

        case 'guardar_recurrente':
            $r = $body['recurrente'] ?? [];
            $id = (int) ($r['id'] ?? 0);
            $tipo = tipoValido($r['tipo'] ?? '');
            $descripcion = limpiar($r['descripcion'] ?? '', 150);
            if ($descripcion === '') {
                responder(400, ['error' => 'Escribe una descripción (ej. «Crédito de consumo Banco X»).']);
            }
            $inicio = fechaValida($r['inicio'] ?? '', 'fecha del primer vencimiento');
            $cuotas = isset($r['cuotas']) && $r['cuotas'] !== '' && $r['cuotas'] !== null ? (int) $r['cuotas'] : null;
            if ($cuotas !== null && ($cuotas < 1 || $cuotas > 600)) {
                responder(400, ['error' => 'El número de cuotas debe estar entre 1 y 600 (o vacío si no tiene término).']);
            }
            $datos = [
                'cuenta_id' => cuentaValida($r['cuenta_id'] ?? 0),
                'categoria_id' => categoriaValida($r['categoria_id'] ?? null, $tipo),
                'tipo' => $tipo,
                'descripcion' => $descripcion,
                'monto' => montoValido($r['monto'] ?? 0),
                'frecuencia' => ($r['frecuencia'] ?? '') === 'anual' ? 'anual' : 'mensual',
                'dia_pago' => (int) substr($inicio, 8, 2),
                'inicio' => $inicio,
                'cuotas' => $cuotas,
                'notas' => limpiar($r['notas'] ?? '', 5000) ?: null,
            ];
            $pdo->beginTransaction();
            if ($id) {
                $sets = implode(', ', array_map(fn ($c) => "$c = ?", array_keys($datos)));
                $pdo->prepare("UPDATE fin_recurrentes SET $sets WHERE id = ?")->execute([...array_values($datos), $id]);
                // Las cuotas pendientes futuras se rehacen con los datos nuevos.
                borrarPendientesFuturos($id);
            } else {
                $campos = implode(', ', array_keys($datos));
                $marcas = implode(', ', array_fill(0, count($datos), '?'));
                $pdo->prepare("INSERT INTO fin_recurrentes ($campos) VALUES ($marcas)")->execute(array_values($datos));
                $id = (int) $pdo->lastInsertId();
            }
            $creadas = generarPendientes($id);
            $anteriores = !empty($r['incluir_anteriores']) ? completarHistorial($id) : 0;
            $pdo->commit();
            responder(200, ['ok' => true, 'id' => $id, 'cuotasGeneradas' => $creadas, 'anterioresRegistradas' => $anteriores]);
            // no break

        case 'completar_historial':
            $id = (int) ($body['id'] ?? 0);
            $pdo->beginTransaction();
            $creadas = completarHistorial($id);
            $pdo->commit();
            responder(200, ['ok' => true, 'anterioresRegistradas' => $creadas]);
            // no break

        case 'activar_recurrente':
            $id = (int) ($body['id'] ?? 0);
            $activo = !empty($body['activo']);
            $pdo->prepare('UPDATE fin_recurrentes SET activo = ? WHERE id = ?')->execute([$activo ? 1 : 0, $id]);
            if ($activo) {
                generarPendientes($id);
            } else {
                borrarPendientesFuturos($id);
            }
            responder(200, ['ok' => true]);
            // no break

        case 'eliminar_recurrente':
            $id = (int) ($body['id'] ?? 0);
            $pdo->beginTransaction();
            borrarPendientesFuturos($id);
            $pdo->prepare('DELETE FROM fin_recurrentes WHERE id = ?')->execute([$id]);
            $pdo->commit();
            responder(200, ['ok' => true]);
            // no break

        default:
            responder(400, ['error' => 'Acción no válida.']);
    }
} catch (PDOException $e) {
    if ($e->getCode() === '23000') {
        if (db()->inTransaction()) {
            db()->rollBack();
        }
        responder(409, ['error' => 'Ya existe una con ese nombre.']);
    }
    errorFinanzas($e, 'finanzas-config', 'No se pudo guardar la configuración de finanzas.');
} catch (Throwable $e) {
    errorFinanzas($e, 'finanzas-config', 'No se pudo guardar la configuración de finanzas.');
}

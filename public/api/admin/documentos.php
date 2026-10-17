<?php
// /api/admin/documentos.php — cotizaciones, facturas exentas y boletas de honorarios.
//   GET ?id=N                                 → documento con ítems, cliente y emisor (para imprimir)
//   GET ?tipo=&estado=&buscar=&pagina=        → listado + conteos por tipo
//   GET ?config=1                             → datos del emisor y valores por defecto
//   POST {accion:'guardar', documento, items} → crea o actualiza
//   POST {accion:'estado', id, estado}
//   POST {accion:'folio', id, folio}          → anota el folio del SII (pasa a «emitida»)
//   POST {accion:'convertir', id, a}          → cotización → factura_exenta | boleta_honorarios
//   POST {accion:'eliminar', id}
//   POST {accion:'config', config}            → guarda emisor, retención, validez y condiciones
require __DIR__ . '/_facturacion.php';
require_once __DIR__ . '/_clientes.php';

requiereAdmin();

const DOCUMENTOS_POR_PAGINA = 30;

function cargarDocumento(int $id): ?array
{
    $st = db()->prepare('SELECT d.*, c.nombre AS cliente FROM documentos d LEFT JOIN clientes c ON c.id = d.cliente_id WHERE d.id = ?');
    $st->execute([$id]);
    $d = $st->fetch();
    return $d ?: null;
}

function clienteParaDocumento(?int $id): ?array
{
    if (!$id) {
        return null;
    }
    $st = db()->prepare('SELECT * FROM clientes WHERE id = ?');
    $st->execute([$id]);
    $c = $st->fetch();
    if (!$c) {
        return null;
    }
    $contactos = contactosDe($id);
    $principal = $contactos[0] ?? null;
    return [
        'id' => (int) $c['id'],
        'nombre' => $c['nombre'],
        'rut' => $c['rut'],
        'giro' => $c['giro'],
        'direccion' => $c['direccion'],
        'comuna' => $c['comuna'],
        'ciudad' => $c['ciudad'],
        'email' => $c['email'] ?: ($principal['email'] ?? null),
        'telefono' => $c['telefono'] ?: ($principal['telefono'] ?? null),
        'contacto' => $principal['nombre'] ?? null,
    ];
}

try {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        if (!empty($_GET['config'])) {
            // Incluye la lista completa de clientes para el selector de los documentos.
            $clientes = db()->query("SELECT id, nombre, rut, estado FROM clientes ORDER BY estado = 'inactivo', nombre")->fetchAll();
            responder(200, facConfig() + ['clientes' => array_map(fn ($c) => [
                'id' => (int) $c['id'], 'nombre' => $c['nombre'], 'rut' => $c['rut'], 'inactivo' => $c['estado'] === 'inactivo',
            ], $clientes)]);
        }

        if (isset($_GET['id'])) {
            $d = cargarDocumento((int) $_GET['id']);
            if (!$d) {
                responder(404, ['error' => 'El documento no existe.']);
            }
            $derivados = db()->prepare('SELECT id, tipo, numero FROM documentos WHERE origen_id = ?');
            $derivados->execute([$d['id']]);
            $origen = $d['origen_id'] ? cargarDocumento((int) $d['origen_id']) : null;
            responder(200, [
                'documento' => documentoPublico($d),
                'items' => itemsDe((int) $d['id']),
                'cliente' => clienteParaDocumento($d['cliente_id'] !== null ? (int) $d['cliente_id'] : null),
                'config' => facConfig(),
                'origen' => $origen ? ['id' => (int) $origen['id'], 'codigo' => codigoDocumento($origen['tipo'], (int) $origen['numero'])] : null,
                'derivados' => array_map(fn ($x) => ['id' => (int) $x['id'], 'codigo' => codigoDocumento($x['tipo'], (int) $x['numero'])], $derivados->fetchAll()),
            ]);
        }

        // Listado
        $where = '1 = 1';
        $params = [];
        if (isset(DOC_TIPOS[$_GET['tipo'] ?? ''])) {
            $where .= ' AND d.tipo = ?';
            $params[] = $_GET['tipo'];
            if (in_array($_GET['estado'] ?? '', DOC_ESTADOS[$_GET['tipo']], true)) {
                $where .= ' AND d.estado = ?';
                $params[] = $_GET['estado'];
            }
        }
        $buscar = limpiar($_GET['buscar'] ?? '', 100);
        if ($buscar !== '') {
            $like = '%' . str_replace(['%', '_'], ['\%', '\_'], $buscar) . '%';
            $num = (int) preg_replace('/\D/', '', $buscar);
            $where .= ' AND (c.nombre LIKE ? OR d.referencia LIKE ? OR d.folio LIKE ?' . ($num ? ' OR d.numero = ?' : '') . ')';
            array_push($params, $like, $like, $like);
            if ($num) {
                $params[] = $num;
            }
        }
        $st = db()->prepare("SELECT COUNT(*) FROM documentos d LEFT JOIN clientes c ON c.id = d.cliente_id WHERE $where");
        $st->execute($params);
        $total = (int) $st->fetchColumn();
        $pagina = max(1, (int) ($_GET['pagina'] ?? 1));
        $offset = ($pagina - 1) * DOCUMENTOS_POR_PAGINA;
        $st = db()->prepare(
            "SELECT d.*, c.nombre AS cliente FROM documentos d LEFT JOIN clientes c ON c.id = d.cliente_id
             WHERE $where ORDER BY d.fecha DESC, d.id DESC LIMIT " . DOCUMENTOS_POR_PAGINA . " OFFSET $offset"
        );
        $st->execute($params);

        $conteo = ['cotizacion' => 0, 'factura_exenta' => 0, 'boleta_honorarios' => 0];
        foreach (db()->query('SELECT tipo, COUNT(*) n FROM documentos GROUP BY tipo')->fetchAll() as $f) {
            $conteo[$f['tipo']] = (int) $f['n'];
        }
        responder(200, [
            'documentos' => array_map('documentoPublico', $st->fetchAll()),
            'conteo' => $conteo,
            'pagina' => $pagina,
            'paginas' => max(1, (int) ceil($total / DOCUMENTOS_POR_PAGINA)),
        ]);
    }

    $body = requiereJson();
    $pdo = db();
    switch ($body['accion'] ?? '') {
        case 'guardar':
            $d = is_array($body['documento'] ?? null) ? $body['documento'] : [];
            $id = (int) ($d['id'] ?? 0);
            $existente = $id ? cargarDocumento($id) : null;
            if ($id && !$existente) {
                responder(404, ['error' => 'El documento ya no existe.']);
            }
            $tipo = $existente['tipo'] ?? ($d['tipo'] ?? '');
            if (!isset(DOC_TIPOS[$tipo])) {
                responder(400, ['error' => 'Tipo de documento no válido.']);
            }
            $modalidad = $tipo === 'cotizacion' ? (($d['modalidad'] ?? '') === 'honorarios' ? 'honorarios' : 'exenta') : ($tipo === 'boleta_honorarios' ? 'honorarios' : 'exenta');
            $clienteId = !empty($d['cliente_id']) ? (int) $d['cliente_id'] : null;
            if (!$clienteId) {
                responder(400, ['error' => 'Elige el cliente del documento.']);
            }
            $fecha = $d['fecha'] ?? '';
            if (!DateTimeImmutable::createFromFormat('!Y-m-d', $fecha)) {
                responder(400, ['error' => 'La fecha no es válida.']);
            }
            $vence = !empty($d['vence']) && DateTimeImmutable::createFromFormat('!Y-m-d', $d['vence']) ? $d['vence'] : null;
            $estado = in_array($d['estado'] ?? '', DOC_ESTADOS[$tipo], true) ? $d['estado'] : DOC_ESTADOS[$tipo][0];
            $pct = isset($d['retencion_pct']) && $d['retencion_pct'] !== '' && $d['retencion_pct'] !== null ? max(0, min(50, (float) $d['retencion_pct'])) : null;
            [$items, $tot] = calcularDocumento(
                is_array($body['items'] ?? null) ? $body['items'] : [],
                (int) preg_replace('/\D/', '', (string) ($d['descuento'] ?? 0)),
                $tipo,
                $modalidad,
                $pct
            );
            $datos = array_merge([
                'modalidad' => $modalidad,
                'cliente_id' => $clienteId,
                'fecha' => $fecha,
                'vence' => $vence,
                'estado' => $estado,
                'referencia' => limpiar($d['referencia'] ?? '', 150) ?: null,
                'folio' => $tipo !== 'cotizacion' ? (limpiar($d['folio'] ?? '', 20) ?: null) : null,
                'notas' => limpiar($d['notas'] ?? '', 5000) ?: null,
                'condiciones' => limpiar($d['condiciones'] ?? '', 5000) ?: null,
            ], $tot);

            $pdo->beginTransaction();
            if ($existente) {
                $sets = implode(', ', array_map(fn ($c) => "$c = ?", array_keys($datos)));
                $pdo->prepare("UPDATE documentos SET $sets WHERE id = ?")->execute([...array_values($datos), $id]);
            } else {
                $datos = ['tipo' => $tipo, 'numero' => siguienteNumero($tipo)] + $datos;
                $campos = implode(', ', array_keys($datos));
                $pdo->prepare("INSERT INTO documentos ($campos) VALUES (" . implode(', ', array_fill(0, count($datos), '?')) . ')')->execute(array_values($datos));
                $id = (int) $pdo->lastInsertId();
            }
            guardarItems($id, $items);
            $pdo->commit();
            responder(200, ['documento' => documentoPublico(cargarDocumento($id))]);
            // no break

        case 'estado':
            $d = cargarDocumento((int) ($body['id'] ?? 0));
            if (!$d) {
                responder(404, ['error' => 'El documento no existe.']);
            }
            if (!in_array($body['estado'] ?? '', DOC_ESTADOS[$d['tipo']], true)) {
                responder(400, ['error' => 'Estado no válido para este documento.']);
            }
            $pdo->prepare('UPDATE documentos SET estado = ? WHERE id = ?')->execute([$body['estado'], $d['id']]);
            responder(200, ['ok' => true]);
            // no break

        case 'folio':
            $d = cargarDocumento((int) ($body['id'] ?? 0));
            if (!$d || $d['tipo'] === 'cotizacion') {
                responder(400, ['error' => 'Solo las facturas y boletas llevan folio del SII.']);
            }
            $folio = limpiar($body['folio'] ?? '', 20);
            $estado = $folio !== '' && $d['estado'] === 'por_emitir' ? 'emitida' : $d['estado'];
            $pdo->prepare('UPDATE documentos SET folio = ?, estado = ? WHERE id = ?')->execute([$folio ?: null, $estado, $d['id']]);
            responder(200, ['ok' => true, 'estado' => $estado]);
            // no break

        case 'convertir':
            $origen = cargarDocumento((int) ($body['id'] ?? 0));
            $a = $body['a'] ?? '';
            if (!$origen || $origen['tipo'] !== 'cotizacion' || !in_array($a, ['factura_exenta', 'boleta_honorarios'], true)) {
                responder(400, ['error' => 'Solo una cotización se puede convertir en factura exenta o boleta de honorarios.']);
            }
            [$items, $tot] = calcularDocumento(itemsDe((int) $origen['id']), (int) $origen['descuento'], $a, $a === 'boleta_honorarios' ? 'honorarios' : 'exenta', null);
            $pdo->beginTransaction();
            $datos = array_merge([
                'tipo' => $a,
                'numero' => siguienteNumero($a),
                'modalidad' => $a === 'boleta_honorarios' ? 'honorarios' : 'exenta',
                'cliente_id' => $origen['cliente_id'],
                'fecha' => date('Y-m-d'),
                'estado' => 'por_emitir',
                'referencia' => $origen['referencia'],
                'notas' => $origen['notas'],
                'condiciones' => $origen['condiciones'],
                'origen_id' => $origen['id'],
            ], $tot);
            $campos = implode(', ', array_keys($datos));
            $pdo->prepare("INSERT INTO documentos ($campos) VALUES (" . implode(', ', array_fill(0, count($datos), '?')) . ')')->execute(array_values($datos));
            $nuevo = (int) $pdo->lastInsertId();
            guardarItems($nuevo, $items);
            $pdo->prepare("UPDATE documentos SET estado = 'aceptada' WHERE id = ?")->execute([$origen['id']]);
            $pdo->commit();
            responder(200, ['documento' => documentoPublico(cargarDocumento($nuevo))]);
            // no break

        case 'eliminar':
            $d = cargarDocumento((int) ($body['id'] ?? 0));
            if (!$d) {
                responder(404, ['error' => 'El documento no existe.']);
            }
            if ($d['tipo'] !== 'cotizacion' && in_array($d['estado'], ['emitida', 'pagada'], true)) {
                responder(409, ['error' => 'Un documento ya emitido en el SII no se elimina: márcalo como «Anulada» (y anúlalo también en el SII con una nota de crédito).']);
            }
            $pdo->prepare('DELETE FROM documentos WHERE id = ?')->execute([$d['id']]);
            borrarArchivoDocumento($d['archivo']);
            responder(200, ['ok' => true]);
            // no break

        case 'config':
            $c = is_array($body['config'] ?? null) ? $body['config'] : [];
            $e = is_array($c['emisor'] ?? null) ? $c['emisor'] : [];
            $emisor = [];
            foreach (['nombre' => 150, 'rut' => 12, 'giro' => 150, 'direccion' => 200, 'comuna' => 80, 'ciudad' => 80, 'email' => 160, 'telefono' => 40, 'sitio' => 100] as $campo => $max) {
                $emisor[$campo] = limpiar($e[$campo] ?? '', $max);
            }
            if ($emisor['rut'] !== '') {
                $emisor['rut'] = normalizarRut($emisor['rut']);
            }
            if ($emisor['email'] !== '' && !filter_var($emisor['email'], FILTER_VALIDATE_EMAIL)) {
                responder(400, ['error' => 'El correo del emisor no parece válido.']);
            }
            facGuardarAjuste('fac_emisor', json_encode($emisor, JSON_UNESCAPED_UNICODE));
            facGuardarAjuste('fac_retencion_honorarios', (string) max(0, min(50, (float) str_replace(',', '.', (string) ($c['retencion_honorarios'] ?? 15.25)))));
            facGuardarAjuste('fac_validez_cotizacion', (string) max(1, min(365, (int) ($c['validez_cotizacion'] ?? 15))));
            facGuardarAjuste('fac_condiciones', limpiar($c['condiciones'] ?? '', 5000));
            responder(200, facConfig());
            // no break

        default:
            responder(400, ['error' => 'Acción no válida.']);
    }
} catch (Throwable $e) {
    errorFacturacion($e, 'documentos', 'No se pudo procesar el documento.');
}

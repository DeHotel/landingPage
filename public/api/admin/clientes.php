<?php
// /api/admin/clientes.php
//   GET ?buscar=&estado=&pagina=            → listado paginado + conteo por estado
//   GET ?id=N                               → ficha completa con sus contactos y mensajes web
//   POST {accion:'guardar', cliente, contactos, desde_mensaje?} → crea o actualiza (si trae id)
//   POST {accion:'eliminar', id}            → borra el cliente y sus contactos
require __DIR__ . '/_clientes.php';

requiereAdmin();

const CLIENTES_POR_PAGINA = 25;

try {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        // Ficha de un cliente
        if (isset($_GET['id'])) {
            $st = db()->prepare('SELECT * FROM clientes WHERE id = ?');
            $st->execute([(int) $_GET['id']]);
            $c = $st->fetch();
            if (!$c) {
                responder(404, ['error' => 'El cliente no existe.']);
            }
            $msj = db()->prepare('SELECT id, tema, creado_en FROM contactos WHERE cliente_id = ? ORDER BY creado_en DESC');
            $msj->execute([$c['id']]);
            responder(200, [
                'cliente' => clientePublico($c),
                'contactos' => contactosDe((int) $c['id']),
                'mensajes' => array_map(fn ($m) => array_merge($m, ['id' => (int) $m['id']]), $msj->fetchAll()),
            ]);
        }

        // Listado
        $where = ['1 = 1'];
        $params = [];
        $estado = $_GET['estado'] ?? '';
        if (in_array($estado, CLIENTE_ESTADOS, true)) {
            $where[] = 'c.estado = ?';
            $params[] = $estado;
        }
        $buscar = limpiar($_GET['buscar'] ?? '', 100);
        if ($buscar !== '') {
            $like = '%' . str_replace(['%', '_'], ['\%', '\_'], $buscar) . '%';
            $rut = preg_replace('/[^0-9kK]/', '', $buscar);
            $where[] = '(c.nombre LIKE ? OR c.nombre_fantasia LIKE ? OR c.email LIKE ? OR c.comuna LIKE ?'
                . ' OR EXISTS (SELECT 1 FROM cliente_contactos k WHERE k.cliente_id = c.id AND (k.nombre LIKE ? OR k.email LIKE ?))'
                . ($rut !== '' ? ' OR REPLACE(c.rut, \'-\', \'\') LIKE ?' : '') . ')';
            array_push($params, $like, $like, $like, $like, $like, $like);
            if ($rut !== '') {
                $params[] = '%' . $rut . '%';
            }
        }
        $sqlWhere = implode(' AND ', $where);

        $st = db()->prepare("SELECT COUNT(*) FROM clientes c WHERE $sqlWhere");
        $st->execute($params);
        $total = (int) $st->fetchColumn();
        $pagina = max(1, (int) ($_GET['pagina'] ?? 1));
        $offset = ($pagina - 1) * CLIENTES_POR_PAGINA;

        $st = db()->prepare(
            "SELECT c.*,
                    (SELECT k.nombre FROM cliente_contactos k WHERE k.cliente_id = c.id ORDER BY k.principal DESC, k.id LIMIT 1) AS contacto_nombre,
                    (SELECT COUNT(*) FROM cliente_contactos k WHERE k.cliente_id = c.id) AS contactos
             FROM clientes c WHERE $sqlWhere
             ORDER BY c.nombre LIMIT " . CLIENTES_POR_PAGINA . " OFFSET $offset"
        );
        $st->execute($params);
        $lista = array_map(fn ($c) => array_merge(clientePublico($c), [
            'contacto_nombre' => $c['contacto_nombre'],
            'contactos' => (int) $c['contactos'],
        ]), $st->fetchAll());

        $conteo = ['todos' => 0, 'prospecto' => 0, 'activo' => 0, 'inactivo' => 0];
        foreach (db()->query('SELECT estado, COUNT(*) AS n FROM clientes GROUP BY estado')->fetchAll() as $f) {
            $conteo[$f['estado']] = (int) $f['n'];
            $conteo['todos'] += (int) $f['n'];
        }

        responder(200, [
            'clientes' => $lista,
            'conteo' => $conteo,
            'pagina' => $pagina,
            'paginas' => max(1, (int) ceil($total / CLIENTES_POR_PAGINA)),
            'total' => $total,
        ]);
    }

    $body = requiereJson();
    switch ($body['accion'] ?? '') {
        case 'guardar':
            $c = is_array($body['cliente'] ?? null) ? $body['cliente'] : [];
            $id = (int) ($c['id'] ?? 0);
            $tipo = in_array($c['tipo'] ?? '', CLIENTE_TIPOS, true) ? $c['tipo'] : 'empresa';
            $nombre = limpiar($c['nombre'] ?? '', 150);
            if ($nombre === '') {
                responder(400, ['error' => $tipo === 'empresa' ? 'Escribe la razón social.' : 'Escribe el nombre del cliente.']);
            }
            $datos = [
                'tipo' => $tipo,
                'nombre' => $nombre,
                'nombre_fantasia' => textoOpcional($c['nombre_fantasia'] ?? null, 150),
                'rut' => normalizarRut($c['rut'] ?? null),
                'giro' => $tipo === 'empresa' ? textoOpcional($c['giro'] ?? null, 150) : null,
                'email' => correoOpcional($c['email'] ?? null),
                'telefono' => textoOpcional($c['telefono'] ?? null, 40),
                'sitio_web' => sitioWeb($c['sitio_web'] ?? null),
                'direccion' => textoOpcional($c['direccion'] ?? null, 200),
                'comuna' => textoOpcional($c['comuna'] ?? null, 80),
                'ciudad' => textoOpcional($c['ciudad'] ?? null, 80),
                'region' => textoOpcional($c['region'] ?? null, 60),
                'estado' => in_array($c['estado'] ?? '', CLIENTE_ESTADOS, true) ? $c['estado'] : 'activo',
                'notas' => textoOpcional($c['notas'] ?? null, 10000),
            ];

            // Contactos: se validan todos antes de guardar nada.
            $contactos = [];
            foreach (is_array($body['contactos'] ?? null) ? $body['contactos'] : [] as $k) {
                $kn = limpiar($k['nombre'] ?? '', 120);
                if ($kn === '' && trim(($k['email'] ?? '') . ($k['telefono'] ?? '')) === '') {
                    continue; // fila vacía
                }
                if ($kn === '') {
                    responder(400, ['error' => 'Cada contacto necesita un nombre.']);
                }
                $contactos[] = [
                    'id' => (int) ($k['id'] ?? 0),
                    'nombre' => $kn,
                    'cargo' => textoOpcional($k['cargo'] ?? null, 100),
                    'email' => correoOpcional($k['email'] ?? null, "correo de $kn"),
                    'telefono' => textoOpcional($k['telefono'] ?? null, 40),
                    'principal' => !empty($k['principal']),
                ];
            }
            // Exactamente un contacto principal (el primero, si no se marcó ninguno).
            if ($contactos && !array_filter($contactos, fn ($k) => $k['principal'])) {
                $contactos[0]['principal'] = true;
            }
            $yaPrincipal = false;
            foreach ($contactos as &$k) {
                $k['principal'] = $k['principal'] && !$yaPrincipal;
                $yaPrincipal = $yaPrincipal || $k['principal'];
            }
            unset($k);

            $pdo = db();
            $pdo->beginTransaction();
            if ($id) {
                $existe = $pdo->prepare('SELECT id FROM clientes WHERE id = ?');
                $existe->execute([$id]);
                if (!$existe->fetchColumn()) {
                    $pdo->rollBack();
                    responder(404, ['error' => 'El cliente ya no existe.']);
                }
                $sets = implode(', ', array_map(fn ($campo) => "$campo = ?", array_keys($datos)));
                $pdo->prepare("UPDATE clientes SET $sets WHERE id = ?")->execute([...array_values($datos), $id]);
            } else {
                $campos = implode(', ', array_keys($datos));
                $marcas = implode(', ', array_fill(0, count($datos), '?'));
                $pdo->prepare("INSERT INTO clientes ($campos) VALUES ($marcas)")->execute(array_values($datos));
                $id = (int) $pdo->lastInsertId();
            }

            // Contactos: los que ya eran de este cliente se actualizan, los nuevos se agregan
            // y los que no vienen en la lista se borran.
            $st = $pdo->prepare('SELECT id FROM cliente_contactos WHERE cliente_id = ?');
            $st->execute([$id]);
            $existentes = array_map('intval', $st->fetchAll(PDO::FETCH_COLUMN));
            $actualizar = $pdo->prepare('UPDATE cliente_contactos SET nombre = ?, cargo = ?, email = ?, telefono = ?, principal = ? WHERE id = ?');
            $insertar = $pdo->prepare('INSERT INTO cliente_contactos (cliente_id, nombre, cargo, email, telefono, principal) VALUES (?, ?, ?, ?, ?, ?)');
            $conservar = [];
            foreach ($contactos as $k) {
                $fila = [$k['nombre'], $k['cargo'], $k['email'], $k['telefono'], $k['principal'] ? 1 : 0];
                if (in_array($k['id'], $existentes, true)) {
                    $actualizar->execute([...$fila, $k['id']]);
                    $conservar[] = $k['id'];
                } else {
                    $insertar->execute([$id, ...$fila]);
                    $conservar[] = (int) $pdo->lastInsertId();
                }
            }
            $sqlBorrar = 'DELETE FROM cliente_contactos WHERE cliente_id = ?' . ($conservar ? ' AND id NOT IN (' . implode(',', $conservar) . ')' : '');
            $pdo->prepare($sqlBorrar)->execute([$id]);

            // Si se creó desde un mensaje del formulario web, se vinculan.
            if (!empty($body['desde_mensaje'])) {
                $pdo->prepare("UPDATE contactos SET cliente_id = ?, estado = IF(estado = 'nuevo', 'contactado', estado) WHERE id = ?")
                    ->execute([$id, (int) $body['desde_mensaje']]);
            }
            $pdo->commit();

            $st = db()->prepare('SELECT * FROM clientes WHERE id = ?');
            $st->execute([$id]);
            responder(200, ['cliente' => clientePublico($st->fetch()), 'contactos' => contactosDe($id)]);
            // no break

        case 'eliminar':
            $id = (int) ($body['id'] ?? 0);
            $st = db()->prepare('DELETE FROM clientes WHERE id = ?');
            $st->execute([$id]);
            if ($st->rowCount() === 0) {
                responder(404, ['error' => 'El cliente no existe.']);
            }
            responder(200, ['ok' => true]);
            // no break

        default:
            responder(400, ['error' => 'Acción no válida.']);
    }
} catch (PDOException $e) {
    if (db()->inTransaction()) {
        db()->rollBack();
    }
    // 23000 = RUT repetido (índice único).
    if ($e->getCode() === '23000' && stripos($e->getMessage(), 'uq_clientes_rut') !== false) {
        responder(409, ['error' => 'Ya existe otro cliente con ese RUT.']);
    }
    errorClientes($e, 'clientes', 'No se pudo guardar el cliente.');
} catch (Throwable $e) {
    errorClientes($e, 'clientes', 'No se pudo procesar la solicitud.');
}

<?php
// /api/admin/mensajes.php — mensajes del formulario de contacto de la web.
//   GET ?estado=&pagina=                  → listado + conteo por estado
//   GET ?resumen=1                        → solo la cantidad de mensajes nuevos (para el menú)
//   POST {accion:'estado', id, estado}    → nuevo / contactado / descartado
//   POST {accion:'eliminar', id}
require __DIR__ . '/_clientes.php';

requiereAdmin();

const MENSAJES_POR_PAGINA = 20;

try {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        if (!empty($_GET['resumen'])) {
            responder(200, ['nuevos' => (int) db()->query("SELECT COUNT(*) FROM contactos WHERE estado = 'nuevo'")->fetchColumn()]);
        }

        $estado = $_GET['estado'] ?? 'nuevo';
        $where = in_array($estado, MENSAJE_ESTADOS, true) ? 'm.estado = ?' : '1 = 1';
        $params = in_array($estado, MENSAJE_ESTADOS, true) ? [$estado] : [];

        $st = db()->prepare("SELECT COUNT(*) FROM contactos m WHERE $where");
        $st->execute($params);
        $total = (int) $st->fetchColumn();
        $pagina = max(1, (int) ($_GET['pagina'] ?? 1));
        $offset = ($pagina - 1) * MENSAJES_POR_PAGINA;

        $st = db()->prepare(
            "SELECT m.id, m.nombre, m.empresa, m.email, m.telefono, m.tema, m.mensaje, m.estado, m.creado_en,
                    m.cliente_id, c.nombre AS cliente_nombre
             FROM contactos m LEFT JOIN clientes c ON c.id = m.cliente_id
             WHERE $where ORDER BY m.creado_en DESC, m.id DESC
             LIMIT " . MENSAJES_POR_PAGINA . " OFFSET $offset"
        );
        $st->execute($params);
        $lista = array_map(fn ($m) => array_merge($m, [
            'id' => (int) $m['id'],
            'cliente_id' => $m['cliente_id'] !== null ? (int) $m['cliente_id'] : null,
        ]), $st->fetchAll());

        $conteo = ['todos' => 0, 'nuevo' => 0, 'contactado' => 0, 'descartado' => 0];
        foreach (db()->query('SELECT estado, COUNT(*) AS n FROM contactos GROUP BY estado')->fetchAll() as $f) {
            $conteo[$f['estado']] = (int) $f['n'];
            $conteo['todos'] += (int) $f['n'];
        }

        responder(200, [
            'mensajes' => $lista,
            'conteo' => $conteo,
            'pagina' => $pagina,
            'paginas' => max(1, (int) ceil($total / MENSAJES_POR_PAGINA)),
        ]);
    }

    $body = requiereJson();
    $id = (int) ($body['id'] ?? 0);
    switch ($body['accion'] ?? '') {
        case 'estado':
            $estado = $body['estado'] ?? '';
            if (!in_array($estado, MENSAJE_ESTADOS, true)) {
                responder(400, ['error' => 'Estado no válido.']);
            }
            db()->prepare('UPDATE contactos SET estado = ? WHERE id = ?')->execute([$estado, $id]);
            responder(200, ['ok' => true]);
            // no break
        case 'eliminar':
            db()->prepare('DELETE FROM contactos WHERE id = ?')->execute([$id]);
            responder(200, ['ok' => true]);
            // no break
        default:
            responder(400, ['error' => 'Acción no válida.']);
    }
} catch (Throwable $e) {
    errorClientes($e, 'mensajes', 'No se pudieron cargar los mensajes.');
}

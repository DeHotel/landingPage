<?php
// /api/admin/productos.php — catálogo de productos y servicios.
//   GET [?buscar=&todos=1]                       → lista (por defecto solo los activos)
//   POST {accion:'guardar', producto:{id?, nombre, descripcion, unidad, precio, activo}}
//   POST {accion:'eliminar', id}                 → los documentos que lo usaban conservan el texto
require __DIR__ . '/_facturacion.php';

requiereAdmin();

function productoPublico(array $p): array
{
    return [
        'id' => (int) $p['id'],
        'nombre' => $p['nombre'],
        'descripcion' => $p['descripcion'],
        'unidad' => $p['unidad'],
        'precio' => (int) $p['precio'],
        'activo' => (bool) $p['activo'],
        'usos' => (int) ($p['usos'] ?? 0),
    ];
}

try {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $where = empty($_GET['todos']) ? 'p.activo = 1' : '1 = 1';
        $params = [];
        $buscar = limpiar($_GET['buscar'] ?? '', 100);
        if ($buscar !== '') {
            $where .= ' AND (p.nombre LIKE ? OR p.descripcion LIKE ?)';
            $like = '%' . str_replace(['%', '_'], ['\%', '\_'], $buscar) . '%';
            array_push($params, $like, $like);
        }
        $st = db()->prepare(
            "SELECT p.*, (SELECT COUNT(*) FROM documento_items i WHERE i.producto_id = p.id) AS usos
             FROM productos p WHERE $where ORDER BY p.activo DESC, p.nombre"
        );
        $st->execute($params);
        responder(200, ['productos' => array_map('productoPublico', $st->fetchAll())]);
    }

    $body = requiereJson();
    switch ($body['accion'] ?? '') {
        case 'guardar':
            $p = is_array($body['producto'] ?? null) ? $body['producto'] : [];
            $nombre = limpiar($p['nombre'] ?? '', 150);
            if ($nombre === '') {
                responder(400, ['error' => 'Escribe el nombre del producto o servicio.']);
            }
            $datos = [
                'nombre' => $nombre,
                'descripcion' => limpiar($p['descripcion'] ?? '', 2000) ?: null,
                'unidad' => limpiar($p['unidad'] ?? '', 30) ?: 'unidad',
                'precio' => (int) preg_replace('/\D/', '', (string) ($p['precio'] ?? 0)),
                'activo' => array_key_exists('activo', $p) ? (!empty($p['activo']) ? 1 : 0) : 1,
            ];
            $id = (int) ($p['id'] ?? 0);
            if ($id) {
                $sets = implode(', ', array_map(fn ($c) => "$c = ?", array_keys($datos)));
                db()->prepare("UPDATE productos SET $sets WHERE id = ?")->execute([...array_values($datos), $id]);
            } else {
                $campos = implode(', ', array_keys($datos));
                db()->prepare("INSERT INTO productos ($campos) VALUES (" . implode(', ', array_fill(0, count($datos), '?')) . ')')->execute(array_values($datos));
                $id = (int) db()->lastInsertId();
            }
            $st = db()->prepare('SELECT * FROM productos WHERE id = ?');
            $st->execute([$id]);
            responder(200, ['producto' => productoPublico($st->fetch())]);
            // no break
        case 'eliminar':
            db()->prepare('DELETE FROM productos WHERE id = ?')->execute([(int) ($body['id'] ?? 0)]);
            responder(200, ['ok' => true]);
            // no break
        default:
            responder(400, ['error' => 'Acción no válida.']);
    }
} catch (Throwable $e) {
    errorFacturacion($e, 'productos', 'No se pudo guardar el producto.');
}

<?php
// Utilidades de productos, cotizaciones y facturación.
// Las facturas y boletas son REGISTROS: el documento tributario se emite en el SII.
require_once __DIR__ . '/_auth.php';

const DOC_TIPOS = [
    'cotizacion' => ['prefijo' => 'COT', 'nombre' => 'Cotización'],
    'factura_exenta' => ['prefijo' => 'FEX', 'nombre' => 'Factura exenta'],
    'boleta_honorarios' => ['prefijo' => 'BHE', 'nombre' => 'Boleta de honorarios'],
];
const DOC_ESTADOS = [
    'cotizacion' => ['borrador', 'enviada', 'aceptada', 'rechazada'],
    'factura_exenta' => ['por_emitir', 'emitida', 'pagada', 'anulada'],
    'boleta_honorarios' => ['por_emitir', 'emitida', 'pagada', 'anulada'],
];
const DOC_ARCHIVO_MAX = 10 * 1024 * 1024;

function facAjuste(string $clave, ?string $defecto = null): ?string
{
    $st = db()->prepare('SELECT valor FROM ajustes WHERE clave = ?');
    $st->execute([$clave]);
    $v = $st->fetchColumn();
    return $v === false ? $defecto : $v;
}

function facGuardarAjuste(string $clave, ?string $valor): void
{
    db()->prepare('INSERT INTO ajustes (clave, valor) VALUES (?, ?) ON DUPLICATE KEY UPDATE valor = VALUES(valor)')
        ->execute([$clave, $valor]);
}

// Configuración de facturación (emisor y valores por defecto).
function facConfig(): array
{
    $emisor = json_decode((string) facAjuste('fac_emisor', '{}'), true) ?: [];
    return [
        'emisor' => array_merge([
            'nombre' => '', 'rut' => '', 'giro' => '', 'direccion' => '', 'comuna' => '',
            'ciudad' => '', 'email' => '', 'telefono' => '', 'sitio' => 'dehotel.cl',
        ], $emisor),
        'retencion_honorarios' => (float) facAjuste('fac_retencion_honorarios', '15.25'),
        'validez_cotizacion' => (int) facAjuste('fac_validez_cotizacion', '15'),
        'condiciones' => (string) facAjuste('fac_condiciones', ''),
    ];
}

function codigoDocumento(string $tipo, int $numero): string
{
    return DOC_TIPOS[$tipo]['prefijo'] . '-' . str_pad((string) $numero, 4, '0', STR_PAD_LEFT);
}

// Una cotización "honorarios" o una boleta de honorarios llevan retención.
function llevaRetencion(string $tipo, string $modalidad): bool
{
    return $tipo === 'boleta_honorarios' || ($tipo === 'cotizacion' && $modalidad === 'honorarios');
}

/**
 * Normaliza las líneas y calcula los totales.
 * Devuelve [items, totales] con montos enteros en pesos.
 */
function calcularDocumento(array $itemsEntrada, int $descuento, string $tipo, string $modalidad, ?float $retencionPct): array
{
    $items = [];
    foreach ($itemsEntrada as $i => $it) {
        $descripcion = limpiar($it['descripcion'] ?? '', 300);
        if ($descripcion === '') {
            continue; // fila vacía
        }
        $cantidad = round((float) str_replace(',', '.', (string) ($it['cantidad'] ?? 1)), 2);
        $precio = (int) preg_replace('/\D/', '', (string) ($it['precio_unitario'] ?? 0));
        if ($cantidad <= 0 || $cantidad > 99999999) {
            responder(400, ['error' => "La cantidad de «{$descripcion}» no es válida."]);
        }
        $items[] = [
            'producto_id' => !empty($it['producto_id']) ? (int) $it['producto_id'] : null,
            'descripcion' => $descripcion,
            'cantidad' => $cantidad,
            'unidad' => limpiar($it['unidad'] ?? '', 30) ?: null,
            'precio_unitario' => $precio,
            'total' => (int) round($cantidad * $precio),
            'orden' => count($items),
        ];
    }
    if (!$items) {
        responder(400, ['error' => 'Agrega al menos un ítem con descripción.']);
    }
    $subtotal = array_sum(array_column($items, 'total'));
    $descuento = max(0, min($descuento, $subtotal));
    $total = $subtotal - $descuento;
    $pct = llevaRetencion($tipo, $modalidad) ? ($retencionPct ?? facConfig()['retencion_honorarios']) : null;
    $retencion = $pct !== null ? (int) round($total * $pct / 100) : 0;
    return [$items, [
        'subtotal' => $subtotal,
        'descuento' => $descuento,
        'total' => $total,
        'retencion_pct' => $pct,
        'retencion' => $retencion,
        'liquido' => $total - $retencion,
    ]];
}

function documentoPublico(array $d): array
{
    return [
        'id' => (int) $d['id'],
        'tipo' => $d['tipo'],
        'codigo' => codigoDocumento($d['tipo'], (int) $d['numero']),
        'numero' => (int) $d['numero'],
        'folio' => $d['folio'],
        'modalidad' => $d['modalidad'],
        'cliente_id' => $d['cliente_id'] !== null ? (int) $d['cliente_id'] : null,
        'cliente' => $d['cliente'] ?? null,
        'fecha' => $d['fecha'],
        'vence' => $d['vence'],
        'estado' => $d['estado'],
        'referencia' => $d['referencia'],
        'subtotal' => (int) $d['subtotal'],
        'descuento' => (int) $d['descuento'],
        'total' => (int) $d['total'],
        'retencion_pct' => $d['retencion_pct'] !== null ? (float) $d['retencion_pct'] : null,
        'retencion' => (int) $d['retencion'],
        'liquido' => (int) $d['liquido'],
        'notas' => $d['notas'],
        'condiciones' => $d['condiciones'],
        'origen_id' => $d['origen_id'] !== null ? (int) $d['origen_id'] : null,
        'archivo' => $d['archivo'] !== null,
        'archivo_nombre' => $d['archivo_nombre'],
        'creado_en' => $d['creado_en'],
    ];
}

function itemsDe(int $documentoId): array
{
    $st = db()->prepare('SELECT producto_id, descripcion, cantidad, unidad, precio_unitario, total FROM documento_items WHERE documento_id = ? ORDER BY orden, id');
    $st->execute([$documentoId]);
    return array_map(fn ($i) => [
        'producto_id' => $i['producto_id'] !== null ? (int) $i['producto_id'] : null,
        'descripcion' => $i['descripcion'],
        'cantidad' => (float) $i['cantidad'],
        'unidad' => $i['unidad'],
        'precio_unitario' => (int) $i['precio_unitario'],
        'total' => (int) $i['total'],
    ], $st->fetchAll());
}

function guardarItems(int $documentoId, array $items): void
{
    db()->prepare('DELETE FROM documento_items WHERE documento_id = ?')->execute([$documentoId]);
    $st = db()->prepare(
        'INSERT INTO documento_items (documento_id, producto_id, descripcion, cantidad, unidad, precio_unitario, total, orden)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    );
    foreach ($items as $it) {
        $st->execute([$documentoId, $it['producto_id'], $it['descripcion'], $it['cantidad'], $it['unidad'], $it['precio_unitario'], $it['total'], $it['orden']]);
    }
}

// Siguiente correlativo del tipo (el índice único evita repetidos si dos guardan a la vez).
function siguienteNumero(string $tipo): int
{
    $st = db()->prepare('SELECT COALESCE(MAX(numero), 0) + 1 FROM documentos WHERE tipo = ? FOR UPDATE');
    $st->execute([$tipo]);
    return (int) $st->fetchColumn();
}

// Carpeta privada de los PDF emitidos en el SII: al lado de public_html.
function carpetaDocumentos(): string
{
    $carpeta = dirname(rtrim($_SERVER['DOCUMENT_ROOT'] ?? dirname(__DIR__, 3), '/\\')) . '/dehotel_privado/documentos';
    if (!is_dir($carpeta) && !@mkdir($carpeta, 0750, true)) {
        throw new RuntimeException("No se pudo crear la carpeta de documentos: $carpeta");
    }
    if (!is_file("$carpeta/index.html")) {
        @file_put_contents("$carpeta/index.html", '');
        @file_put_contents("$carpeta/.htaccess", "Require all denied\n");
    }
    return $carpeta;
}

function borrarArchivoDocumento(?string $archivo): void
{
    if ($archivo && preg_match('/^[0-9a-f]{32}\.(pdf|jpg|png)$/', $archivo)) {
        $ruta = carpetaDocumentos() . '/' . $archivo;
        if (is_file($ruta)) {
            @unlink($ruta);
        }
    }
}

function errorFacturacion(Throwable $e, string $donde, string $porDefecto): void
{
    if (db()->inTransaction()) {
        db()->rollBack();
    }
    error_log("dehotel admin/$donde: " . $e->getMessage());
    if ($e instanceof PDOException && in_array($e->getCode(), ['42S02', '42S22'], true)) {
        responder(500, ['error' => 'Falta actualizar la base de datos: ejecuta database/008_facturacion.sql en phpMyAdmin.']);
    }
    responder(500, ['error' => $porDefecto]);
}

<?php
// Utilidades del módulo de clientes.
require_once __DIR__ . '/_auth.php';

const CLIENTE_ESTADOS = ['prospecto', 'activo', 'inactivo'];
const CLIENTE_TIPOS = ['empresa', 'persona'];
const MENSAJE_ESTADOS = ['nuevo', 'contactado', 'descartado'];

/**
 * "12.345.678-k" → "12345678-K". Devuelve null si está vacío.
 * Lanza un error 400 si el formato o el dígito verificador no son válidos.
 */
function normalizarRut(?string $rut): ?string
{
    $limpio = strtoupper(preg_replace('/[^0-9kK]/', '', (string) $rut));
    if ($limpio === '') {
        return null;
    }
    if (!preg_match('/^(\d{1,9})([0-9K])$/', $limpio, $m)) {
        responder(400, ['error' => 'El RUT no tiene un formato válido.']);
    }
    [$cuerpo, $dv] = [ltrim($m[1], '0'), $m[2]];
    if ($cuerpo === '' || digitoVerificador($cuerpo) !== $dv) {
        responder(400, ['error' => 'El RUT no es válido (revisa el dígito verificador).']);
    }
    return "$cuerpo-$dv";
}

// Módulo 11 del Servicio de Impuestos Internos.
function digitoVerificador(string $cuerpo): string
{
    $suma = 0;
    $factor = 2;
    for ($i = strlen($cuerpo) - 1; $i >= 0; $i--) {
        $suma += (int) $cuerpo[$i] * $factor;
        $factor = $factor === 7 ? 2 : $factor + 1;
    }
    $resto = 11 - ($suma % 11);
    return $resto === 11 ? '0' : ($resto === 10 ? 'K' : (string) $resto);
}

function correoOpcional($valor, string $campo = 'correo'): ?string
{
    $v = strtolower(limpiar($valor ?? '', 160));
    if ($v === '') {
        return null;
    }
    if (!filter_var($v, FILTER_VALIDATE_EMAIL)) {
        // Llaves obligatorias: sin ellas PHP lee "»" como parte del nombre de la variable.
        responder(400, ['error' => "El {$campo} «{$v}» no parece válido."]);
    }
    return $v;
}

function textoOpcional($valor, int $max): ?string
{
    $v = limpiar($valor ?? '', $max);
    return $v === '' ? null : $v;
}

function sitioWeb($valor): ?string
{
    $v = textoOpcional($valor, 200);
    if ($v !== null && !preg_match('#^https?://#i', $v)) {
        $v = 'https://' . $v;
    }
    return $v;
}

function clientePublico(array $c): array
{
    return [
        'id' => (int) $c['id'],
        'tipo' => $c['tipo'],
        'nombre' => $c['nombre'],
        'nombre_fantasia' => $c['nombre_fantasia'],
        'rut' => $c['rut'],
        'giro' => $c['giro'],
        'email' => $c['email'],
        'telefono' => $c['telefono'],
        'sitio_web' => $c['sitio_web'],
        'direccion' => $c['direccion'],
        'comuna' => $c['comuna'],
        'ciudad' => $c['ciudad'],
        'region' => $c['region'],
        'estado' => $c['estado'],
        'notas' => $c['notas'],
        'creado_en' => $c['creado_en'],
        'actualizado_en' => $c['actualizado_en'],
    ];
}

function contactosDe(int $clienteId): array
{
    $st = db()->prepare('SELECT id, nombre, cargo, email, telefono, principal FROM cliente_contactos WHERE cliente_id = ? ORDER BY principal DESC, id');
    $st->execute([$clienteId]);
    return array_map(fn ($k) => array_merge($k, ['id' => (int) $k['id'], 'principal' => (bool) $k['principal']]), $st->fetchAll());
}

function errorClientes(Throwable $e, string $donde, string $porDefecto): void
{
    error_log("dehotel admin/$donde: " . $e->getMessage());
    if ($e instanceof PDOException && in_array($e->getCode(), ['42S02', '42S22'], true)) {
        responder(500, ['error' => 'Falta actualizar la base de datos: ejecuta database/006_clientes.sql en phpMyAdmin.']);
    }
    responder(500, ['error' => $porDefecto]);
}

-- dehotel.cl · Finanzas: ingresos y egresos (panel de administración)
-- Ejecutar una vez con la base seleccionada (phpMyAdmin → pestaña SQL o Importar),
-- DESPUÉS de 006_clientes.sql. Usa el prefijo fin_ (no toca las tablas gtos_ existentes).
-- Los montos son en pesos chilenos, sin decimales.

-- Cuentas: separan las finanzas (ej. Personal y la empresa).
CREATE TABLE IF NOT EXISTS fin_cuentas (
  id         INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  nombre     VARCHAR(60)   NOT NULL,
  color      CHAR(7)       NOT NULL DEFAULT '#6366f1',
  activa     TINYINT(1)    NOT NULL DEFAULT 1,
  creado_en  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_fin_cuentas_nombre (nombre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Categorías de ingresos y de egresos.
CREATE TABLE IF NOT EXISTS fin_categorias (
  id         INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  tipo       ENUM('ingreso', 'egreso') NOT NULL,
  nombre     VARCHAR(60)   NOT NULL,
  creado_en  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_fin_categorias (tipo, nombre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Compromisos que se repiten: generan un movimiento "pendiente" en cada vencimiento.
CREATE TABLE IF NOT EXISTS fin_recurrentes (
  id            INT UNSIGNED      NOT NULL AUTO_INCREMENT,
  cuenta_id     INT UNSIGNED      NOT NULL,
  categoria_id  INT UNSIGNED      NULL,
  tipo          ENUM('ingreso', 'egreso') NOT NULL,
  descripcion   VARCHAR(150)      NOT NULL,
  monto         BIGINT            NOT NULL,
  frecuencia    ENUM('mensual', 'anual') NOT NULL DEFAULT 'mensual',
  dia_pago      TINYINT UNSIGNED  NOT NULL DEFAULT 1 COMMENT '1 a 31 (si el mes es más corto, se usa el último día)',
  inicio        DATE              NOT NULL COMMENT 'Fecha del primer vencimiento (cuota 1)',
  cuotas        SMALLINT UNSIGNED NULL COMMENT 'Total de cuotas (créditos); NULL = sin término',
  activo        TINYINT(1)        NOT NULL DEFAULT 1,
  notas         TEXT              NULL,
  creado_en     DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_fin_recurrentes_activo (activo),
  CONSTRAINT fk_fin_recurrentes_cuenta FOREIGN KEY (cuenta_id) REFERENCES fin_cuentas (id),
  CONSTRAINT fk_fin_recurrentes_categoria FOREIGN KEY (categoria_id) REFERENCES fin_categorias (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Movimientos de dinero (ingresos y egresos), pagados o pendientes.
CREATE TABLE IF NOT EXISTS fin_movimientos (
  id                  INT UNSIGNED      NOT NULL AUTO_INCREMENT,
  cuenta_id           INT UNSIGNED      NOT NULL,
  categoria_id        INT UNSIGNED      NULL,
  tipo                ENUM('ingreso', 'egreso') NOT NULL,
  fecha               DATE              NOT NULL COMMENT 'Fecha de pago o de vencimiento',
  descripcion         VARCHAR(150)      NOT NULL,
  monto               BIGINT            NOT NULL,
  estado              ENUM('pagado', 'pendiente') NOT NULL DEFAULT 'pagado',
  recurrente_id       INT UNSIGNED      NULL,
  periodo             VARCHAR(7)        NULL COMMENT 'Mes (AAAA-MM) o año (AAAA) del recurrente que lo generó',
  cuota               SMALLINT UNSIGNED NULL,
  cliente_id          INT UNSIGNED      NULL,
  notas               TEXT              NULL,
  comprobante         VARCHAR(40)       NULL COMMENT 'Nombre interno del archivo (carpeta privada)',
  comprobante_nombre  VARCHAR(150)      NULL COMMENT 'Nombre original del archivo',
  comprobante_mime    VARCHAR(40)       NULL,
  creado_en           DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en      DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_fin_movimientos_recurrente (recurrente_id, periodo),
  KEY idx_fin_movimientos_fecha (fecha),
  KEY idx_fin_movimientos_cuenta (cuenta_id, fecha),
  KEY idx_fin_movimientos_estado (estado, fecha),
  CONSTRAINT fk_fin_movimientos_cuenta FOREIGN KEY (cuenta_id) REFERENCES fin_cuentas (id),
  CONSTRAINT fk_fin_movimientos_categoria FOREIGN KEY (categoria_id) REFERENCES fin_categorias (id) ON DELETE SET NULL,
  CONSTRAINT fk_fin_movimientos_recurrente FOREIGN KEY (recurrente_id) REFERENCES fin_recurrentes (id) ON DELETE SET NULL,
  CONSTRAINT fk_fin_movimientos_cliente FOREIGN KEY (cliente_id) REFERENCES clientes (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Datos iniciales (se pueden cambiar o eliminar desde el panel).
INSERT IGNORE INTO fin_cuentas (nombre, color) VALUES
  ('Personal', '#22d3ee'),
  ('dehotel.cl', '#6366f1');

INSERT IGNORE INTO fin_categorias (tipo, nombre) VALUES
  ('ingreso', 'Remuneraciones'),
  ('ingreso', 'Ventas'),
  ('ingreso', 'Honorarios'),
  ('ingreso', 'Arriendos'),
  ('ingreso', 'Otros ingresos'),
  ('egreso', 'Gastos generales'),
  ('egreso', 'Créditos bancarios'),
  ('egreso', 'Internet'),
  ('egreso', 'Teléfono'),
  ('egreso', 'Luz'),
  ('egreso', 'Agua'),
  ('egreso', 'Gas'),
  ('egreso', 'Arriendo'),
  ('egreso', 'Supermercado'),
  ('egreso', 'Transporte y combustible'),
  ('egreso', 'Impuestos'),
  ('egreso', 'Hosting y software'),
  ('egreso', 'Otros gastos');

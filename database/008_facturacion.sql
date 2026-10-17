-- dehotel.cl · Productos y servicios, cotizaciones y facturación
-- Ejecutar una vez con la base seleccionada (phpMyAdmin → pestaña SQL o Importar),
-- DESPUÉS de 007_finanzas.sql. Montos en pesos chilenos, sin decimales.
-- Importante: las facturas y boletas aquí son REGISTROS; el documento tributario válido
-- se emite en el SII (o un proveedor certificado) y su folio/PDF se anota en el panel.

-- Catálogo de productos y servicios.
CREATE TABLE IF NOT EXISTS productos (
  id           INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  nombre       VARCHAR(150)  NOT NULL,
  descripcion  TEXT          NULL,
  unidad       VARCHAR(30)   NOT NULL DEFAULT 'unidad',
  precio       BIGINT        NOT NULL DEFAULT 0,
  activo       TINYINT(1)    NOT NULL DEFAULT 1,
  creado_en    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_productos_activo (activo, nombre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Documentos: cotizaciones, facturas exentas y boletas de honorarios.
CREATE TABLE IF NOT EXISTS documentos (
  id              INT UNSIGNED   NOT NULL AUTO_INCREMENT,
  tipo            ENUM('cotizacion', 'factura_exenta', 'boleta_honorarios') NOT NULL,
  numero          INT UNSIGNED   NOT NULL COMMENT 'Correlativo interno por tipo (COT-0001, FEX-0001, BHE-0001)',
  folio           VARCHAR(20)    NULL COMMENT 'Folio del SII (facturas y boletas, al emitirlas allá)',
  modalidad       ENUM('exenta', 'honorarios') NOT NULL DEFAULT 'exenta' COMMENT 'Cotizaciones: en qué documento terminará',
  cliente_id      INT UNSIGNED   NULL,
  fecha           DATE           NOT NULL,
  vence           DATE           NULL COMMENT 'Validez (cotización) o vencimiento de pago',
  estado          VARCHAR(20)    NOT NULL,
  referencia      VARCHAR(150)   NULL COMMENT 'Asunto o proyecto',
  subtotal        BIGINT         NOT NULL DEFAULT 0,
  descuento       BIGINT         NOT NULL DEFAULT 0,
  total           BIGINT         NOT NULL DEFAULT 0 COMMENT 'Monto bruto del documento',
  retencion_pct   DECIMAL(5,2)   NULL COMMENT 'Boletas de honorarios',
  retencion       BIGINT         NOT NULL DEFAULT 0,
  liquido         BIGINT         NOT NULL DEFAULT 0,
  notas           TEXT           NULL,
  condiciones     TEXT           NULL,
  origen_id       INT UNSIGNED   NULL COMMENT 'Cotización de la que proviene',
  archivo         VARCHAR(40)    NULL COMMENT 'PDF del SII (carpeta privada)',
  archivo_nombre  VARCHAR(150)   NULL,
  creado_en       DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en  DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_documentos_numero (tipo, numero),
  KEY idx_documentos_fecha (tipo, fecha),
  KEY idx_documentos_cliente (cliente_id),
  CONSTRAINT fk_documentos_cliente FOREIGN KEY (cliente_id) REFERENCES clientes (id) ON DELETE SET NULL,
  CONSTRAINT fk_documentos_origen FOREIGN KEY (origen_id) REFERENCES documentos (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Líneas de cada documento.
CREATE TABLE IF NOT EXISTS documento_items (
  id               INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  documento_id     INT UNSIGNED    NOT NULL,
  producto_id      INT UNSIGNED    NULL,
  descripcion      VARCHAR(300)    NOT NULL,
  cantidad         DECIMAL(10,2)   NOT NULL DEFAULT 1,
  unidad           VARCHAR(30)     NULL,
  precio_unitario  BIGINT          NOT NULL DEFAULT 0,
  total            BIGINT          NOT NULL DEFAULT 0,
  orden            SMALLINT        NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_documento_items_doc (documento_id, orden),
  CONSTRAINT fk_documento_items_doc FOREIGN KEY (documento_id) REFERENCES documentos (id) ON DELETE CASCADE,
  CONSTRAINT fk_documento_items_producto FOREIGN KEY (producto_id) REFERENCES productos (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Configuración inicial (se edita en el panel → Facturación → Datos del emisor).
-- Retención de boletas de honorarios 2026: 15,25 % (Ley 21.133, alza gradual). Revisar cada año.
INSERT IGNORE INTO ajustes (clave, valor) VALUES
  ('fac_retencion_honorarios', '15.25'),
  ('fac_validez_cotizacion', '15'),
  ('fac_condiciones', 'Valores en pesos chilenos. Forma de pago: 50% al aceptar la cotización y 50% contra entrega.');

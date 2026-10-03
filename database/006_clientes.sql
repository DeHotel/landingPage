-- dehotel.cl · Clientes (panel de administración)
-- Ejecutar una vez con la base seleccionada (phpMyAdmin → pestaña SQL o Importar),
-- DESPUÉS de 005_grupos.sql.

-- Clientes: empresas o personas naturales, con los datos que pide una factura electrónica.
CREATE TABLE IF NOT EXISTS clientes (
  id               INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  tipo             ENUM('empresa', 'persona') NOT NULL DEFAULT 'empresa',
  nombre           VARCHAR(150)  NOT NULL COMMENT 'Razón social (empresa) o nombre completo (persona)',
  nombre_fantasia  VARCHAR(150)  NULL,
  rut              VARCHAR(12)   NULL COMMENT 'Sin puntos, con guion: 12345678-9',
  giro             VARCHAR(150)  NULL,
  email            VARCHAR(160)  NULL,
  telefono         VARCHAR(40)   NULL,
  sitio_web        VARCHAR(200)  NULL,
  direccion        VARCHAR(200)  NULL,
  comuna           VARCHAR(80)   NULL,
  ciudad           VARCHAR(80)   NULL,
  region           VARCHAR(60)   NULL,
  estado           ENUM('prospecto', 'activo', 'inactivo') NOT NULL DEFAULT 'activo',
  notas            TEXT          NULL,
  creado_en        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_clientes_rut (rut),
  KEY idx_clientes_estado (estado),
  KEY idx_clientes_nombre (nombre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Personas de contacto de cada cliente (una puede ser la principal).
CREATE TABLE IF NOT EXISTS cliente_contactos (
  id          INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  cliente_id  INT UNSIGNED  NOT NULL,
  nombre      VARCHAR(120)  NOT NULL,
  cargo       VARCHAR(100)  NULL,
  email       VARCHAR(160)  NULL,
  telefono    VARCHAR(40)   NULL,
  principal   TINYINT(1)    NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_cliente_contactos_cliente (cliente_id),
  CONSTRAINT fk_cliente_contactos_cliente FOREIGN KEY (cliente_id) REFERENCES clientes (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Mensajes del formulario web: a qué cliente se convirtieron (si se convirtieron).
ALTER TABLE contactos
  ADD COLUMN cliente_id INT UNSIGNED NULL AFTER estado,
  ADD KEY idx_contactos_cliente (cliente_id),
  ADD CONSTRAINT fk_contactos_cliente FOREIGN KEY (cliente_id) REFERENCES clientes (id) ON DELETE SET NULL;

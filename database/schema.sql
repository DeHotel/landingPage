-- Esquema MySQL de dehotel.cl
-- Ejecutar una vez con la base ya seleccionada (en phpMyAdmin: clic en la base
-- del hosting → pestaña SQL o Importar). No crea la base: en hosting compartido
-- viene creada por el panel (ej. cde100242_dehotel).
--
-- Solo para un MySQL local (WAMP), crear antes la base con:
--   CREATE DATABASE dehotel_web CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Mensajes recibidos desde el formulario de contacto de la landing.
CREATE TABLE IF NOT EXISTS contactos (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nombre      VARCHAR(120)  NOT NULL,
  empresa     VARCHAR(120)  NULL,
  email       VARCHAR(160)  NOT NULL,
  telefono    VARCHAR(40)   NULL,
  tema        VARCHAR(60)   NOT NULL,
  mensaje     TEXT          NOT NULL,
  ip          VARCHAR(45)   NULL,
  user_agent  VARCHAR(255)  NULL,
  estado      ENUM('nuevo', 'contactado', 'descartado') NOT NULL DEFAULT 'nuevo',
  creado_en   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_contactos_creado (creado_en),
  KEY idx_contactos_estado (estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

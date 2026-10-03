-- dehotel.cl · Videos privados del panel de administración
-- Ejecutar una vez con la base seleccionada (phpMyAdmin → pestaña SQL o Importar).
-- Los archivos NO se guardan en la base: van a una carpeta privada fuera de public_html
-- (ver config.php → 'videos' → 'carpeta'). Aquí solo quedan sus datos.

CREATE TABLE IF NOT EXISTS videos (
  id              INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  nombre          VARCHAR(150)     NOT NULL,
  archivo         CHAR(32)         NOT NULL COMMENT 'Nombre interno al azar (sin extensión)',
  extension       VARCHAR(5)       NOT NULL,
  mime            VARCHAR(50)      NOT NULL,
  tamano          BIGINT UNSIGNED  NOT NULL COMMENT 'Bytes',
  recibido        BIGINT UNSIGNED  NOT NULL DEFAULT 0 COMMENT 'Bytes subidos (durante la subida)',
  duracion        INT UNSIGNED     NULL COMMENT 'Segundos',
  ancho           SMALLINT UNSIGNED NULL,
  alto            SMALLINT UNSIGNED NULL,
  tiene_portada   TINYINT(1)       NOT NULL DEFAULT 0,
  estado          ENUM('subiendo', 'listo') NOT NULL DEFAULT 'subiendo',
  subido_por      INT UNSIGNED     NULL,
  creado_en       DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en  DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_videos_archivo (archivo),
  KEY idx_videos_estado (estado, creado_en)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

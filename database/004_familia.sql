-- dehotel.cl · Acceso familiar a los videos (página /familia/)
-- Ejecutar una vez con la base seleccionada (phpMyAdmin → pestaña SQL o Importar),
-- DESPUÉS de 003_videos.sql.

-- Qué videos puede ver la familia (los existentes quedan visibles).
ALTER TABLE videos
  ADD COLUMN visible_familia TINYINT(1) NOT NULL DEFAULT 1 AFTER tiene_portada;

-- Ajustes generales del sitio (clave familiar encriptada, si está activo, etc.).
CREATE TABLE IF NOT EXISTS ajustes (
  clave           VARCHAR(50)   NOT NULL,
  valor           TEXT          NULL,
  actualizado_en  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (clave)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Ingresos a la página familiar (para ver quién entra y bloquear intentos repetidos).
CREATE TABLE IF NOT EXISTS familia_accesos (
  id            INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  ip            VARCHAR(45)   NULL,
  dispositivo   VARCHAR(20)   NULL,
  navegador     VARCHAR(40)   NULL,
  sistema       VARCHAR(40)   NULL,
  exito         TINYINT(1)    NOT NULL DEFAULT 0,
  creado_en     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_familia_accesos (ip, creado_en)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- dehotel.cl · Grupos de videos (panel y página familiar)
-- Ejecutar una vez con la base seleccionada (phpMyAdmin → pestaña SQL o Importar),
-- DESPUÉS de 004_familia.sql.

CREATE TABLE IF NOT EXISTS video_grupos (
  id         INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  nombre     VARCHAR(80)   NOT NULL,
  creado_en  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_video_grupos_nombre (nombre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Cada video puede estar en un grupo (o en ninguno). Al borrar un grupo,
-- sus videos quedan "Sin grupo" (no se borran).
ALTER TABLE videos
  ADD COLUMN grupo_id INT UNSIGNED NULL AFTER nombre,
  ADD KEY idx_videos_grupo (grupo_id),
  ADD CONSTRAINT fk_videos_grupo FOREIGN KEY (grupo_id) REFERENCES video_grupos (id) ON DELETE SET NULL;

-- dehotel.cl · Conteo de visitas y acceso de administrador
-- Ejecutar una vez con la base seleccionada (phpMyAdmin → pestaña SQL o Importar).

-- Cada apertura de la landing (no se guardan bots ni las visitas del administrador).
CREATE TABLE IF NOT EXISTS visitas (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  creado_en     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ip            VARCHAR(45)   NULL,
  visitante     CHAR(36)      NULL COMMENT 'Id anónimo guardado en el navegador (localStorage)',
  pagina        VARCHAR(255)  NULL,
  referencia    VARCHAR(255)  NULL COMMENT 'Sitio de origen (document.referrer)',
  utm_fuente    VARCHAR(100)  NULL,
  dispositivo   VARCHAR(20)   NULL,
  navegador     VARCHAR(40)   NULL,
  sistema       VARCHAR(40)   NULL,
  user_agent    VARCHAR(255)  NULL,
  PRIMARY KEY (id),
  KEY idx_visitas_creado (creado_en),
  KEY idx_visitas_visitante (visitante),
  KEY idx_visitas_ip (ip)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Usuarios del panel de administración. La clave se guarda con password_hash() (bcrypt).
CREATE TABLE IF NOT EXISTS admin_usuarios (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nombre          VARCHAR(120)  NOT NULL,
  email           VARCHAR(160)  NOT NULL,
  clave_hash      VARCHAR(255)  NOT NULL,
  activo          TINYINT(1)    NOT NULL DEFAULT 1,
  ultimo_acceso   DATETIME      NULL,
  creado_en       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_admin_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Intentos de inicio de sesión (para bloquear ataques de fuerza bruta).
CREATE TABLE IF NOT EXISTS admin_intentos (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  ip          VARCHAR(45)   NULL,
  email       VARCHAR(160)  NULL,
  exito       TINYINT(1)    NOT NULL DEFAULT 0,
  creado_en   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_intentos_ip (ip, creado_en)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

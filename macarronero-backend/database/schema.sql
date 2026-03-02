
-- Esquema de tablas para la base de datos macarronero.
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin', 'customer') NOT NULL DEFAULT 'customer',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS courses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(160) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  tier ENUM('basic', 'premium') NOT NULL DEFAULT 'basic',
  level ENUM('beginner', 'intermediate', 'advanced') NOT NULL DEFAULT 'beginner',
  cover_url VARCHAR(512),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS kits (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  stock INT NOT NULL DEFAULT 0,
  image_url VARCHAR(512),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Suscripciones de usuarios: normal (cursos basicos) o premium (1 curso premium al mes)
CREATE TABLE IF NOT EXISTS subscriptions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  plan ENUM('normal', 'premium') NOT NULL,
  status ENUM('active', 'cancelled', 'expired') NOT NULL DEFAULT 'active',
  stripe_subscription_id VARCHAR(255) UNIQUE,
  stripe_customer_id VARCHAR(255),
  current_period_start TIMESTAMP NULL,
  current_period_end TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_subs_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- Curso premium elegido por el usuario para cada periodo de suscripcion
CREATE TABLE IF NOT EXISTS premium_selections (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  course_id INT NOT NULL,
  period_start DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_selection (user_id, period_start),
  CONSTRAINT fk_psel_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_psel_course FOREIGN KEY (course_id) REFERENCES courses (id) ON DELETE CASCADE
);

-- Lecciones de cada curso (solo visibles para usuarios inscritos)
CREATE TABLE IF NOT EXISTS lessons (
  id INT AUTO_INCREMENT PRIMARY KEY,
  course_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT,
  video_url VARCHAR(512),
  order_index INT NOT NULL DEFAULT 1,
  duration_min INT DEFAULT NULL,
  CONSTRAINT fk_lesson_course FOREIGN KEY (course_id) REFERENCES courses (id) ON DELETE CASCADE
);

-- Cursos comprados directamente por el usuario (pago unico)
CREATE TABLE IF NOT EXISTS enrollments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  course_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_enrollment (user_id, course_id),
  CONSTRAINT fk_enroll_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_enroll_course FOREIGN KEY (course_id) REFERENCES courses (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS kit_purchases (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  kit_id INT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  total_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_purchases_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_purchases_kit FOREIGN KEY (kit_id) REFERENCES kits (id) ON DELETE CASCADE
);

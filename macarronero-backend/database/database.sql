CREATE DATABASE IF NOT EXISTS macarronero;
USE macarronero;

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
  level ENUM('beginner', 'intermediate', 'advanced') NOT NULL DEFAULT 'beginner',
  cover_url VARCHAR(512),
  stripe_price_id VARCHAR(128),
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

CREATE TABLE IF NOT EXISTS enrollments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  course_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_enrollment (user_id, course_id),
  CONSTRAINT fk_enrollments_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_enrollments_course FOREIGN KEY (course_id) REFERENCES courses (id) ON DELETE CASCADE
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

CREATE TABLE IF NOT EXISTS course_payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  course_id INT NOT NULL,
  stripe_session_id VARCHAR(255) NOT NULL UNIQUE,
  stripe_payment_intent VARCHAR(255),
  amount_total DECIMAL(10, 2) NOT NULL DEFAULT 0,
  currency VARCHAR(10) NOT NULL DEFAULT 'usd',
  status ENUM('pending', 'paid', 'failed') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_course_payments_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_course_payments_course FOREIGN KEY (course_id) REFERENCES courses (id) ON DELETE CASCADE
);

-- Datos de ejemplo para cursos
INSERT INTO courses (title, description, price, level, cover_url) VALUES
  ('Pasta Fresca Tradicional', 'Aprende las tecnicas fundamentales para hacer pasta fresca desde cero. Incluye recetas clasicas italianas y ejercicios practicos guiados.', 29.99, 'beginner', NULL),
  ('Rellenos y Salsas Especiales', 'Domina el arte de los rellenos para ravioli, tortellini y agnolotti. Elabora salsas que complementen perfectamente tus pastas.', 39.99, 'intermediate', NULL),
  ('Pasta Gourmet y Presentacion', 'Tecnicas avanzadas de pasta artesanal, emplatado profesional y combinaciones innovadoras para impresionar en cualquier ocasion.', 49.99, 'advanced', NULL);

-- Datos de ejemplo para kits
INSERT INTO kits (name, description, price, stock, image_url) VALUES
  ('Kit Basico de Pasta', 'Incluye rodillo de madera, cortador y recetario con 10 preparaciones clasicas. Ideal para principiantes.', 24.99, 50, NULL),
  ('Kit Profesional Completo', 'Set profesional con maquina de pasta manual, 5 accesorios intercambiables, rodillo profesional y libro de recetas avanzadas.', 89.99, 25, NULL),
  ('Kit de Rellenos Premium', 'Moldes especiales para ravioli, tortellini y agnolotti. Incluye manga pastelera y boquillas para rellenos precisos.', 44.99, 30, NULL);

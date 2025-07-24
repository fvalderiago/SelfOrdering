CREATE DATABASE IF NOT EXISTS self_ordering CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE self_ordering;

/* ---------- core tables ---------- */
CREATE TABLE products (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(120) NOT NULL,
  description TEXT,
  price       DECIMAL(10,2) NOT NULL,
  image_url   VARCHAR(255),
  is_active   TINYINT(1) DEFAULT 1,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE orders (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  customer    VARCHAR(120) NOT NULL,
  phone       VARCHAR(40),
  total       DECIMAL(10,2) NOT NULL DEFAULT 0,
  status      ENUM('PENDING','PAID','IN_PROGRESS','READY','COMPLETED','CANCELLED') DEFAULT 'PENDING',
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE order_items (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  order_id    INT NOT NULL,
  product_id  INT NOT NULL,
  qty         INT NOT NULL DEFAULT 1,
  price       DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (order_id)  REFERENCES orders(id)   ON DELETE CASCADE,
  FOREIGN KEY (product_id)REFERENCES products(id) ON DELETE CASCADE
);

/* ---------- seed data ---------- */
INSERT INTO products (name, description, price, image_url) VALUES
('Margherita Pizza', 'Classic tomato, mozzarella, basil.', 12.50, '/img/margherita.jpg'),
('Pepperoni Pizza',  'Pepperoni & mozzarella.', 14.00, '/img/pepperoni.jpg'),
('Fries',            'Crispy golden fries.', 4.00, '/img/fries.jpg');

-- =============================================================================
-- Schema toko_batik (disederhanakan)
-- Tabel info_toko dan kontak dibuang sesuai permintaan
-- Database: MySQL
-- =============================================================================

CREATE DATABASE IF NOT EXISTS toko_batik CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE toko_batik;

-- -----------------------------
-- Table: users
-- -----------------------------
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nama_d VARCHAR(50) NOT NULL,
  nama_b VARCHAR(50) NOT NULL,
  kelamin TEXT NOT NULL,
  lahir TEXT NOT NULL,
  alamat TEXT NOT NULL,
  phone BIGINT NOT NULL,
  email VARCHAR(30) NOT NULL,
  role ENUM('admin', 'pembeli') NOT NULL DEFAULT 'pembeli',
  uname VARCHAR(30) NOT NULL,
  passwd VARCHAR(256) NOT NULL,
  foto VARCHAR(500) NOT NULL DEFAULT 'default.jpg',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_users_email (email),
  UNIQUE KEY uq_users_uname (uname)
) ENGINE=InnoDB;

-- -----------------------------
-- Table: produk
-- -----------------------------
CREATE TABLE IF NOT EXISTS produk (
  id_produk INT AUTO_INCREMENT PRIMARY KEY,
  nama_produk VARCHAR(255) NOT NULL,
  deskripsi TEXT NOT NULL,
  harga INT NOT NULL,
  gambar VARCHAR(500) NULL,
  kategori ENUM('Kemeja Batik', 'Dress Batik', 'Kain Batik') NOT NULL DEFAULT 'Kemeja Batik',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- -----------------------------
-- Table: pembelian
-- -----------------------------
CREATE TABLE IF NOT EXISTS pembelian (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_pembeli INT NOT NULL,
  id_produk INT NOT NULL,
  nama_pembeli VARCHAR(50) NULL,
  alamat_pembeli TEXT NULL,
  phone_pembeli BIGINT NULL,
  metode_pembayaran ENUM('Bank Transfer', 'COD') NOT NULL DEFAULT 'COD',
  pembayaran ENUM('Belum', 'Dibayar') NOT NULL DEFAULT 'Belum',
  pengiriman ENUM('JNT Express', 'JNE') NOT NULL DEFAULT 'JNT Express',
  status ENUM('Tertunda', 'Dikemas', 'Dikirim', 'Diterima', 'Selesai') NOT NULL DEFAULT 'Tertunda',
  catatan TEXT NULL,
  foto_bukti VARCHAR(500) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_pembelian_user FOREIGN KEY (id_pembeli) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_pembelian_produk FOREIGN KEY (id_produk) REFERENCES produk(id_produk) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- -----------------------------
-- Table: artikel
-- -----------------------------
CREATE TABLE IF NOT EXISTS artikel (
  id INT AUTO_INCREMENT PRIMARY KEY,
  judul VARCHAR(225) NOT NULL,
  ringkasan TEXT NOT NULL,
  isi TEXT NOT NULL,
  gambar VARCHAR(500) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- -----------------------------
-- Sample data (opsional)
-- -----------------------------
INSERT INTO users (nama_d, nama_b, kelamin, lahir, alamat, phone, email, role, uname, passwd, foto)
VALUES 
('Admin', 'Toko', 'Laki-laki', '1990-01-01', 'Jl. Contoh No.1', 81234567890, 'admin@toko.com', 'admin', 'admin', '$2b$10$examplehashedpassword', 'default.jpg'),
('Budi', 'Santoso', 'Laki-laki', '1995-05-15', 'Jl. Merdeka 10', 81234567891, 'budi@email.com', 'pembeli', 'budi', '$2b$10$examplehashedpassword', 'default.jpg');

INSERT INTO produk (nama_produk, deskripsi, harga, gambar, kategori) VALUES
('Kemeja Batik Parang Klasik', 'Kemeja batik tulis motif Parang klasik', 450000, NULL, 'Kemeja Batik'),
('Kemeja Batik Kawung Modern', 'Kemeja batik motif Kawung modern', 380000, NULL, 'Kemeja Batik'),
('Dress Batik Sidomukti', 'Dress batik motif Sidomukti elegan', 550000, NULL, 'Dress Batik'),
('Dress Batik Truntum', 'Dress batik motif Truntum', 520000, NULL, 'Dress Batik'),
('Kain Batik Tulis Solo 2,25m', 'Kain batik tulis Solo 2,25m', 750000, NULL, 'Kain Batik'),
('Kain Batik Cap Yogyakarta', 'Kain batik cap Yogyakarta', 280000, NULL, 'Kain Batik');

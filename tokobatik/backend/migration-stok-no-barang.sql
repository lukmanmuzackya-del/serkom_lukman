-- WAJIB dijalankan agar stok & no_barang bisa disimpan
-- Database: lihat .env DB_NAME (biasanya toko_online)

USE toko_online;

-- no_barang
SET @exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'produk' AND COLUMN_NAME = 'no_barang'
);
SET @sql := IF(@exists = 0,
  'ALTER TABLE produk ADD COLUMN no_barang VARCHAR(30) NULL AFTER id_produk',
  'SELECT "no_barang sudah ada" AS info');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- stok
SET @exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'produk' AND COLUMN_NAME = 'stok'
);
SET @sql := IF(@exists = 0,
  'ALTER TABLE produk ADD COLUMN stok INT NOT NULL DEFAULT 0 AFTER kategori',
  'SELECT "stok sudah ada" AS info');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

UPDATE produk
SET no_barang = CONCAT('LC-', LPAD(id_produk, 4, '0'))
WHERE no_barang IS NULL OR no_barang = '';

-- status batal
ALTER TABLE pembelian
  MODIFY COLUMN status ENUM('Tertunda','Dikemas','Dikirim','Diterima','Selesai','Dibatalkan')
  NOT NULL DEFAULT 'Tertunda';

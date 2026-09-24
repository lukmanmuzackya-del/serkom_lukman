USE toko_batik;

-- Kolom jumlah (qty) pada pembelian
SET @exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'pembelian' AND COLUMN_NAME = 'jumlah'
);
SET @sql := IF(@exists = 0,
  'ALTER TABLE pembelian ADD COLUMN jumlah INT NOT NULL DEFAULT 1 AFTER foto_bukti',
  'SELECT "jumlah sudah ada" AS info');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Isi jumlah dari catatan "Jumlah: N" jika masih 1
UPDATE pembelian
SET jumlah = CAST(
  REGEXP_SUBSTR(catatan, '[0-9]+') AS UNSIGNED
)
WHERE (jumlah IS NULL OR jumlah = 1)
  AND catatan REGEXP 'Jumlah:[[:space:]]*[0-9]+';

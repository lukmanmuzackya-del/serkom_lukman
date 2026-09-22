-- Izinkan status Dibatalkan (jalankan sekali)
-- Ganti nama database jika perlu

ALTER TABLE pembelian
  MODIFY COLUMN status ENUM(
    'Tertunda',
    'Dikemas',
    'Dikirim',
    'Diterima',
    'Selesai',
    'Dibatalkan'
  ) NOT NULL DEFAULT 'Tertunda';

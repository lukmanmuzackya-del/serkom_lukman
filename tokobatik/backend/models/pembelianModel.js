// backend/models/pembelianModel.js
// Model untuk tabel pembelian — hanya query database

const db = require("../config/db");

// Ambil semua pembelian + detail pembeli & produk (untuk admin)
const findAllPembelianWithDetail = () => {
  return new Promise((resolve, reject) => {
    db.query(
      `SELECT p.*, u.nama_d AS pembeli_nama_d, u.nama_b AS pembeli_nama_b, u.uname AS pembeli_uname,
              pr.nama_produk, pr.harga, pr.kategori AS kategori_produk, pr.kategori,
              pr.gambar AS produk_gambar, pr.gambar AS gambar_produk
       FROM pembelian p
       JOIN users u ON p.id_pembeli = u.id
       JOIN produk pr ON p.id_produk = pr.id_produk
       ORDER BY p.created_at DESC`,
      (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      }
    );
  });
};

// Ambil satu pembelian berdasarkan id (tanpa filter pembeli, untuk admin)
const findPembelianById = (id) => {
  return new Promise((resolve, reject) => {
    db.query(
      `SELECT p.*,
              u.nama_d AS pembeli_nama_d, u.nama_b AS pembeli_nama_b,
              pr.nama_produk, pr.harga, pr.gambar AS produk_gambar, pr.gambar AS gambar_produk, pr.gambar AS gambar_produk
       FROM pembelian p
       LEFT JOIN users u ON p.id_pembeli = u.id
       LEFT JOIN produk pr ON p.id_produk = pr.id_produk
       WHERE p.id = ?`,
      [id],
      (err, rows) => {
        if (err) return reject(err);
        resolve(rows[0]);
      }
    );
  });
};

// Update pembelian berdasarkan id (misal ubah status, pembayaran, foto_bukti, dll)
const updatePembelian = (id, data) => {
  const {
    nama_pembeli,
    alamat_pembeli,
    phone_pembeli,
    metode_pembayaran,
    pembayaran,
    pengiriman,
    status,
    catatan,
    foto_bukti,
  } = data;

  return new Promise((resolve, reject) => {
    db.query(
      `UPDATE pembelian SET
        nama_pembeli = ?, alamat_pembeli = ?, phone_pembeli = ?,
        metode_pembayaran = ?, pembayaran = ?, pengiriman = ?,
        status = ?, catatan = ?, foto_bukti = ?
       WHERE id = ?`,
      [
        nama_pembeli,
        alamat_pembeli,
        phone_pembeli,
        metode_pembayaran,
        pembayaran,
        pengiriman,
        status,
        catatan,
        foto_bukti,
        id,
      ],
      (err, result) => {
        if (err) return reject(err);
        resolve(result.affectedRows);
      }
    );
  });
};

// Hapus pembelian berdasarkan id
const deletePembelian = (id) => {
  return new Promise((resolve, reject) => {
    db.query("DELETE FROM pembelian WHERE id = ?", [id], (err, result) => {
      if (err) return reject(err);
      resolve(result.affectedRows);
    });
  });
};

// Tambah pembelian baru, kembalikan insertId
const insertPembelian = (data) => {
  const {
    id_pembeli,
    id_produk,
    nama_pembeli,
    alamat_pembeli,
    phone_pembeli,
    metode_pembayaran,
    pembayaran,
    pengiriman,
    status,
    catatan,
    foto_bukti,
    jumlah,
  } = data;

  const qty = Math.max(1, parseInt(jumlah, 10) || 1);

  return new Promise((resolve, reject) => {
    const tryWithJumlah = () => {
      db.query(
        `INSERT INTO pembelian
          (id_pembeli, id_produk, nama_pembeli, alamat_pembeli, phone_pembeli,
           metode_pembayaran, pembayaran, pengiriman, status, catatan, foto_bukti, jumlah)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id_pembeli, id_produk, nama_pembeli, alamat_pembeli, phone_pembeli,
          metode_pembayaran, pembayaran, pengiriman, status, catatan, foto_bukti, qty,
        ],
        (err, result) => {
          if (err && (err.code === "ER_BAD_FIELD_ERROR" || String(err.message || "").includes("jumlah"))) {
            return tryWithoutJumlah();
          }
          if (err) return reject(err);
          resolve(result.insertId);
        }
      );
    };

    const tryWithoutJumlah = () => {
      // Simpan qty di catatan jika kolom jumlah belum ada
      const catatanFinal =
        qty > 1
          ? `${catatan ? catatan + " | " : ""}Jumlah: ${qty}`
          : catatan;
      db.query(
        `INSERT INTO pembelian
          (id_pembeli, id_produk, nama_pembeli, alamat_pembeli, phone_pembeli,
           metode_pembayaran, pembayaran, pengiriman, status, catatan, foto_bukti)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id_pembeli, id_produk, nama_pembeli, alamat_pembeli, phone_pembeli,
          metode_pembayaran, pembayaran, pengiriman, status, catatanFinal, foto_bukti,
        ],
        (err, result) => {
          if (err) return reject(err);
          resolve(result.insertId);
        }
      );
    };

    tryWithJumlah();
  });
};

/** Update pesanan milik pembeli tertentu (bayar / konfirmasi diterima) */
const updatePembelianByPembeli = (id, id_pembeli, data) => {
  const fields = [];
  const params = [];
  if (data.metode_pembayaran != null) {
    fields.push("metode_pembayaran = ?");
    params.push(data.metode_pembayaran);
  }
  if (data.pembayaran != null) {
    fields.push("pembayaran = ?");
    params.push(data.pembayaran);
  }
  if (data.status != null) {
    fields.push("status = ?");
    params.push(data.status);
  }
  if (data.catatan != null) {
    fields.push("catatan = ?");
    params.push(data.catatan);
  }
  if (data.foto_bukti != null) {
    fields.push("foto_bukti = ?");
    params.push(data.foto_bukti);
  }
  if (data.jumlah != null) {
    fields.push("jumlah = ?");
    params.push(Math.max(1, parseInt(data.jumlah, 10) || 1));
  }
  if (!fields.length) {
    return Promise.resolve(0);
  }
  params.push(id, id_pembeli);
  return new Promise((resolve, reject) => {
    db.query(
      `UPDATE pembelian SET ${fields.join(", ")} WHERE id = ? AND id_pembeli = ?`,
      params,
      (err, result) => {
        if (err) return reject(err);
        resolve(result.affectedRows);
      }
    );
  });
};

// Ambil semua pembelian milik satu pembeli + detail produk
const findPembelianByPembeliIdWithDetail = (id_pembeli) => {
  return new Promise((resolve, reject) => {
    db.query(
      `SELECT p.*, pr.nama_produk, pr.harga, pr.gambar AS produk_gambar, pr.gambar AS gambar_produk
       FROM pembelian p
       JOIN produk pr ON p.id_produk = pr.id_produk
       WHERE p.id_pembeli = ?
       ORDER BY p.created_at DESC`,
      [id_pembeli],
      (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      }
    );
  });
};

// Ambil satu pembelian, khusus milik pembeli tertentu (cegah akses pesanan orang lain)
const findPembelianByIdAndPembeliId = (id, id_pembeli) => {
  return new Promise((resolve, reject) => {
    db.query(
      "SELECT * FROM pembelian WHERE id = ? AND id_pembeli = ?",
      [id, id_pembeli],
      (err, rows) => {
        if (err) return reject(err);
        resolve(rows[0]);
      }
    );
  });
};

// Statistik pembelian milik satu pembeli (total transaksi & jumlah per status)
const getStatsByPembeliId = (id_pembeli) => {
  return new Promise((resolve, reject) => {
    db.query(
      `SELECT
        COUNT(*) AS total_pembelian,
        SUM(status = 'Tertunda') AS total_menunggu,
        SUM(status IN ('Dikemas','Dikirim','Diterima')) AS total_proses,
        SUM(status = 'Selesai') AS total_selesai
       FROM pembelian
       WHERE id_pembeli = ?`,
      [id_pembeli],
      (err, rows) => {
        if (err) return reject(err);
        resolve(rows[0]);
      }
    );
  });
};

// Statistik keseluruhan untuk admin (total transaksi, per status, total pendapatan dari yang sudah dibayar)
const getAdminStats = () => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT
        (SELECT COUNT(*) FROM users WHERE role = 'pembeli') AS jumlah_pembeli,
        (SELECT COUNT(*) FROM produk) AS jumlah_produk,
        (SELECT COUNT(*) FROM artikel) AS jumlah_artikel,
        (SELECT COUNT(*) FROM pembelian) AS jumlah_transaksi,
        (SELECT COUNT(*) FROM pembelian) AS produk_terjual,
        (SELECT COALESCE(SUM(status IN ('Tertunda', 'Dikemas', 'Dikirim', 'Diterima')), 0) FROM pembelian) AS pesanan_aktif,
        (SELECT COALESCE(SUM(pembayaran = 'Belum'), 0) FROM pembelian) AS belum_dibayar,
        (SELECT COALESCE(SUM(
            CASE WHEN pembayaran = 'Dibayar'
              THEN COALESCE((SELECT pr.harga FROM produk pr WHERE pr.id_produk = pembelian.id_produk), 0)
              ELSE 0 END
          ), 0) FROM pembelian) AS total_pendapatan
    `;
    db.query(sql, (err, rows) => {
      if (err) return reject(err);
      const row = rows[0] || {};
      const toNum = (v) => (v == null ? 0 : Number(v) || 0);
      resolve({
        jumlah_pembeli: toNum(row.jumlah_pembeli),
        jumlah_produk: toNum(row.jumlah_produk),
        jumlah_artikel: toNum(row.jumlah_artikel),
        jumlah_transaksi: toNum(row.jumlah_transaksi),
        produk_terjual: toNum(row.produk_terjual),
        pesanan_aktif: toNum(row.pesanan_aktif),
        belum_dibayar: toNum(row.belum_dibayar),
        total_pendapatan: toNum(row.total_pendapatan),
      });
    });
  });
};

// Ambil beberapa pembelian terbaru (untuk dashboard admin), default 5
const getRecentPembelian = (limit = 5) => {
  const lim = Math.max(1, Math.min(50, parseInt(limit, 10) || 5));
  return new Promise((resolve, reject) => {
    db.query(
      `SELECT p.*,
              u.nama_d AS pembeli_nama_d, u.nama_b AS pembeli_nama_b,
              pr.nama_produk, pr.harga AS produk_harga
       FROM pembelian p
       LEFT JOIN users u ON p.id_pembeli = u.id
       LEFT JOIN produk pr ON p.id_produk = pr.id_produk
       ORDER BY p.created_at DESC
       LIMIT ${lim}`,
      (err, rows) => {
        if (err) return reject(err);
        resolve(rows || []);
      }
    );
  });
};

module.exports = {
  findAllPembelianWithDetail,
  findPembelianById,
  updatePembelian,
  deletePembelian,
  insertPembelian,
  updatePembelianByPembeli,
  findPembelianByPembeliIdWithDetail,
  findPembelianByIdAndPembeliId,
  getStatsByPembeliId,
  getAdminStats,
  getRecentPembelian,
};
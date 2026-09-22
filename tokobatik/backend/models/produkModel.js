// Model tabel produk — dengan stok & no_barang (opsional jika kolom belum ada)
const db = require("../config/db");

const findAllProduk = () => {
  return new Promise((resolve, reject) => {
    db.query("SELECT * FROM produk ORDER BY created_at DESC", (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
};

const findProdukById = (id) => {
  return new Promise((resolve, reject) => {
    db.query("SELECT * FROM produk WHERE id_produk = ?", [id], (err, rows) => {
      if (err) return reject(err);
      resolve(rows[0]);
    });
  });
};

const insertProduk = (produk) => {
  const {
    nama_produk,
    deskripsi,
    harga,
    gambar,
    kategori,
    stok = 0,
    no_barang = null,
  } = produk;
  return new Promise((resolve, reject) => {
    // Coba insert dengan stok; fallback tanpa stok jika kolom belum ada
    db.query(
      `INSERT INTO produk (nama_produk, deskripsi, harga, gambar, kategori, stok, no_barang)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [nama_produk, deskripsi, harga, gambar || null, kategori, Number(stok) || 0, no_barang],
      (err, result) => {
        if (err && (err.code === "ER_BAD_FIELD_ERROR" || String(err.message).includes("stok"))) {
          db.query(
            `INSERT INTO produk (nama_produk, deskripsi, harga, gambar, kategori)
             VALUES (?, ?, ?, ?, ?)`,
            [nama_produk, deskripsi, harga, gambar || null, kategori],
            (err2, result2) => {
              if (err2) return reject(err2);
              resolve(result2.insertId);
            }
          );
          return;
        }
        if (err) return reject(err);
        resolve(result.insertId);
      }
    );
  });
};

const updateProduk = (id, produk) => {
  const { nama_produk, deskripsi, harga, gambar, kategori, stok, no_barang } = produk;
  return new Promise((resolve, reject) => {
    const hasStok = stok !== undefined && stok !== null;
    if (hasStok) {
      db.query(
        `UPDATE produk SET
           nama_produk = ?, deskripsi = ?, harga = ?, gambar = ?, kategori = ?, stok = ?
         WHERE id_produk = ?`,
        [nama_produk, deskripsi, harga, gambar, kategori, Number(stok) || 0, id],
        (err, result) => {
          if (err && (err.code === "ER_BAD_FIELD_ERROR" || String(err.message).includes("stok"))) {
            db.query(
              `UPDATE produk SET
                 nama_produk = ?, deskripsi = ?, harga = ?, gambar = ?, kategori = ?
               WHERE id_produk = ?`,
              [nama_produk, deskripsi, harga, gambar, kategori, id],
              (err2, result2) => {
                if (err2) return reject(err2);
                resolve(result2.affectedRows);
              }
            );
            return;
          }
          if (err) return reject(err);
          resolve(result.affectedRows);
        }
      );
    } else {
      db.query(
        `UPDATE produk SET
           nama_produk = ?, deskripsi = ?, harga = ?, gambar = ?, kategori = ?
         WHERE id_produk = ?`,
        [nama_produk, deskripsi, harga, gambar, kategori, id],
        (err, result) => {
          if (err) return reject(err);
          resolve(result.affectedRows);
        }
      );
    }
  });
};

const deleteProduk = (id) => {
  return new Promise((resolve, reject) => {
    db.query("DELETE FROM produk WHERE id_produk = ?", [id], (err, result) => {
      if (err) return reject(err);
      resolve(result.affectedRows);
    });
  });
};

/** Kurangi stok atomik; gagal jika stok tidak cukup */
const decreaseStok = (id, qty = 1) => {
  const n = Math.max(1, parseInt(qty, 10) || 1);
  return new Promise((resolve, reject) => {
    db.query(
      `UPDATE produk SET stok = stok - ? WHERE id_produk = ? AND stok >= ?`,
      [n, id, n],
      (err, result) => {
        if (err) {
          if (err.code === "ER_BAD_FIELD_ERROR") return resolve(0); // kolom belum ada
          return reject(err);
        }
        resolve(result.affectedRows);
      }
    );
  });
};

/** Kembalikan stok (saat batal) */
const increaseStok = (id, qty = 1) => {
  const n = Math.max(1, parseInt(qty, 10) || 1);
  return new Promise((resolve, reject) => {
    db.query(
      `UPDATE produk SET stok = stok + ? WHERE id_produk = ?`,
      [n, id],
      (err, result) => {
        if (err) {
          if (err.code === "ER_BAD_FIELD_ERROR") return resolve(0);
          return reject(err);
        }
        resolve(result.affectedRows);
      }
    );
  });
};

module.exports = {
  findAllProduk,
  findProdukById,
  insertProduk,
  updateProduk,
  deleteProduk,
  decreaseStok,
  increaseStok,
};

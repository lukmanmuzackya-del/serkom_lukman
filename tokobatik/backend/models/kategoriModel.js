const db = require("../config/db");

function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
}

async function findAll() {
  return query("SELECT * FROM kategori ORDER BY nama ASC");
}

async function findById(id) {
  const rows = await query("SELECT * FROM kategori WHERE id = ?", [id]);
  return rows[0] || null;
}

async function findByNama(nama) {
  const rows = await query("SELECT * FROM kategori WHERE nama = ?", [nama]);
  return rows[0] || null;
}

async function insert({ nama, deskripsi }) {
  const result = await query("INSERT INTO kategori (nama, deskripsi) VALUES (?, ?)", [
    nama,
    deskripsi || null,
  ]);
  return result.insertId;
}

async function update(id, { nama, deskripsi }) {
  await query("UPDATE kategori SET nama = ?, deskripsi = ? WHERE id = ?", [
    nama,
    deskripsi || null,
    id,
  ]);
}

async function remove(id) {
  await query("DELETE FROM kategori WHERE id = ?", [id]);
}

async function countProdukByNama(nama) {
  const rows = await query("SELECT COUNT(*) AS total FROM produk WHERE kategori = ?", [nama]);
  return rows[0]?.total || 0;
}

module.exports = {
  findAll,
  findById,
  findByNama,
  insert,
  update,
  remove,
  countProdukByNama,
};

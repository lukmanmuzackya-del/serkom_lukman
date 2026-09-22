// backend/controllers/adminController.js
// CRUD produk + kelola user (role pembeli) + CRUD artikel + statistik & kelola pembelian + profil admin

const produkModel = require("../models/produkModel");
const usersModel = require("../models/usersModel");
const artikelModel = require("../models/artikelModel");
const pembelianModel = require("../models/pembelianModel");
const kategoriModel = require("../models/kategoriModel");

// Kategori sesuai ENUM kolom produk.kategori di database
const KATEGORI_VALID = ["Kemeja Batik", "Dress Batik", "Kain Batik"];

// ===================== CRUD PRODUK =====================

const listProduk = async (req, res) => {
  try {
    const produk = await produkModel.findAllProduk();
    return res.status(200).json({ produk });
  } catch (error) {
    console.error("Error listProduk:", error);
    return res.status(500).json({ message: "Terjadi kesalahan server" });
  }
};

const getProdukById = async (req, res) => {
  try {
    const { id } = req.params;
    const produk = await produkModel.findProdukById(id);

    if (!produk) {
      return res.status(404).json({ message: "Produk tidak ditemukan" });
    }

    return res.status(200).json({ produk });
  } catch (error) {
    console.error("Error getProdukById:", error);
    return res.status(500).json({ message: "Terjadi kesalahan server" });
  }
};

const createProduk = async (req, res) => {
  try {
    const { nama_produk, deskripsi, harga, gambar, kategori, stok } = req.body;

    if (!nama_produk || !deskripsi || harga === undefined || harga === null || harga === "" || !kategori) {
      return res.status(400).json({ message: "Field wajib belum lengkap (nama, deskripsi, harga, kategori)" });
    }

    {
      const rows = await kategoriModel.findAll().catch(() => []);
      const names = rows.map((r) => r.nama);
      const allowed = names.length ? names : KATEGORI_VALID;
      if (!allowed.includes(kategori)) {
        return res.status(400).json({
          message: `Kategori tidak valid. Pilihan: ${allowed.join(", ")}`,
        });
      }
    }

    const insertId = await produkModel.insertProduk({
      nama_produk,
      deskripsi,
      harga: parseInt(harga, 10),
      gambar: gambar || null,
      kategori,
      stok: stok != null && stok !== "" ? parseInt(stok, 10) : 10,
    });

    const produkBaru = await produkModel.findProdukById(insertId);
    return res.status(201).json({ message: "Produk berhasil ditambahkan", produk: produkBaru });
  } catch (error) {
    console.error("Error createProduk:", error);
    return res.status(500).json({ message: "Terjadi kesalahan server", error: error.message });
  }
};

const updateProduk = async (req, res) => {
  try {
    const { id } = req.params;
    const { nama_produk, deskripsi, harga, gambar, kategori, stok } = req.body;

    const existing = await produkModel.findProdukById(id);
    if (!existing) {
      return res.status(404).json({ message: "Produk tidak ditemukan" });
    }

    if (kategori) {
      const rows = await kategoriModel.findAll().catch(() => []);
      const names = rows.map((r) => r.nama);
      const allowed = names.length ? names : KATEGORI_VALID;
      if (!allowed.includes(kategori)) {
        return res.status(400).json({
          message: `Kategori tidak valid. Pilihan: ${allowed.join(", ")}`,
        });
      }
    }

    await produkModel.updateProduk(id, {
      nama_produk: nama_produk ?? existing.nama_produk,
      deskripsi: deskripsi ?? existing.deskripsi,
      harga: harga != null && harga !== "" ? parseInt(harga, 10) : existing.harga,
      gambar: gambar !== undefined ? gambar : existing.gambar,
      kategori: kategori ?? existing.kategori,
      stok: stok != null && stok !== "" ? parseInt(stok, 10) : (existing.stok ?? 0),
    });

    const produkUpdated = await produkModel.findProdukById(id);
    return res.status(200).json({ message: "Produk berhasil diperbarui", produk: produkUpdated });
  } catch (error) {
    console.error("Error updateProduk:", error);
    return res.status(500).json({ message: "Terjadi kesalahan server", error: error.message });
  }
};

const deleteProduk = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await produkModel.findProdukById(id);
    if (!existing) {
      return res.status(404).json({ message: "Produk tidak ditemukan" });
    }

    await produkModel.deleteProduk(id);

    return res.status(200).json({ message: "Produk berhasil dihapus" });
  } catch (error) {
    console.error("Error deleteProduk:", error);
    return res.status(500).json({ message: "Terjadi kesalahan server" });
  }
};

// ===================== KELOLA PEMBELI =====================

const listPembeli = async (req, res) => {
  try {
    const pembeli = await usersModel.findAllUsersByRole("pembeli");
    return res.status(200).json({ pembeli });
  } catch (error) {
    console.error("Error listPembeli:", error);
    return res.status(500).json({ message: "Terjadi kesalahan server" });
  }
};

const getPembeliById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await usersModel.findUserById(id);

    if (!user || user.role !== "pembeli") {
      return res.status(404).json({ message: "Pembeli tidak ditemukan" });
    }

    return res.status(200).json({ pembeli: user });
  } catch (error) {
    console.error("Error getPembeliById:", error);
    return res.status(500).json({ message: "Terjadi kesalahan server" });
  }
};

const createPembeli = async (req, res) => {
  try {
    const bcrypt = require("bcrypt");
    const {
      nama_d,
      nama_b,
      kelamin,
      lahir,
      alamat,
      phone,
      email,
      uname,
      passwd,
      foto,
    } = req.body;

    if (
      !nama_d || !nama_b || !kelamin || !lahir || !alamat ||
      !phone || !email || !uname || !passwd
    ) {
      return res.status(400).json({ message: "Semua field wajib diisi" });
    }

    const existingEmail = await usersModel.findUserByEmail(email);
    if (existingEmail) {
      return res.status(409).json({ message: "Email sudah terdaftar" });
    }

    // Cek username juga (sebelumnya hanya cek email)
    const existingUname = await usersModel.findUserByCredential(uname);
    if (existingUname) {
      return res.status(409).json({ message: "Username sudah dipakai" });
    }

    const hashedPasswd = await bcrypt.hash(passwd, 10);

    const insertId = await usersModel.createUser({
      nama_d,
      nama_b,
      kelamin,
      lahir,
      alamat,
      phone,
      email,
      role: "pembeli",
      uname,
      passwd: hashedPasswd,
      foto: foto || "default.png",
    });

    const pembeliBaru = await usersModel.findUserById(insertId);

    return res.status(201).json({ message: "Pembeli berhasil ditambahkan", pembeli: pembeliBaru });
  } catch (error) {
    console.error("Error createPembeli:", error);
    return res.status(500).json({ message: "Terjadi kesalahan server" });
  }
};

const updatePembeli = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await usersModel.findUserById(id);

    if (!existing || existing.role !== "pembeli") {
      return res.status(404).json({ message: "Pembeli tidak ditemukan" });
    }

    const {
      nama_d,
      nama_b,
      kelamin,
      lahir,
      alamat,
      phone,
      email,
      uname,
      foto,
    } = req.body;

    // Cek email/username tidak bentrok dengan user lain
    if (email && email !== existing.email) {
      const emailTaken = await usersModel.findUserByEmail(email);
      if (emailTaken) {
        return res.status(409).json({ message: "Email sudah dipakai user lain" });
      }
    }
    if (uname && uname !== existing.uname) {
      const unameTaken = await usersModel.findUserByCredential(uname);
      if (unameTaken) {
        return res.status(409).json({ message: "Username sudah dipakai user lain" });
      }
    }

    await usersModel.updateUserProfile(id, {
      nama_d: nama_d ?? existing.nama_d,
      nama_b: nama_b ?? existing.nama_b,
      kelamin: kelamin ?? existing.kelamin,
      lahir: lahir ?? existing.lahir,
      alamat: alamat ?? existing.alamat,
      phone: phone ?? existing.phone,
      email: email ?? existing.email,
      uname: uname ?? existing.uname,
      foto: foto ?? existing.foto,
    });

    const pembeliUpdated = await usersModel.findUserById(id);

    return res.status(200).json({ message: "Pembeli berhasil diperbarui", pembeli: pembeliUpdated });
  } catch (error) {
    console.error("Error updatePembeli:", error);
    return res.status(500).json({ message: "Terjadi kesalahan server" });
  }
};

const deletePembeli = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await usersModel.findUserById(id);

    if (!existing || existing.role !== "pembeli") {
      return res.status(404).json({ message: "Pembeli tidak ditemukan" });
    }

    await usersModel.deleteUser(id);

    return res.status(200).json({ message: "Pembeli berhasil dihapus" });
  } catch (error) {
    console.error("Error deletePembeli:", error);
    return res.status(500).json({ message: "Terjadi kesalahan server" });
  }
};

// ===================== CRUD ARTIKEL =====================

const listArtikel = async (req, res) => {
  try {
    const artikel = await artikelModel.findAllArtikel();
    return res.status(200).json({ artikel });
  } catch (error) {
    console.error("Error listArtikel:", error);
    return res.status(500).json({ message: "Terjadi kesalahan server" });
  }
};

const getArtikelById = async (req, res) => {
  try {
    const { id } = req.params;
    const artikel = await artikelModel.findArtikelById(id);

    if (!artikel) {
      return res.status(404).json({ message: "Artikel tidak ditemukan" });
    }

    return res.status(200).json({ artikel });
  } catch (error) {
    console.error("Error getArtikelById:", error);
    return res.status(500).json({ message: "Terjadi kesalahan server" });
  }
};

const createArtikel = async (req, res) => {
  try {
    const { judul, ringkasan, isi, gambar } = req.body;

    if (!judul || !ringkasan || !isi || !gambar) {
      return res.status(400).json({ message: "Semua field wajib diisi" });
    }

    const insertId = await artikelModel.insertArtikel({ judul, ringkasan, isi, gambar });
    const artikelBaru = await artikelModel.findArtikelById(insertId);

    return res.status(201).json({ message: "Artikel berhasil ditambahkan", artikel: artikelBaru });
  } catch (error) {
    console.error("Error createArtikel:", error);
    return res.status(500).json({ message: "Terjadi kesalahan server" });
  }
};

const updateArtikel = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await artikelModel.findArtikelById(id);

    if (!existing) {
      return res.status(404).json({ message: "Artikel tidak ditemukan" });
    }

    const { judul, ringkasan, isi, gambar } = req.body;

    await artikelModel.updateArtikel(id, {
      judul: judul ?? existing.judul,
      ringkasan: ringkasan ?? existing.ringkasan,
      isi: isi ?? existing.isi,
      gambar: gambar ?? existing.gambar,
    });

    const artikelUpdated = await artikelModel.findArtikelById(id);

    return res.status(200).json({ message: "Artikel berhasil diperbarui", artikel: artikelUpdated });
  } catch (error) {
    console.error("Error updateArtikel:", error);
    return res.status(500).json({ message: "Terjadi kesalahan server" });
  }
};

const deleteArtikel = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await artikelModel.findArtikelById(id);

    if (!existing) {
      return res.status(404).json({ message: "Artikel tidak ditemukan" });
    }

    await artikelModel.deleteArtikel(id);

    return res.status(200).json({ message: "Artikel berhasil dihapus" });
  } catch (error) {
    console.error("Error deleteArtikel:", error);
    return res.status(500).json({ message: "Terjadi kesalahan server" });
  }
};

// ===================== STATISTIK DASHBOARD =====================

const getStats = async (req, res) => {
  try {
    const stats = await pembelianModel.getAdminStats();
    const recent = await pembelianModel.getRecentPembelian(5);

    // Normalisasi transaksi terbaru untuk frontend
    const transaksi_terbaru = (recent || []).map((row) => ({
      id: row.id,
      nama_pembeli:
        row.nama_pembeli ||
        [row.pembeli_nama_d, row.pembeli_nama_b].filter(Boolean).join(" ") ||
        "—",
      nama_produk: row.nama_produk || "—",
      status: row.status || "—",
      pembayaran: row.pembayaran || "—",
      created_at: row.created_at,
      total: row.produk_harga || row.harga || 0,
    }));

    // Response datar + nested — frontend bisa baca keduanya
    return res.status(200).json({
      message: "OK",
      ...stats,
      transaksi_terbaru,
      stats: {
        ...stats,
        transaksi_terbaru,
      },
      recent: transaksi_terbaru,
    });
  } catch (error) {
    console.error("Error getStats:", error);
    return res.status(500).json({ message: "Terjadi kesalahan server", error: error.message });
  }
};

// ===================== KELOLA PEMBELIAN =====================

const listPembelian = async (req, res) => {
  try {
    const pembelian = await pembelianModel.findAllPembelianWithDetail();
    return res.status(200).json({ pembelian });
  } catch (error) {
    console.error("Error listPembelian:", error);
    return res.status(500).json({ message: "Terjadi kesalahan server" });
  }
};

const getPembelianById = async (req, res) => {
  try {
    const { id } = req.params;
    const pembelian = await pembelianModel.findPembelianById(id);

    if (!pembelian) {
      return res.status(404).json({ message: "Pembelian tidak ditemukan" });
    }

    return res.status(200).json({ pembelian });
  } catch (error) {
    console.error("Error getPembelianById:", error);
    return res.status(500).json({ message: "Terjadi kesalahan server" });
  }
};

const updatePembelian = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await pembelianModel.findPembelianById(id);

    if (!existing) {
      return res.status(404).json({ message: "Pembelian tidak ditemukan" });
    }

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
    } = req.body;

    // Validasi ENUM agar tidak merusak data di database
    const METODE_VALID = ["Bank Transfer", "COD"];
    const PENGIRIMAN_VALID = ["JNT Express", "JNE"];
    const PEMBAYARAN_VALID = ["Belum", "Dibayar"];
    const STATUS_VALID = ["Tertunda", "Dikemas", "Dikirim", "Diterima", "Selesai", "Dibatalkan"];

    if (metode_pembayaran && !METODE_VALID.includes(metode_pembayaran)) {
      return res.status(400).json({ message: `Metode pembayaran tidak valid. Pilihan: ${METODE_VALID.join(", ")}` });
    }
    if (pengiriman && !PENGIRIMAN_VALID.includes(pengiriman)) {
      return res.status(400).json({ message: `Pengiriman tidak valid. Pilihan: ${PENGIRIMAN_VALID.join(", ")}` });
    }
    if (pembayaran && !PEMBAYARAN_VALID.includes(pembayaran)) {
      return res.status(400).json({ message: `Status pembayaran tidak valid. Pilihan: ${PEMBAYARAN_VALID.join(", ")}` });
    }
    if (status && !STATUS_VALID.includes(status)) {
      return res.status(400).json({ message: `Status tidak valid. Pilihan: ${STATUS_VALID.join(", ")}` });
    }

    // Kembalikan stok jika admin membatalkan (hanya sekali)
    if (status === "Dibatalkan" && existing.status !== "Dibatalkan") {
      let qty = 1;
      if (existing.jumlah != null) qty = Math.max(1, Number(existing.jumlah) || 1);
      else {
        const m = String(existing.catatan || "").match(/Jumlah:\s*(\d+)/i);
        if (m) qty = Math.max(1, Number(m[1]) || 1);
      }
      try {
        await produkModel.increaseStok(existing.id_produk, qty);
      } catch (e) {
        console.error("Gagal restore stok admin:", e.message);
      }
    }

    await pembelianModel.updatePembelian(id, {
      nama_pembeli: nama_pembeli ?? existing.nama_pembeli,
      alamat_pembeli: alamat_pembeli ?? existing.alamat_pembeli,
      phone_pembeli: phone_pembeli ?? existing.phone_pembeli,
      metode_pembayaran: metode_pembayaran ?? existing.metode_pembayaran,
      pembayaran: pembayaran ?? existing.pembayaran,
      pengiriman: pengiriman ?? existing.pengiriman,
      status: status ?? existing.status,
      catatan: catatan ?? existing.catatan,
      foto_bukti: foto_bukti ?? existing.foto_bukti,
    });

    const pembelianUpdated = await pembelianModel.findPembelianById(id);

    return res.status(200).json({ message: "Pembelian berhasil diperbarui", pembelian: pembelianUpdated });
  } catch (error) {
    console.error("Error updatePembelian:", error);
    return res.status(500).json({ message: "Terjadi kesalahan server" });
  }
};

const deletePembelian = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await pembelianModel.findPembelianById(id);

    if (!existing) {
      return res.status(404).json({ message: "Pembelian tidak ditemukan" });
    }

    await pembelianModel.deletePembelian(id);

    return res.status(200).json({ message: "Pembelian berhasil dihapus" });
  } catch (error) {
    console.error("Error deletePembelian:", error);
    return res.status(500).json({ message: "Terjadi kesalahan server" });
  }
};

// ===================== PROFIL ADMIN =====================

// GET profil admin yang sedang login (req.user berasal dari middleware authenticate)
const getMyProfile = async (req, res) => {
  try {
    const admin = await usersModel.findUserById(req.user.id);

    if (!admin) {
      return res.status(404).json({ message: "Admin tidak ditemukan" });
    }

    // kirim sebagai "admin" dan "user" agar normalize frontend fleksibel
    return res.status(200).json({ user: admin });
  } catch (error) {
    console.error("Error getMyProfile:", error);
    return res.status(500).json({ message: "Terjadi kesalahan server" });
  }
};

// PUT update profil admin yang sedang login
const updateMyProfile = async (req, res) => {
  try {
    const existing = await usersModel.findUserById(req.user.id);
    if (!existing) {
      return res.status(404).json({ message: "Admin tidak ditemukan" });
    }

    const {
      nama_d, nama_b, kelamin, lahir, alamat, phone, email, uname, foto,
      passwd_lama, passwd_baru,
    } = req.body;

    // Ganti password (opsional)
    if (passwd_baru) {
      if (String(passwd_baru).length < 6) {
        return res.status(400).json({ message: "Password baru minimal 6 karakter" });
      }
      if (!passwd_lama) {
        return res.status(400).json({ message: "Password lama wajib diisi untuk ganti password" });
      }
      const bcrypt = require("bcrypt");
      const passwdHash = await usersModel.findPasswdHashById(req.user.id);
      const isMatch = await bcrypt.compare(passwd_lama, passwdHash || "");
      if (!isMatch) {
        return res.status(401).json({ message: "Password lama salah" });
      }
      const hashed = await bcrypt.hash(String(passwd_baru), 10);
      await usersModel.updatePasswd(req.user.id, hashed);
    }

    // Cek email/username tidak bentrok dengan user lain
    if (email && email !== existing.email) {
      const emailTaken = await usersModel.findUserByEmail(email);
      if (emailTaken) {
        return res.status(409).json({ message: "Email sudah dipakai user lain" });
      }
    }
    if (uname && uname !== existing.uname) {
      const unameTaken = await usersModel.findUserByCredential(uname);
      if (unameTaken) {
        return res.status(409).json({ message: "Username sudah dipakai user lain" });
      }
    }

    await usersModel.updateUserProfile(req.user.id, {
      nama_d: nama_d ?? existing.nama_d,
      nama_b: nama_b ?? existing.nama_b,
      kelamin: kelamin ?? existing.kelamin,
      lahir: lahir ?? existing.lahir,
      alamat: alamat ?? existing.alamat,
      phone: phone ?? existing.phone,
      email: email ?? existing.email,
      uname: uname ?? existing.uname,
      foto: foto ?? existing.foto,
    });

    const updated = await usersModel.findUserById(req.user.id);

    return res.status(200).json({
      message: "Profil berhasil diperbarui",
      user: updated,
    });
  } catch (error) {
    console.error("Error updateMyProfile:", error);
    return res.status(500).json({ message: "Terjadi kesalahan server", error: error.message });
  }
};


// ===================== CRUD KATEGORI =====================

const listKategori = async (req, res) => {
  try {
    let rows = await kategoriModel.findAll();
    if (!rows.length) {
      // fallback seed in-memory response if tabel kosong
      rows = KATEGORI_VALID.map((nama, i) => ({ id: i + 1, nama, deskripsi: null }));
    }
    return res.status(200).json({ kategori: rows });
  } catch (error) {
    console.error("Error listKategori:", error);
    // Jika tabel belum ada, kembalikan fallback
    return res.status(200).json({
      kategori: KATEGORI_VALID.map((nama, i) => ({ id: i + 1, nama, deskripsi: null })),
      warning: "Tabel kategori belum siap — jalankan migration-kategori-laporan.sql",
    });
  }
};

const createKategori = async (req, res) => {
  try {
    const nama = String(req.body.nama || "").trim();
    const deskripsi = req.body.deskripsi || null;
    if (!nama) return res.status(400).json({ message: "Nama kategori wajib diisi" });
    if (nama.length < 2) return res.status(400).json({ message: "Nama kategori minimal 2 karakter" });
    const exists = await kategoriModel.findByNama(nama);
    if (exists) return res.status(409).json({ message: "Kategori sudah ada" });
    const id = await kategoriModel.insert({ nama, deskripsi });
    const row = await kategoriModel.findById(id);
    return res.status(201).json({ message: "Kategori ditambahkan", kategori: row });
  } catch (error) {
    console.error("Error createKategori:", error);
    return res.status(500).json({ message: "Terjadi kesalahan server", error: error.message });
  }
};

const updateKategori = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await kategoriModel.findById(id);
    if (!existing) return res.status(404).json({ message: "Kategori tidak ditemukan" });
    const nama = String(req.body.nama || existing.nama).trim();
    const deskripsi = req.body.deskripsi !== undefined ? req.body.deskripsi : existing.deskripsi;
    if (!nama) return res.status(400).json({ message: "Nama kategori wajib diisi" });
    const dup = await kategoriModel.findByNama(nama);
    if (dup && String(dup.id) !== String(id)) {
      return res.status(409).json({ message: "Nama kategori sudah dipakai" });
    }
    await kategoriModel.update(id, { nama, deskripsi });
    // Sinkron nama di produk jika diganti
    if (nama !== existing.nama) {
      const db = require("../config/db");
      await new Promise((resolve, reject) => {
        db.query(
          "UPDATE produk SET kategori = ? WHERE kategori = ?",
          [nama, existing.nama],
          (err) => (err ? reject(err) : resolve())
        );
      });
    }
    const row = await kategoriModel.findById(id);
    return res.status(200).json({ message: "Kategori diperbarui", kategori: row });
  } catch (error) {
    console.error("Error updateKategori:", error);
    return res.status(500).json({ message: "Terjadi kesalahan server", error: error.message });
  }
};

const deleteKategori = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await kategoriModel.findById(id);
    if (!existing) return res.status(404).json({ message: "Kategori tidak ditemukan" });
    const dipakai = await kategoriModel.countProdukByNama(existing.nama);
    if (dipakai > 0) {
      return res.status(400).json({
        message: `Kategori masih dipakai ${dipakai} produk. Pindahkan produk dulu sebelum menghapus.`,
      });
    }
    await kategoriModel.remove(id);
    return res.status(200).json({ message: "Kategori dihapus" });
  } catch (error) {
    console.error("Error deleteKategori:", error);
    return res.status(500).json({ message: "Terjadi kesalahan server", error: error.message });
  }
};

// ===================== LAPORAN PENJUALAN =====================

const getLaporanPenjualan = async (req, res) => {
  try {
    const { dari, sampai, status } = req.query;
    let pembelian = [];
    try {
      pembelian = await pembelianModel.findAllPembelianWithDetail();
    } catch (e) {
      console.error("Laporan query error:", e.message);
      pembelian = [];
    }
    if (!Array.isArray(pembelian)) pembelian = [];

    const from = dari ? new Date(dari) : null;
    const to = sampai ? new Date(sampai) : null;
    if (to) to.setHours(23, 59, 59, 999);

    let rows = pembelian.filter((p) => {
      const t = new Date(p.created_at || p.tanggal || 0);
      if (from && t < from) return false;
      if (to && t > to) return false;
      if (status && String(p.status).toLowerCase() !== String(status).toLowerCase()) return false;
      return true;
    });

    // Hanya yang dibayar / selesai dihitung pendapatan (fleksibel)
    const pendapatanRows = rows.filter((p) => {
      const bayar = String(p.pembayaran || "").toLowerCase();
      const st = String(p.status || "").toLowerCase();
      return bayar.includes("dibayar") || st === "selesai" || st === "diterima";
    });

    const total_transaksi = rows.length;
    const total_pendapatan = pendapatanRows.reduce((sum, p) => {
      const harga = Number(p.harga || p.produk_harga || 0);
      let qty = 1;
      if (p.jumlah != null) qty = Number(p.jumlah) || 1;
      else {
        const m = String(p.catatan || "").match(/Jumlah:\s*(\d+)/i);
        if (m) qty = Number(m[1]);
      }
      return sum + harga * qty;
    }, 0);

    return res.status(200).json({
      ringkasan: {
        total_transaksi,
        total_pendapatan,
        dari: dari || null,
        sampai: sampai || null,
      },
      laporan: rows,
    });
  } catch (error) {
    console.error("Error getLaporanPenjualan:", error);
    return res.status(500).json({ message: "Terjadi kesalahan server", error: error.message });
  }
};


module.exports = {
  listProduk,
  getProdukById,
  createProduk,
  updateProduk,
  deleteProduk,
  listPembeli,
  getPembeliById,
  createPembeli,
  updatePembeli,
  deletePembeli,
  listArtikel,
  getArtikelById,
  createArtikel,
  updateArtikel,
  deleteArtikel,
  getStats,
  listPembelian,
  getPembelianById,
  updatePembelian,
  deletePembelian,
  getMyProfile,
  updateMyProfile,
  listKategori,
  createKategori,
  updateKategori,
  deleteKategori,
  getLaporanPenjualan,
};
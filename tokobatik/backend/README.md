# Backend Latihan Toko (Node.js + Express + MySQL)

Struktur sesuai permintaan:

```
backend/
├── server.js
├── .env
├── config/db.js
├── middlewares/index.js          → JWT + role + upload gambar
├── models/
│   ├── usersModel.js
│   ├── produkModel.js
│   ├── pembelianModel.js
│   └── artikelModel.js
├── controllers/
│   ├── usersController.js        → pembeli + publik
│   └── adminController.js        → admin
└── routes/
    ├── users.js
    └── admin.js
```

## Tabel yang digunakan (sesuai DB Diagram, info_toko & kontak dibuang)
- users
- produk
- pembelian
- artikel

## Cara Menjalankan

### 1. Install dependency
```bash
cd backend
npm install
```

### 2. Setup Database
- Buat database MySQL
- Import file `database.sql`
```bash
mysql -u root -p < database.sql
```
Atau jalankan isi `database.sql` lewat phpMyAdmin / MySQL Workbench.

### 3. Sesuaikan .env
Edit file `.env` sesuai kredensial database Anda:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=password_anda
DB_NAME=latihan_toko
JWT_SECRET=ganti_dengan_rahasia_yang_kuat
```

### 4. Jalankan server
```bash
npm start
```
Server berjalan di `http://localhost:5000`

## Endpoint API

### Publik / Pembeli (`/api`)
| Method | Endpoint | Keterangan | Auth |
|--------|----------|------------|------|
| POST | /api/register | Daftar akun | - |
| POST | /api/login | Login | - |
| GET | /api/profile | Lihat profil | Token |
| PUT | /api/profile | Update profil | Token |
| GET | /api/produk | Daftar produk | - |
| GET | /api/produk/:id | Detail produk | - |
| GET | /api/artikel | Daftar artikel | - |
| GET | /api/artikel/:id | Detail artikel | - |
| POST | /api/pembelian | Buat pesanan | Token (pembeli) |
| GET | /api/pembelian/saya | Riwayat pesanan saya | Token (pembeli) |
| PUT | /api/pembelian/:id/bukti | Upload bukti bayar | Token (pembeli) |

### Admin (`/api/admin`) — butuh Token + role admin
| Method | Endpoint | Keterangan |
|--------|----------|------------|
| GET | /api/admin/stats | Statistik ringkas |
| GET | /api/admin/users | Semua user |
| DELETE | /api/admin/users/:id | Hapus user |
| POST | /api/admin/produk | Tambah produk |
| PUT | /api/admin/produk/:id | Edit produk |
| DELETE | /api/admin/produk/:id | Hapus produk |
| GET | /api/admin/pembelian | Semua pesanan |
| PUT | /api/admin/pembelian/:id | Update status pesanan |
| DELETE | /api/admin/pembelian/:id | Hapus pesanan |
| POST | /api/admin/artikel | Tambah artikel |
| PUT | /api/admin/artikel/:id | Edit artikel |
| DELETE | /api/admin/artikel/:id | Hapus artikel |

## Contoh Login Admin (setelah import sample data)
- Email/Username: `admin` atau `admin@toko.com`
- Password: (sample di database masih hash dummy — ganti dulu dengan hash bcrypt asli)

Gunakan tools seperti Postman / Thunder Client untuk uji API.

## Frontend
Sesuaikan base URL API frontend ke `http://localhost:5000/api`  
Tanpa mengubah tampilan, cukup ganti endpoint / cara fetch data agar sesuai response JSON di atas.

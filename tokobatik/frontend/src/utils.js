/**
 * utils.js — helper tampilan (mediaUrl, format, label enum), form profil, + sesi login.
 */

import { API_BASE } from './api';
import { METODE_BAYAR, SHIPPING, STATUS_BAYAR, KATEGORI_PRODUK, KELAMIN } from './constants';

// ===================== GAMBAR =====================

export function mediaUrl(filename) {
  if (!filename || filename === 'default.jpg' || filename === 'default.png') {
    return '/placeholder.png';
  }
  const src = String(filename).trim();
  if (src.startsWith('http://') || src.startsWith('https://')) {
    return src;
  }
  if (src.startsWith('/uploads/')) {
    return `${API_BASE}${src}`;
  }
  if (src.startsWith('uploads/')) {
    return `${API_BASE}/${src}`;
  }
  // kadang backend simpan path penuh relatif tanpa slash
  if (src.includes('/')) {
    return `${API_BASE}/${src.replace(/^\//, '')}`;
  }
  return `${API_BASE}/uploads/images/${src}`;
}

// ===================== FORMAT TAMPILAN =====================

export function formatRupiah(angka) {
  const nilai = Number(angka) || 0;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(nilai);
}

export function formatTanggal(tanggal) {
  if (!tanggal) return '-';
  const date = new Date(tanggal);
  if (isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

// ===================== LABEL ENUM (tampilan saja) =====================

const LABEL_METODE_BAYAR = { 'Bank Transfer': 'Bank', COD: 'COD (Bayar di Tempat)' };
const LABEL_PENGIRIMAN = { 'JNT Express': 'JNT Express', JNE: 'JNE' };
const LABEL_STATUS_BAYAR = { Belum: 'Belum Dibayar', Dibayar: 'Dibayar' };

export function labelMetodeBayar(value) { return LABEL_METODE_BAYAR[value] || value; }
export function labelPengiriman(value) { return LABEL_PENGIRIMAN[value] || value; }
export function labelStatusBayar(value) { return LABEL_STATUS_BAYAR[value] || value; }
export function labelStatusProses(value) { return value; }
export function labelKategori(value) { return value; }

export function kategoriDariProduk(produkList) {
  const list = Array.isArray(produkList) ? produkList : [];
  return KATEGORI_PRODUK.map((kategori) => ({
    value: kategori,
    label: kategori,
    jumlah: list.filter((p) => p.kategori === kategori).length,
  })).filter((k) => k.jumlah > 0);
}

// ===================== FORM PROFIL (admin & pembeli) =====================

// Samakan variasi penulisan kelamin dari database ('laki-laki', 'LAKI-LAKI', dll)
// jadi persis salah satu nilai di KELAMIN, supaya <select> tidak nyasar ke opsi kosong.
export function normalizeKelamin(value) {
  if (!value) return KELAMIN[0];
  const found = KELAMIN.find((k) => k.toLowerCase() === String(value).toLowerCase());
  return found || KELAMIN[0];
}

// Kolom `lahir` di database bertipe TEXT bebas (bukan DATE), jadi isinya bisa
// 'YYYY-MM-DD' polos atau ada bagian waktu ikut. <input type="date"> HANYA mau
// format 'YYYY-MM-DD', jadi kita potong 10 karakter pertama saja.
export function toDateInputValue(value) {
  if (!value) return '';
  return String(value).slice(0, 10);
}

// Field password kosong sebagai nilai awal form (dipakai admin & pembeli)
export const emptyPasswordFields = {
  passwd_lama: '',
  passwd_baru: '',
  passwd_baru_konfirmasi: '',
};

// Susun payload utk PUT /me (admin & pembeli). Password HANYA disertakan kalau
// user benar-benar mau ganti (passwd_baru diisi) — kalau dikosongkan, field
// password tidak dikirim sama sekali sehingga backend tidak menyentuh password lama.
export function buildProfilePayload(form) {
  const { passwd_lama, passwd_baru, passwd_baru_konfirmasi, ...profil } = form;

  if (passwd_baru) {
    if (passwd_baru !== passwd_baru_konfirmasi) {
      throw new Error('Konfirmasi password baru tidak cocok');
    }
    if (passwd_baru.length < 6) {
      throw new Error('Password baru minimal 6 karakter');
    }
    return { ...profil, passwd_lama, passwd_baru };
  }

  return profil;
}

// ===================== SESI LOGIN (sessionStorage) =====================
// Pakai sessionStorage agar buka localhost/tab baru TIDAK langsung login.
// Sesi hilang saat tab/browser ditutup. Login manual tetap ke dashboard.

const TOKEN_KEY = 'toko_token';
const USER_KEY = 'toko_user';

export function saveSession(token, user) {
  sessionStorage.setItem(TOKEN_KEY, token);
  sessionStorage.setItem(USER_KEY, JSON.stringify(user));
  // bersihkan sisa localStorage lama (jika pernah login sebelumnya)
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch (_) {}
}

export function getToken() {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function getUser() {
  const data = sessionStorage.getItem(USER_KEY);
  return data ? JSON.parse(data) : null;
}

export function clearSession() {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch (_) {}
}

/** Qty dari pesanan (kolom jumlah atau catatan) */
export function qtyOfOrder(p) {
  if (p?.jumlah != null && p.jumlah !== '') {
    const n = Number(p.jumlah);
    if (!Number.isNaN(n) && n > 0) return n;
  }
  const m = String(p?.catatan || '').match(/Jumlah:\s*(\d+)/i);
  return m ? Math.max(1, Number(m[1]) || 1) : 1;
}

/**
 * Cetak struk transaksi (pembeli & admin).
 * @param {object} order - data pembelian + produk
 * @param {object} [site] - info toko (nama, alamat, tlp)
 */
export function printStruk(order, site = {}) {
  const p = order || {};
  const qty = qtyOfOrder(p);
  const harga = Number(p.harga || p.produk_harga || 0);
  const total = harga * qty;
  const toko = site.nama_toko || 'Batik Nusantara';
  const alamat = site.alamat_toko || '';
  const tlp = site.tlp_toko || '';
  const nama =
    p.nama_pembeli ||
    [p.pembeli_nama_d, p.pembeli_nama_b].filter(Boolean).join(' ') ||
    p.pembeli_uname ||
    'Pembeli';
  const tgl = p.created_at ? formatTanggal(p.created_at) : '';
  const kat = p.kategori || p.kategori_produk || '—';

  const html = `<!DOCTYPE html>
<html lang="id"><head><meta charset="utf-8"/>
<title>Struk #${p.id || ''} — ${toko}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:"Courier New",Courier,monospace;font-size:12px;color:#111;padding:16px;max-width:320px;margin:0 auto}
.center{text-align:center}.bold{font-weight:700}
.line{border-top:1px dashed #333;margin:8px 0}
.row{display:flex;justify-content:space-between;gap:8px;margin:3px 0}
.muted{color:#555;font-size:11px}
h1{font-size:14px;margin-bottom:4px}
@media print{.no-print{display:none!important}body{padding:0}}
</style></head><body>
<div class="center">
  <h1 class="bold">${toko}</h1>
  <div class="muted">${alamat}</div>
  <div class="muted">${tlp}</div>
</div>
<div class="line"></div>
<div class="center bold">STRUK TRANSAKSI</div>
<div class="row"><span>No</span><span>#${p.id || '—'}</span></div>
<div class="row"><span>Tanggal</span><span>${tgl}</span></div>
<div class="row"><span>Pembeli</span><span>${nama}</span></div>
<div class="row"><span>Kategori</span><span>${kat}</span></div>
<div class="line"></div>
<div class="bold">${p.nama_produk || 'Produk'}</div>
<div class="row"><span>${qty} x ${formatRupiah(harga)}</span><span>${formatRupiah(total)}</span></div>
<div class="line"></div>
<div class="row bold"><span>TOTAL</span><span>${formatRupiah(total)}</span></div>
<div class="row"><span>Bayar</span><span>${p.pembayaran || '—'} / ${p.metode_pembayaran || '—'}</span></div>
<div class="row"><span>Status</span><span>${p.status || '—'}</span></div>
<div class="row"><span>Kirim</span><span>${p.pengiriman || '—'}</span></div>
<div class="line"></div>
<div class="center muted">Terima kasih telah berbelanja<br/>${toko}</div>
<div class="center no-print" style="margin-top:16px">
  <button onclick="window.print()" style="padding:8px 16px;cursor:pointer">Cetak</button>
  <button onclick="window.close()" style="padding:8px 16px;cursor:pointer;margin-left:8px">Tutup</button>
</div>
<script>window.onload=function(){setTimeout(function(){window.print()},300)}</script>
</body></html>`;

  const w = window.open('', '_blank', 'width=400,height=640');
  if (!w) {
    alert('Izinkan popup browser untuk mencetak struk.');
    return;
  }
  w.document.write(html);
  w.document.close();
}

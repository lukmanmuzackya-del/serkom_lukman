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
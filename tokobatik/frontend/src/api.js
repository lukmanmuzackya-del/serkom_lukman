/**
 * api.js — semua pemanggilan HTTP ke backend.
 * Publik: api | Admin: adminApi | Pembeli: pembeliApi
 */
export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export function authHeaders() {
  const token = sessionStorage.getItem('toko_token') || localStorage.getItem('toko_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function normalize(body) {
  const { message, token, ...rest } = body || {};
  const keys = Object.keys(rest);
  const data = keys.length === 1 ? rest[keys[0]] : rest;
  return { data, message, token, raw: body };
}

/** Ambil array dari response API (dukung beberapa bentuk payload). */
export function asList(payload) {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === 'object') {
    if (Array.isArray(payload.data)) return payload.data;
    for (const k of ['produk', 'pembelian', 'artikel', 'users', 'pembeli', 'rows', 'items']) {
      if (Array.isArray(payload[k])) return payload[k];
    }
    // kadang { data: { produk: [] } }
    if (payload.data && typeof payload.data === 'object') {
      for (const k of ['produk', 'pembelian', 'artikel', 'users', 'pembeli']) {
        if (Array.isArray(payload.data[k])) return payload.data[k];
      }
    }
  }
  return [];
}

export async function apiRequest(path, options = {}) {
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...authHeaders(),
    ...options.headers,
  };
  let res;
  try {
    res = await fetch(url, { ...options, headers });
  } catch {
    throw new Error(
      'Backend tidak jalan. Buka terminal di folder backend, lalu jalankan: npm run dev (port 5000).'
    );
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(body.message || 'Permintaan gagal');
    err.status = res.status;
    err.body = body;
    throw err;
  }
  return normalize(body);
}

/**
 * Upload file gambar.
 * Mencoba beberapa nama field FormData karena backend bisa beda-beda (gambar / foto / file / image).
 */
async function uploadGambar(endpoint, file) {
  const fieldNames = ['gambar', 'foto', 'file', 'image'];
  let lastError = null;

  for (const field of fieldNames) {
    const fd = new FormData();
    fd.append(field, file);

    let res;
    try {
      res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: authHeaders(), // jangan set Content-Type — browser isi multipart boundary
        body: fd,
      });
    } catch {
      throw new Error('Backend tidak jalan. Buka terminal di folder backend, lalu jalankan: npm run dev.');
    }

    const body = await res.json().catch(() => ({}));
    if (res.ok) {
      return normalize(body);
    }
    lastError = new Error(body.message || `Upload gagal (${res.status})`);
    lastError.status = res.status;
    if (res.status === 401 || res.status === 403) throw lastError;
  }

  throw lastError || new Error('Upload gagal');
}

/** API publik + login/register */
export const api = {
  getProduk: () => apiRequest('/api/users/produk'),
  getProdukById: (id) => apiRequest(`/api/users/produk/${id}`),
  getKategori: () => apiRequest('/api/users/kategori'),
  getArtikel: () => apiRequest('/api/users/artikel'),
  getArtikelById: (id) => apiRequest(`/api/users/artikel/${id}`),
  login: (credential, passwd) =>
    apiRequest('/api/users/login', {
      method: 'POST',
      body: JSON.stringify({ credential, passwd }),
    }),
  register: (payload) =>
    apiRequest('/api/users/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getPembeliMe: () => apiRequest('/api/users/me'),
  getAdminMe: () => apiRequest('/api/admin/me'),
};

/** API panel admin */
export const adminApi = {
  getStats: () => apiRequest('/api/admin/stats'),
  getMe: () => apiRequest('/api/admin/me'),
  putMe: (payload) =>
    apiRequest('/api/admin/me', { method: 'PUT', body: JSON.stringify(payload) }),

  getPembeli: () => apiRequest('/api/admin/pembeli'),
  getPembeliById: (id) => apiRequest(`/api/admin/pembeli/${id}`),
  createPembeli: (payload) =>
    apiRequest('/api/admin/pembeli', { method: 'POST', body: JSON.stringify(payload) }),
  updatePembeli: (id, payload) =>
    apiRequest(`/api/admin/pembeli/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deletePembeli: (id) => apiRequest(`/api/admin/pembeli/${id}`, { method: 'DELETE' }),

  getProduk: () => apiRequest('/api/admin/produk'),
  getProdukById: (id) => apiRequest(`/api/admin/produk/${id}`),
  createProduk: (payload) =>
    apiRequest('/api/admin/produk', { method: 'POST', body: JSON.stringify(payload) }),
  updateProduk: (id, payload) =>
    apiRequest(`/api/admin/produk/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteProduk: (id) => apiRequest(`/api/admin/produk/${id}`, { method: 'DELETE' }),

  getPembelian: () => apiRequest('/api/admin/pembelian'),
  getPembelianById: (id) => apiRequest(`/api/admin/pembelian/${id}`),
  updatePembelian: (id, payload) =>
    apiRequest(`/api/admin/pembelian/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deletePembelian: (id) => apiRequest(`/api/admin/pembelian/${id}`, { method: 'DELETE' }),

  getArtikel: () => apiRequest('/api/admin/artikel'),
  getArtikelById: (id) => apiRequest(`/api/admin/artikel/${id}`),
  createArtikel: (payload) =>
    apiRequest('/api/admin/artikel', { method: 'POST', body: JSON.stringify(payload) }),
  updateArtikel: (id, payload) =>
    apiRequest(`/api/admin/artikel/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteArtikel: (id) => apiRequest(`/api/admin/artikel/${id}`, { method: 'DELETE' }),

  uploadGambar: (file) => uploadGambar('/api/admin/upload-gambar', file),

  getKategori: () => apiRequest('/api/admin/kategori'),
  createKategori: (payload) =>
    apiRequest('/api/admin/kategori', { method: 'POST', body: JSON.stringify(payload) }),
  updateKategori: (id, payload) =>
    apiRequest(`/api/admin/kategori/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteKategori: (id) => apiRequest(`/api/admin/kategori/${id}`, { method: 'DELETE' }),

  getLaporan: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return apiRequest(`/api/admin/laporan${q ? `?${q}` : ''}`);
  },
};


/** API area pembeli */
export const pembeliApi = {
  getDashboard: () => apiRequest('/api/users/dashboard'),
  getMe: () => apiRequest('/api/users/me'),
  putMe: (payload) =>
    apiRequest('/api/users/me', { method: 'PUT', body: JSON.stringify(payload) }),
  getProduk: () => apiRequest('/api/users/produk'),
  getProdukById: (id) => apiRequest(`/api/users/produk/${id}`),
  getPembelian: () => apiRequest('/api/users/pembelian'),
  getPembelianById: (id) => apiRequest(`/api/users/pembelian/${id}`),
  createPembelian: (payload) =>
    apiRequest('/api/users/pembelian', { method: 'POST', body: JSON.stringify(payload) }),
  updatePembelian: (id, payload) =>
    apiRequest(`/api/users/pembelian/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  uploadGambar: (file) => uploadGambar('/api/users/upload-gambar', file),
  uploadBukti: (id, file) => uploadGambar(`/api/users/pembelian/${id}/bukti`, file),
};

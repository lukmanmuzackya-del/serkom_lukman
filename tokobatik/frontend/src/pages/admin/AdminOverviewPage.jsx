/**
 * Dashboard admin.
 * Coba GET /api/admin/stats dulu; jika gagal / kosong, hitung dari list produk/pembeli/artikel/pembelian.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../api';
import { useAdminGuard } from '../../hooks';
import StatCard from '../../components/admin/StatCard';
import LoadingBlock from '../../components/admin/LoadingBlock';
import { formatRupiah, formatTanggal } from '../../utils';
import { useAuth } from '../../context/AuthContext';

function asArray(v) {
  if (Array.isArray(v)) return v;
  if (v && typeof v === 'object') {
    // kadang { produk: [...] } masih terbawa
    for (const k of Object.keys(v)) {
      if (Array.isArray(v[k])) return v[k];
    }
  }
  return [];
}

function num(...candidates) {
  for (const v of candidates) {
    if (v === null || v === undefined || v === '') continue;
    const n = Number(v);
    if (!Number.isNaN(n)) return n;
  }
  return 0;
}

function flattenStats(payload) {
  if (!payload || typeof payload !== 'object') return null;
  const base =
    payload.stats && typeof payload.stats === 'object' && !Array.isArray(payload.stats)
      ? { ...payload.stats }
      : { ...payload };

  const transaksi =
    payload.transaksi_terbaru ||
    payload.recent ||
    base.transaksi_terbaru ||
    base.recent ||
    [];

  return {
    ...base,
    transaksi_terbaru: Array.isArray(transaksi) ? transaksi : [],
    total_pendapatan: num(base.total_pendapatan, payload.total_pendapatan, payload.pendapatan, base.pendapatan),
  };
}

/** Hitung statistik dari list yang sudah ada di backend */
function computeFromLists({ produk, pembeli, artikel, pembelian }) {
  const listP = asArray(produk);
  const listB = asArray(pembeli);
  const listA = asArray(artikel);
  const listOrder = asArray(pembelian);

  const aktif = listOrder.filter((o) => {
    const s = String(o.status || '').toLowerCase();
    return ['tertunda', 'dikemas', 'dikirim', 'diterima'].includes(s);
  }).length;

  const belum = listOrder.filter((o) => {
    const p = String(o.pembayaran || o.status_bayar || '').toLowerCase();
    return p.includes('belum') || p === 'belum';
  }).length;

  const dibayar = listOrder.filter((o) => {
    const p = String(o.pembayaran || o.status_bayar || '').toLowerCase();
    return p === 'dibayar' || p.includes('lunas') || p === 'paid';
  });

  const totalPendapatan = dibayar.reduce((sum, o) => {
    const harga = num(o.total, o.harga, o.harga_produk, o.jumlah_bayar);
    return sum + harga;
  }, 0);

  const sorted = [...listOrder].sort((a, b) => {
    const ta = new Date(a.created_at || a.tanggal || 0).getTime();
    const tb = new Date(b.created_at || b.tanggal || 0).getTime();
    return tb - ta;
  });

  return {
    jumlah_pembeli: listB.length,
    jumlah_transaksi: listOrder.length,
    jumlah_produk: listP.length,
    produk_terjual: listOrder.length,
    jumlah_artikel: listA.length,
    pesanan_aktif: aktif,
    belum: belum,
    total_pendapatan: totalPendapatan,
    transaksi_terbaru: sorted.slice(0, 8).map((row) => ({
      id: row.id || row.id_pembelian,
      nama_pembeli: row.nama_pembeli || row.pembeli || row.nama || '—',
      nama_produk: row.nama_produk || row.produk || '—',
      status: row.status || '—',
      pembayaran: row.pembayaran || row.status_bayar || '—',
      created_at: row.created_at || row.tanggal,
    })),
    _source: 'aggregate',
  };
}

function hasAnyStat(data) {
  if (!data) return false;
  return (
    num(data.jumlah_pembeli, data.jumlah_produk, data.jumlah_artikel, data.jumlah_transaksi) > 0 ||
    (Array.isArray(data.transaksi_terbaru) && data.transaksi_terbaru.length > 0)
  );
}

async function loadDashboard() {
  // 1) coba endpoint stats
  try {
    const r = await adminApi.getStats();
    const source =
      r.data && typeof r.data === 'object' && !Array.isArray(r.data)
        ? r.data
        : r.raw && typeof r.raw === 'object'
          ? r.raw
          : null;
    const flat = flattenStats(source);
    if (flat && hasAnyStat(flat)) return flat;
  } catch {
    // lanjut fallback
  }

  // 2) fallback: aggregate dari endpoint list yang biasanya sudah jalan
  const [produk, pembeli, artikel, pembelian] = await Promise.all([
    adminApi.getProduk().then((r) => r.data).catch(() => []),
    adminApi.getPembeli().then((r) => r.data).catch(() => []),
    adminApi.getArtikel().then((r) => r.data).catch(() => []),
    adminApi.getPembelian().then((r) => r.data).catch(() => []),
  ]);

  return computeFromLists({ produk, pembeli, artikel, pembelian });
}

export default function AdminOverviewPage() {
  const { handleError } = useAdminGuard();
  const { user } = useAuth();
  const [justLoggedIn, setJustLoggedIn] = useState(false);
  useEffect(() => {
    try {
      if (sessionStorage.getItem('admin_welcome') === '1') {
        setJustLoggedIn(true);
        sessionStorage.removeItem('admin_welcome');
      }
    } catch (_) {}
  }, []);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    loadDashboard()
      .then((d) => {
        if (alive) setData(d);
      })
      .catch((err) => {
        if (!alive) return;
        if (!handleError(err)) setError(err.message || 'Gagal memuat dashboard');
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [handleError]);

  if (loading) return <LoadingBlock />;
  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!data) return null;

  const stats = [
    {
      label: 'Pembeli',
      value: num(data.jumlah_pembeli, data.total_pembeli, data.pembeli),
      tone: 'dark',
      icon: 'bi-people',
      hint: 'Akun terdaftar',
    },
    {
      label: 'Transaksi',
      value: num(data.jumlah_transaksi, data.total_transaksi, data.transaksi),
      tone: 'brand',
      icon: 'bi-receipt',
      hint: 'Semua pesanan',
    },
    {
      label: 'Produk',
      value: num(data.jumlah_produk, data.total_produk, data.produk),
      tone: 'info',
      icon: 'bi-box-seam',
      hint: 'Di katalog',
    },
    {
      label: 'Terjual',
      value: num(data.produk_terjual, data.terjual),
      tone: 'success',
      icon: 'bi-bag-check',
      hint: 'Jumlah pesanan',
    },
    {
      label: 'Artikel',
      value: num(data.jumlah_artikel, data.total_artikel, data.artikel),
      tone: 'gold',
      icon: 'bi-journal-text',
      hint: 'Konten blog',
    },
    {
      label: 'Pesanan aktif',
      value: num(data.pesanan_aktif, data.aktif),
      tone: 'warn',
      icon: 'bi-hourglass-split',
      hint: 'Belum selesai',
    },
    {
      label: 'Belum dibayar',
      value: num(data.belum_dibayar, data.belum),
      tone: 'warn',
      icon: 'bi-wallet2',
      hint: 'Menunggu bayar',
    },
  ];

  const transaksi = Array.isArray(data.transaksi_terbaru) ? data.transaksi_terbaru : [];

  const adminName = [user?.nama_d, user?.nama_b].filter(Boolean).join(' ') || user?.uname || 'Admin';

  return (
    <div>
      <div className="admin-welcome panel mb-4 anim-slide-up">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div>
            <p className="admin-welcome__kicker mb-1">Panel admin · Batik Nusantara</p>
            <h2 className="admin-welcome__title mb-1">
              Selamat datang, {adminName}!{justLoggedIn ? ' 👋' : ''}
            </h2>
            <p className="text-secondary small mb-0">
              Kelola produk, pesanan, laporan, dan konten toko dari satu tempat.
            </p>
          </div>
          <div className="admin-welcome__badge">
            <i className="bi bi-shield-check me-1" />
            Admin
          </div>
        </div>
      </div>

      <div className="stat-grid-v2">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      <div className="revenue-banner mt-4">
        <div>
          <div className="revenue-banner__label">Pendapatan (sudah dibayar)</div>
          <div className="revenue-banner__value">{formatRupiah(num(data.total_pendapatan))}</div>
          <div className="revenue-banner__hint">Akumulasi pesanan berstatus pembayaran Dibayar</div>
        </div>
        <div className="revenue-banner__icon"><i className="bi bi-cash-stack" /></div>
      </div>

      <div className="panel mt-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h2 className="h6 fw-bold mb-0">Transaksi terbaru</h2>
          <Link to="/admin/pembelian" className="btn btn-sm btn-outline-brand btn-sm">
            Lihat semua
          </Link>
        </div>
        {transaksi.length === 0 ? (
          <p className="text-secondary mb-0">Belum ada pesanan.</p>
        ) : (
          <div className="table-responsive">
            <table className="table table table-modern mb-0">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Pembeli</th>
                  <th>Produk</th>
                  <th>Status</th>
                  <th>Bayar</th>
                  <th>Tanggal</th>
                </tr>
              </thead>
              <tbody>
                {transaksi.map((row) => (
                  <tr key={row.id || row.id_pembelian}>
                    <td>#{row.id || row.id_pembelian}</td>
                    <td>{row.nama_pembeli || '—'}</td>
                    <td>{row.nama_produk || '—'}</td>
                    <td>
                      <span className="badge-soft info">{row.status || '—'}</span>
                    </td>
                    <td>{row.pembayaran || '—'}</td>
                    <td className="text-nowrap">{formatTanggal(row.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="d-flex flex-wrap gap-2 mt-4">
        <Link to="/admin/produk" className="btn btn-sm btn-outline-brand">
          + Tambah produk
        </Link>
        <Link to="/admin/artikel" className="btn btn-sm btn-outline-brand">
          + Tulis artikel
        </Link>
        <Link to="/admin/pembeli" className="btn btn-sm btn-outline-brand">
          Kelola pembeli
        </Link>
      </div>
    </div>
  );
}

import { useMemo, useState } from 'react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import ProdukCard from '../components/home/ProdukCard';
import { useBerandaData } from '../hooks';
import { KATEGORI_PRODUK } from '../constants';

function matchProduk(p, term) {
  if (!term) return true;
  const parts = [
    p?.nama_produk,
    p?.deskripsi,
    p?.kategori,
    p?.no_barang,
    p?.id_produk,
    p?.harga,
  ];
  const hay = parts
    .filter((v) => v != null && v !== '')
    .map((v) => String(v).toLowerCase())
    .join(' ');
  // dukung beberapa kata (semua harus ketemu)
  return term.split(/\s+/).filter(Boolean).every((w) => hay.includes(w));
}

export default function TokoPage() {
  const { produk, loading, error } = useBerandaData();
  const [kategori, setKategori] = useState('Semua');
  const [q, setQ] = useState('');

  const list = Array.isArray(produk) ? produk : [];

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return list.filter((p) => {
      if (kategori !== 'Semua' && p.kategori !== kategori) return false;
      return matchProduk(p, term);
    });
  }, [list, kategori, q]);

  const cats = ['Semua', ...KATEGORI_PRODUK];

  return (
    <>
      <Header />
      <main className="py-5">
        <div className="container">
          <div className="page-hero-mini mb-4">
            <p className="section-kicker mb-1">Koleksi</p>
            <h1 className="section-title mb-2">Semua produk</h1>
            <p className="text-secondary mb-0" style={{ maxWidth: 520 }}>
              Cari berdasarkan nama, nomor barang, atau kategori.
            </p>
          </div>

          <div className="row g-2 mb-3 align-items-center">
            <div className="col-md-7">
              <div className="search-box">
                <i className="bi bi-search" aria-hidden />
                <input
                  type="search"
                  className="form-control"
                  placeholder="Ketik nama produk / no. barang..."
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  onInput={(e) => setQ(e.target.value)}
                  autoComplete="off"
                />
              </div>
            </div>
            <div className="col-md-5 text-md-end small text-muted">
              {loading ? 'Memuat...' : `${filtered.length} dari ${list.length} produk`}
            </div>
          </div>

          <div className="d-flex flex-wrap gap-2 mb-4">
            {cats.map((k) => (
              <button
                key={k}
                type="button"
                className={`cat-pill ${kategori === k ? 'active' : ''}`}
                onClick={() => setKategori(k)}
              >
                {k}
              </button>
            ))}
          </div>

          {error && <p className="text-danger">{error}</p>}
          {loading ? (
            <p className="text-muted">Memuat produk...</p>
          ) : (
            <div className="row row-cols-2 row-cols-md-3 row-cols-lg-4 g-3">
              {filtered.map((p) => (
                <ProdukCard key={p.id_produk ?? p.id} produk={p} />
              ))}
              {!filtered.length && (
                <div className="col-12">
                  <div className="empty-state panel">
                    {list.length === 0
                      ? 'Belum ada produk di katalog.'
                      : `Tidak ada produk untuk “${q || kategori}”.`}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import SafeImg from '../components/SafeImg';
import { api, pembeliApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { formatRupiah, labelMetodeBayar, labelPengiriman } from '../utils';
import { METODE_BAYAR, SHIPPING, SITE, BANK_OPTIONS } from '../constants';

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isLoggedIn, isPembeli, user } = useAuth();
  const { addItem } = useCart();
  const [produk, setProduk] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [mode, setMode] = useState(null); // null | 'beli'
  const [jumlah, setJumlah] = useState(1);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    nama_pembeli: '',
    alamat_pembeli: '',
    phone_pembeli: '',
    metode_pembayaran: METODE_BAYAR[0],
    bank: BANK_OPTIONS[0].id,
    pengiriman: SHIPPING[0],
    catatan: '',
  });

  useEffect(() => {
    setLoading(true);
    setError('');
    api
      .getProdukById(id)
      .then((res) => setProduk(res.data))
      .catch((e) => setError(e.message || 'Produk tidak ditemukan'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!user) return;
    setForm((f) => ({
      ...f,
      nama_pembeli: [user.nama_d, user.nama_b].filter(Boolean).join(' '),
      alamat_pembeli: user.alamat || '',
      phone_pembeli: String(user.phone || ''),
    }));
  }, [user]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  function onChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  function maxStok() {
    if (!produk || produk.stok == null) return 999;
    return Math.max(0, Number(produk.stok) || 0);
  }

  function clampJumlah(n) {
    const v = Math.max(1, Number(n) || 1);
    const max = maxStok();
    if (max <= 0) return 1;
    return Math.min(v, max);
  }

  function handleAddCart() {
    if (!produk) return;
    if (!isLoggedIn) {
      navigate('/login', { state: { from: `/toko/${id}` } });
      return;
    }
    if (!isPembeli) {
      setError('Hanya akun pembeli yang dapat menambah keranjang.');
      return;
    }
    const max = maxStok();
    if (max <= 0) {
      setError('Stok habis. Tidak bisa ditambahkan ke keranjang.');
      return;
    }
    if (Number(jumlah) > max) {
      setError(`Stok kurang. Hanya tersisa ${max} pcs.`);
      setJumlah(max);
      return;
    }
    try {
      addItem(produk, jumlah);
      setError('');
      setToast('Ditambahkan ke keranjang');
    } catch (err) {
      setError(err.message || 'Gagal menambah ke keranjang');
    }
  }

  function handleBuyNow() {
    if (!produk) return;
    if (!isLoggedIn) {
      navigate('/login', { state: { from: `/toko/${id}` } });
      return;
    }
    if (!isPembeli) {
      setError('Hanya akun pembeli yang dapat membeli.');
      return;
    }
    setMode('beli');
    setError('');
  }

  async function submitBeli(e) {
    e.preventDefault();
    if (!produk) return;
    setBusy(true);
    setError('');
    try {
      const qty = Math.max(1, Number(jumlah) || 1);
      const max = maxStok();
      if (max <= 0) {
        setError('Stok habis. Transaksi dibatalkan.');
        setBusy(false);
        return;
      }
      if (qty > max) {
        setError(`Stok kurang. Hanya tersisa ${max} pcs. Transaksi dibatalkan.`);
        setJumlah(max);
        setBusy(false);
        return;
      }
      const catatanBase = form.catatan?.trim() || '';
      const catatan = catatanBase ? `Jumlah: ${qty}. ${catatanBase}` : `Jumlah: ${qty}`;
      await pembeliApi.createPembelian({
        id_produk: produk.id_produk ?? produk.id,
        nama_pembeli: form.nama_pembeli,
        alamat_pembeli: form.alamat_pembeli,
        phone_pembeli: form.phone_pembeli,
        metode_pembayaran: form.metode_pembayaran,
        pengiriman: form.pengiriman,
        catatan: [form.metode_pembayaran === 'Bank Transfer' && form.bank ? `Bank: ${form.bank}` : '', catatan].filter(Boolean).join('. ') || catatan,
        jumlah: qty,
      });
      setToast('Transaksi berhasil dibuat');
      setTimeout(() => navigate('/akun/transaksi'), 800);
    } catch (err) {
      setError(err.message || 'Gagal membuat transaksi');
    } finally {
      setBusy(false);
    }
  }

  const total = produk ? Number(produk.harga || 0) * Math.max(1, Number(jumlah) || 1) : 0;

  return (
    <>
      <Header />
      <section className="py-5">
        <div className="container">
          <Link to="/toko" className="back-link">
            ← Kembali ke koleksi
          </Link>

          {loading && <p className="mt-4 text-muted">Memuat...</p>}
          {error && !produk && <p className="mt-4 text-danger">{error}</p>}

          {produk && (
            <div className="row g-4 align-items-start mt-1">
              <div className="col-lg-6">
                <div className="detail-media">
                  <SafeImg src={produk.gambar} alt={produk.nama_produk} className="detail-media__img" />
                </div>
              </div>

              <div className="col-lg-6">
                <span className="detail-kategori">{produk.kategori}</span>
                <h1 className="detail-title">{produk.nama_produk}</h1>
                <p className="detail-price">{formatRupiah(produk.harga)}</p>
                {produk.stok != null && (
                  <p className="small text-muted mb-2">
                    Stok: <strong>{produk.stok}</strong>
                    {Number(produk.stok) <= 0 ? (
                      <span className="text-danger ms-2">Habis</span>
                    ) : null}
                  </p>
                )}
                <div className="d-flex flex-wrap gap-2 mb-2 small text-muted">
</div>
                <p className="detail-desc">{produk.deskripsi}</p>
                <span className="badge-soft ok">Tersedia</span>

                <div className="d-flex align-items-center gap-3 mt-4 mb-3">
                  <label className="small fw-semibold mb-0">Jumlah</label>
                  <div className="qty-control">
                    <button type="button" onClick={() => setJumlah((n) => clampJumlah(n - 1))}>−</button>
                    <input
                      type="number"
                      min="1"
                      value={jumlah}
                      onChange={(e) => {
                      const max = maxStok();
                      const v = Math.max(1, Number(e.target.value) || 1);
                      if (max > 0 && v > max) {
                        setError(`Stok kurang. Hanya tersisa ${max} pcs.`);
                        setJumlah(max);
                      } else {
                        setError('');
                        setJumlah(v);
                      }
                    }}
                    />
                    <button type="button" onClick={() => {
                      const max = maxStok();
                      if (max > 0 && jumlah >= max) {
                        setError(`Stok kurang. Hanya tersisa ${max} pcs.`);
                        return;
                      }
                      setJumlah((n) => clampJumlah(n + 1));
                    }}>+</button>
                  </div>
                </div>

                <div className="d-flex flex-wrap gap-2">
                  {Number(produk.stok) === 0 ? (
                    <button type="button" className="btn btn-secondary px-4" disabled>Stok habis</button>
                  ) : (!isLoggedIn || isPembeli) ? (
                    <>
                      <button type="button" className="btn btn-brand px-4" onClick={handleBuyNow}>
                        {isLoggedIn ? 'Beli sekarang' : 'Masuk untuk beli'}
                      </button>
                      <button type="button" className="btn btn-outline-brand px-4" onClick={handleAddCart}>
                        <i className="bi bi-bag-plus me-1" /> {isLoggedIn ? 'Keranjang' : 'Masuk'}
                      </button>
                    </>
                  ) : (
                    <div className="alert alert-secondary py-2 small mb-0">
                      Akun admin tidak dapat membeli. Gunakan akun pembeli.
                    </div>
                  )}
                  <a href={SITE.link_wa} target="_blank" rel="noreferrer" className="btn btn-outline-brand px-3">
                    WA
                  </a>
                </div>

                {mode === 'beli' && (
                  <form className="buy-panel form-modern mt-4" onSubmit={submitBeli}>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h2 className="h6 fw-bold mb-0">Checkout cepat</h2>
                      <span className="fw-bold">{formatRupiah(total)}</span>
                    </div>
                    {error && <div className="alert alert-danger py-2 small">{error}</div>}
                    <div className="row g-3">
                      <div className="col-12">
                        <label className="form-label small fw-semibold">Nama penerima</label>
                        <input name="nama_pembeli" className="form-control" value={form.nama_pembeli} onChange={onChange} required />
                      </div>
                      <div className="col-12">
                        <label className="form-label small fw-semibold">Alamat pengiriman</label>
                        <textarea name="alamat_pembeli" className="form-control" rows={2} value={form.alamat_pembeli} onChange={onChange} required />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label small fw-semibold">No. HP / WA</label>
                        <input name="phone_pembeli" className="form-control" value={form.phone_pembeli} onChange={onChange} required />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label small fw-semibold">Metode bayar</label>
                        <select name="metode_pembayaran" className="form-select" value={form.metode_pembayaran} onChange={onChange}>
                          {METODE_BAYAR.map((m) => (
                            <option key={m} value={m}>{labelMetodeBayar(m)}</option>
                          ))}
                        </select>
                      </div>
                      {form.metode_pembayaran === 'Bank Transfer' && (
                        <div className="col-12">
                          <label className="form-label small fw-semibold">Bank tujuan</label>
                          <select name="bank" className="form-select" value={form.bank || BANK_OPTIONS[0].id} onChange={onChange}>
                            {BANK_OPTIONS.map((b) => (
                              <option key={b.id} value={b.id}>
                                {b.label} — {b.norek} a/n {b.atas_nama}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                      <div className="col-md-6">
                        <label className="form-label small fw-semibold">Pengiriman</label>
                        <select name="pengiriman" className="form-select" value={form.pengiriman} onChange={onChange}>
                          {SHIPPING.map((s) => (
                            <option key={s} value={s}>{labelPengiriman(s)}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label small fw-semibold">Catatan</label>
                        <input name="catatan" className="form-control" value={form.catatan} onChange={onChange} placeholder="Ukuran, warna..." />
                      </div>
                    </div>
                    <div className="d-flex gap-2 mt-3">
                      <button type="submit" className="btn btn-brand" disabled={busy}>
                        {busy ? 'Memproses...' : 'Konfirmasi transaksi'}
                      </button>
                      <button type="button" className="btn btn-outline-brand" onClick={() => setMode(null)} disabled={busy}>
                        Batal
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}
        </div>
      </section>
      {toast && <div className="cart-toast">{toast}</div>}
      <Footer />
    </>
  );
}

import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import SafeImg from '../components/SafeImg';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { pembeliApi } from '../api';
import { formatRupiah, labelMetodeBayar, labelPengiriman } from '../utils';
import { METODE_BAYAR, SHIPPING, BANK_OPTIONS } from '../constants';

export default function CartPage() {
  const navigate = useNavigate();
  const { items, count, subtotal, setQty, removeItem, clearCart } = useCart();
  const { isLoggedIn, isPembeli, user } = useAuth();
  const [form, setForm] = useState({
    nama_pembeli: '',
    alamat_pembeli: '',
    phone_pembeli: '',
    metode_pembayaran: METODE_BAYAR[0], bank: BANK_OPTIONS[0].id,
    pengiriman: SHIPPING[0],
    catatan: '',
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login', { state: { from: '/akun/keranjang' }, replace: true });
      return;
    }
    // Pembeli: keranjang di dalam area akun (sidebar tetap)
    if (isPembeli) {
      navigate('/akun/keranjang', { replace: true });
    }
  }, [isLoggedIn, isPembeli, navigate]);

  useEffect(() => {
    if (!user) return;
    setForm((f) => ({
      ...f,
      nama_pembeli: f.nama_pembeli || [user.nama_d, user.nama_b].filter(Boolean).join(' '),
      alamat_pembeli: f.alamat_pembeli || user.alamat || '',
      phone_pembeli: f.phone_pembeli || String(user.phone || ''),
    }));
  }, [user]);

  function onChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function checkout(e) {
    e.preventDefault();
    setError('');
    setMsg('');

    if (!isLoggedIn) {
      navigate('/login', { state: { from: '/akun/keranjang' } });
      return;
    }
    if (!isPembeli) {
      setError('Hanya akun pembeli yang dapat checkout. Akun admin tidak dapat membeli.');
      return;
    }
    if (!items.length) {
      setError('Keranjang kosong.');
      return;
    }

    setBusy(true);
    try {
      for (const item of items) {
        let bankNote = '';
        if (form.metode_pembayaran === 'Bank Transfer' && form.bank) {
          const b = BANK_OPTIONS.find((x) => x.id === form.bank) || BANK_OPTIONS[0];
          bankNote = `Bank: ${b.label} ${b.norek} a/n ${b.atas_nama}`;
        }
        const catatanBase = form.catatan?.trim() || '';
        const parts = [`Jumlah: ${item.jumlah}`, bankNote, catatanBase].filter(Boolean);
        const catatan = parts.join('. ') + (parts.length ? '.' : '');
        await pembeliApi.createPembelian({
          id_produk: item.id_produk,
          nama_pembeli: form.nama_pembeli,
          alamat_pembeli: form.alamat_pembeli,
          phone_pembeli: form.phone_pembeli,
          metode_pembayaran: form.metode_pembayaran,
          pengiriman: form.pengiriman,
          catatan,
          jumlah: item.jumlah,
        });
      }
      clearCart();
      setMsg('Transaksi berhasil. Mengalihkan...');
      setTimeout(() => navigate('/akun/transaksi'), 900);
    } catch (err) {
      setError(err.message || 'Checkout gagal');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Header />
      <main className="py-5">
        <div className="container">
          <div className="d-flex justify-content-between align-items-end mb-4 flex-wrap gap-2">
            <div>
              <p className="section-kicker mb-1">Keranjang</p>
              <h1 className="section-title mb-0">Keranjang belanja</h1>
            </div>
            <Link to="/toko" className="btn btn-outline-brand btn-sm">
              Lanjut belanja
            </Link>
          </div>

          {!items.length ? (
            <div className="panel empty-state">
              <p className="mb-3">Keranjang masih kosong.</p>
              <Link to="/toko" className="btn btn-brand">
                Lihat koleksi
              </Link>
            </div>
          ) : (
            <div className="row g-4">
              <div className="col-lg-7">
                <div className="panel p-0 overflow-hidden">
                  {items.map((item) => (
                    <div className="cart-row" key={item.id_produk}>
                      <SafeImg src={item.gambar} alt={item.nama_produk} className="cart-row__img" />
                      <div className="cart-row__body">
                        <div className="fw-semibold">{item.nama_produk}</div>
                        <div className="text-muted small">{formatRupiah(item.harga)}</div>
                        <div className="d-flex align-items-center gap-2 mt-2">
                          <div className="qty-control">
                            <button type="button" onClick={() => setQty(item.id_produk, item.jumlah - 1)}>−</button>
                            <input
                              type="number"
                              min="1"
                              value={item.jumlah}
                              onChange={(e) => setQty(item.id_produk, e.target.value)}
                            />
                            <button type="button" onClick={() => setQty(item.id_produk, item.jumlah + 1)}>+</button>
                          </div>
                          <button
                            type="button"
                            className="btn btn-sm btn-link text-danger text-decoration-none"
                            onClick={() => removeItem(item.id_produk)}
                          >
                            Hapus
                          </button>
                        </div>
                      </div>
                      <div className="cart-row__total">
                        {formatRupiah(item.harga * item.jumlah)}
                      </div>
                    </div>
                  ))}
                </div>
                <button type="button" className="btn btn-sm btn-outline-brand mt-3" onClick={clearCart}>
                  Kosongkan keranjang
                </button>
              </div>

              <div className="col-lg-5">
                <div className="panel">
                  <h2 className="h6 fw-bold mb-3">Ringkasan & checkout</h2>
                  <div className="d-flex justify-content-between mb-1">
                    <span className="text-muted">Item</span>
                    <span>{count}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-3">
                    <span className="fw-semibold">Subtotal</span>
                    <span className="fw-bold fs-5">{formatRupiah(subtotal)}</span>
                  </div>

                  {msg && <div className="alert alert-success py-2 small">{msg}</div>}
                  {error && <div className="alert alert-danger py-2 small">{error}</div>}

                  <form className="form-modern" onSubmit={checkout}>
                    <div className="mb-2">
                      <label className="form-label small fw-semibold">Nama penerima</label>
                      <input name="nama_pembeli" className="form-control" value={form.nama_pembeli} onChange={onChange} required />
                    </div>
                    <div className="mb-2">
                      <label className="form-label small fw-semibold">Alamat</label>
                      <textarea name="alamat_pembeli" className="form-control" rows={2} value={form.alamat_pembeli} onChange={onChange} required />
                    </div>
                    <div className="mb-2">
                      <label className="form-label small fw-semibold">No. HP</label>
                      <input name="phone_pembeli" className="form-control" value={form.phone_pembeli} onChange={onChange} required />
                    </div>
                    <div className="row g-2 mb-2">
                      <div className="col-6">
                        <label className="form-label small fw-semibold">Bayar</label>
                        <select name="metode_pembayaran" className="form-select" value={form.metode_pembayaran} onChange={onChange}>
                          {METODE_BAYAR.map((m) => (
                            <option key={m} value={m}>{labelMetodeBayar(m)}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-6">
                        <label className="form-label small fw-semibold">Kirim</label>
                        <select name="pengiriman" className="form-select" value={form.pengiriman} onChange={onChange}>
                          {SHIPPING.map((s) => (
                            <option key={s} value={s}>{labelPengiriman(s)}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    {form.metode_pembayaran === 'Bank Transfer' && (
                      <div className="mb-2">
                        <label className="form-label small fw-semibold">Bank tujuan</label>
                        <select name="bank" className="form-select" value={form.bank} onChange={onChange}>
                          {BANK_OPTIONS.map((b) => (
                            <option key={b.id} value={b.id}>
                              {b.label} — {b.norek} a/n {b.atas_nama}
                            </option>
                          ))}
                        </select>
                        <div className="form-text">Transfer ke rekening yang dipilih, lalu unggah bukti di menu Transaksi.</div>
                      </div>
                    )}
                    <div className="mb-3">
                      <label className="form-label small fw-semibold">Catatan</label>
                      <input name="catatan" className="form-control" value={form.catatan} onChange={onChange} placeholder="Opsional" />
                    </div>
                    {!isLoggedIn && (
                      <p className="small text-muted">Anda akan diminta login sebelum checkout.</p>
                    )}
                    <button type="submit" className="btn btn-brand w-100" disabled={busy}>
                      {busy ? 'Memproses...' : 'Checkout → Transaksi'}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

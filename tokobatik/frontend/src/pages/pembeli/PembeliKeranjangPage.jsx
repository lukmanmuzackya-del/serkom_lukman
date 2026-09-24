// Keranjang + checkout (form ringkas, tidak perlu scroll jauh untuk bayar)
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SafeImg from '../../components/SafeImg';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { pembeliApi } from '../../api';
import { formatRupiah, labelMetodeBayar, labelPengiriman } from '../../utils';
import { METODE_BAYAR, SHIPPING, BANK_OPTIONS } from '../../constants';

export default function PembeliKeranjangPage() {
  const navigate = useNavigate();
  const { items, count, subtotal, setQty, removeItem, clearCart } = useCart();
  const { user } = useAuth();
  const [form, setForm] = useState({
    nama_pembeli: '',
    alamat_pembeli: '',
    phone_pembeli: '',
    metode_pembayaran: METODE_BAYAR[0],
    bank: BANK_OPTIONS[0].id,
    pengiriman: SHIPPING[0],
    catatan: '',
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

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
          jumlah: Math.max(1, Number(item.jumlah) || 1),
        });
      }
      clearCart();
      setMsg('Checkout berhasil. Mengalihkan ke transaksi…');
      setTimeout(() => navigate('/akun/transaksi'), 600);
    } catch (err) {
      setError(err.message || 'Gagal checkout');
    } finally {
      setBusy(false);
    }
  }

  const selectedBank = BANK_OPTIONS.find((b) => b.id === form.bank) || BANK_OPTIONS[0];

  return (
    <div>
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-3">
        <div>
          <h2 className="page-title mb-1">Keranjang</h2>
          <p className="text-secondary small mb-0">
            {count > 0 ? `${count} item di keranjang` : 'Belum ada produk'}
          </p>
        </div>
        <Link to="/akun/belanja" className="btn btn-outline-brand btn-sm">
          + Belanja lagi
        </Link>
      </div>

      {msg && <div className="alert alert-success py-2">{msg}</div>}
      {error && <div className="alert alert-danger py-2">{error}</div>}

      {!items.length ? (
        <div className="panel empty-state text-center py-5">
          <i className="bi bi-bag display-6 text-muted d-block mb-3" />
          <p className="mb-3 text-secondary">Keranjang masih kosong.</p>
          <Link to="/akun/belanja" className="btn btn-brand">
            Belanja sekarang
          </Link>
        </div>
      ) : (
        <div className="row g-3 align-items-start">
          {/* Daftar item */}
          <div className="col-lg-6">
            <div className="panel p-0 overflow-hidden border rounded-3 bg-white">
              {items.map((item) => (
                <div
                  className="d-flex align-items-center gap-3 p-3 border-bottom"
                  key={item.id_produk}
                >
                  <SafeImg
                    src={item.gambar}
                    alt={item.nama_produk}
                    style={{
                      width: 64,
                      height: 64,
                      objectFit: 'cover',
                      borderRadius: 10,
                      flexShrink: 0,
                    }}
                  />
                  <div className="flex-grow-1 min-w-0">
                    <div className="fw-semibold text-truncate">{item.nama_produk}</div>
                    <div className="text-muted small">{formatRupiah(item.harga)}</div>
                    <div className="d-flex align-items-center gap-2 mt-1">
                      <div className="qty-control">
                        <button type="button" onClick={() => setQty(item.id_produk, item.jumlah - 1)}>
                          −
                        </button>
                        <input
                          type="number"
                          min="1"
                          value={item.jumlah}
                          onChange={(e) => setQty(item.id_produk, e.target.value)}
                        />
                        <button type="button" onClick={() => setQty(item.id_produk, item.jumlah + 1)}>
                          +
                        </button>
                      </div>
                      <button
                        type="button"
                        className="btn btn-sm btn-link text-danger text-decoration-none px-1"
                        onClick={() => removeItem(item.id_produk)}
                      >
                        <i className="bi bi-trash" />
                      </button>
                    </div>
                  </div>
                  <div className="fw-semibold small text-nowrap">
                    {formatRupiah(item.harga * item.jumlah)}
                  </div>
                </div>
              ))}
              <div className="p-3 d-flex justify-content-between align-items-center">
                <button type="button" className="btn btn-sm btn-outline-secondary" onClick={clearCart}>
                  Kosongkan keranjang
                </button>
                <div className="fw-bold">Total {formatRupiah(subtotal)}</div>
              </div>
            </div>
          </div>

          {/* Checkout — sticky + ringkas */}
          <div className="col-lg-6">
            <div className="checkout-panel panel border rounded-3 bg-white p-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h3 className="h6 fw-bold mb-0">Checkout &amp; bayar</h3>
                <span className="fw-bold text-brand">{formatRupiah(subtotal)}</span>
              </div>

              <form onSubmit={checkout} className="checkout-form-compact">
                <div className="row g-2 mb-2">
                  <div className="col-12">
                    <label className="form-label small fw-semibold mb-1">Nama penerima</label>
                    <input
                      name="nama_pembeli"
                      className="form-control form-control-sm"
                      value={form.nama_pembeli}
                      onChange={onChange}
                      required
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label small fw-semibold mb-1">Alamat</label>
                    <input
                      name="alamat_pembeli"
                      className="form-control form-control-sm"
                      value={form.alamat_pembeli}
                      onChange={onChange}
                      required
                      placeholder="Alamat lengkap"
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label small fw-semibold mb-1">No. HP</label>
                    <input
                      name="phone_pembeli"
                      className="form-control form-control-sm"
                      value={form.phone_pembeli}
                      onChange={onChange}
                      required
                    />
                  </div>
                </div>

                {/* Bayar + kirim sejajar */}
                <div className="row g-2 mb-2">
                  <div className="col-6">
                    <label className="form-label small fw-semibold mb-1">Bayar</label>
                    <select
                      name="metode_pembayaran"
                      className="form-select form-select-sm"
                      value={form.metode_pembayaran}
                      onChange={onChange}
                    >
                      {METODE_BAYAR.map((m) => (
                        <option key={m} value={m}>
                          {labelMetodeBayar(m)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-6">
                    <label className="form-label small fw-semibold mb-1">Kirim</label>
                    <select
                      name="pengiriman"
                      className="form-select form-select-sm"
                      value={form.pengiriman}
                      onChange={onChange}
                    >
                      {SHIPPING.map((s) => (
                        <option key={s} value={s}>
                          {labelPengiriman(s)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {form.metode_pembayaran === 'Bank Transfer' && (
                  <div className="mb-2 bank-box">
                    <label className="form-label small fw-semibold mb-1">Bank tujuan</label>
                    <select
                      name="bank"
                      className="form-select form-select-sm"
                      value={form.bank}
                      onChange={onChange}
                    >
                      {BANK_OPTIONS.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.label} — {b.norek} a/n {b.atas_nama}
                        </option>
                      ))}
                    </select>
                    <div className="bank-box__info small mt-1">
                      <strong>{selectedBank.label}</strong> {selectedBank.norek} a/n{' '}
                      {selectedBank.atas_nama}
                      <span className="text-muted"> · Unggah bukti di Transaksi</span>
                    </div>
                  </div>
                )}

                <div className="mb-2">
                  <label className="form-label small fw-semibold mb-1">Catatan</label>
                  <input
                    name="catatan"
                    className="form-control form-control-sm"
                    value={form.catatan}
                    onChange={onChange}
                    placeholder="Opsional"
                  />
                </div>

                <button type="submit" className="btn btn-brand w-100" disabled={busy}>
                  {busy ? 'Memproses...' : 'Checkout → Transaksi'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

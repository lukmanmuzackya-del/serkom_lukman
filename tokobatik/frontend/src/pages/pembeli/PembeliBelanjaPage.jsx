// pages/pembeli/PembeliBelanjaPage.jsx — pilih produk lalu isi form pembelian
// Bisa diakses langsung dengan ?produk=id (dari tombol "Pesan Sekarang" di ProductDetailPage)
import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { pembeliApi } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { METODE_BAYAR, SHIPPING } from '../../constants';
import { formatRupiah, labelMetodeBayar, labelPengiriman } from '../../utils';
import SafeImg from '../../components/SafeImg';

const FORM_KOSONG = {
  nama_pembeli: '', alamat_pembeli: '', phone_pembeli: '',
  metode_pembayaran: METODE_BAYAR[0], pengiriman: SHIPPING[0], catatan: '',
  jumlah: 1,
};

export default function PembeliBelanjaPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addItem } = useCart();

  const [produkList, setProdukList] = useState([]);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(FORM_KOSONG);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [cartMsg, setCartMsg] = useState('');

  useEffect(() => {
    pembeliApi.getProduk()
      .then((res) => setProdukList(res.data || []))
      .catch((err) => setError(err.message || 'Gagal memuat produk'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const produkId = searchParams.get('produk');
    if (produkId && produkList.length > 0) {
      const found = produkList.find((p) => String(p.id_produk) === produkId);
      if (found) setSelected(found);
    }
  }, [searchParams, produkList]);

  useEffect(() => {
    if (user) {
      setForm((f) => ({ ...f, nama_pembeli: `${user.nama_d} ${user.nama_b}`, alamat_pembeli: user.alamat || '', phone_pembeli: user.phone || '' }));
    }
  }, [user]);

  function pilihProduk(produk) {
    setSelected(produk);
    setSearchParams({ produk: produk.id_produk });
  }

  function handleChange(e) { setForm({ ...form, [e.target.name]: e.target.value }); }

  function onAddToCart(e, produk) {
    e.preventDefault();
    e.stopPropagation();
    addItem(produk, 1);
    setCartMsg(`"${produk.nama_produk}" ditambahkan ke keranjang`);
    setTimeout(() => setCartMsg(''), 2000);
  }

  function onBuyNow(e, produk) {
    e.preventDefault();
    e.stopPropagation();
    addItem(produk, 1);
    navigate('/akun/keranjang');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await pembeliApi.createPembelian({ id_produk: selected.id_produk, ...form });
      setSuccess('Pesanan berhasil dibuat!');
      setTimeout(() => navigate('/akun/pesanan'), 1000);
    } catch (err) {
      setError(err.message || 'Gagal membuat pesanan');
    } finally { setSubmitting(false); }
  }

  if (loading) return <p>Memuat...</p>;

  return (
    <div>
      <h1 className="h3 fw-bold mb-4">Belanja</h1>

      {cartMsg && (
        <div className="alert alert-success py-2 small mb-3">{cartMsg}</div>
      )}

      {!selected ? (
        <div className="row row-cols-2 row-cols-md-4 g-3">
          {produkList.map((p) => (
            <div className="col" key={p.id_produk}>
              <div className="card h-100 border-0 shadow-sm d-flex flex-column">
                <div
                  role="button"
                  onClick={() => pilihProduk(p)}
                  className="flex-grow-1"
                  style={{ cursor: 'pointer' }}
                >
                  <SafeImg src={p.gambar} alt={p.nama_produk} className="card-img-top" style={{ height: 120, objectFit: 'cover' }} />
                  <div className="card-body p-2 pb-1">
                    <p className="small fw-semibold mb-1">{p.nama_produk}</p>
                    <p className="small text-brand fw-bold mb-0">{formatRupiah(p.harga)}</p>
                  </div>
                </div>
                <div className="card-body pt-0 pb-2 px-2 d-flex gap-1">
                  <button
                    type="button"
                    className="btn btn-sm btn-brand flex-grow-1"
                    onClick={(e) => onBuyNow(e, p)}
                    title="Beli sekarang"
                  >
                    <i className="bi bi-bag-check me-1" /> Beli
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-brand"
                    onClick={(e) => onAddToCart(e, p)}
                    title="Tambah ke keranjang"
                  >
                    <i className="bi bi-bag-plus" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="row g-4">
          <div className="col-md-4">
            <div className="card border-0 shadow-sm">
              <SafeImg src={selected.gambar} alt={selected.nama_produk} className="card-img-top" style={{ height: 180, objectFit: 'cover' }} />
              <div className="card-body">
                <h2 className="h6">{selected.nama_produk}</h2>
                <p className="text-brand fw-bold">{formatRupiah(selected.harga)}</p>
                <div className="d-flex flex-wrap gap-2 mb-2">
                  <button
                    type="button"
                    className="btn btn-sm btn-brand"
                    onClick={(e) => onBuyNow(e, selected)}
                  >
                    <i className="bi bi-bag-check me-1" /> Beli
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-brand"
                    onClick={(e) => onAddToCart(e, selected)}
                  >
                    <i className="bi bi-bag-plus me-1" /> Keranjang
                  </button>
                </div>
                <button onClick={() => { setSelected(null); setSearchParams({}); }} className="btn btn-sm btn-outline-secondary">Ganti Produk</button>
              </div>
            </div>
          </div>

          <div className="col-md-8">
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <h2 className="h6 fw-bold mb-3">Form Pemesanan</h2>
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Nama Penerima</label>
                    <input name="nama_pembeli" className="form-control" value={form.nama_pembeli} onChange={handleChange} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Alamat Pengiriman</label>
                    <textarea name="alamat_pembeli" className="form-control" rows="2" value={form.alamat_pembeli} onChange={handleChange} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">No. HP</label>
                    <input name="phone_pembeli" className="form-control" value={form.phone_pembeli} onChange={handleChange} required />
                  </div>
                  <div className="row g-3 mb-3">
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Metode Pembayaran</label>
                      <select name="metode_pembayaran" className="form-select" value={form.metode_pembayaran} onChange={handleChange}>
                        {METODE_BAYAR.map((m) => <option key={m} value={m}>{labelMetodeBayar(m)}</option>)}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Pengiriman</label>
                      <select name="pengiriman" className="form-select" value={form.pengiriman} onChange={handleChange}>
                        {SHIPPING.map((s) => <option key={s} value={s}>{labelPengiriman(s)}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Jumlah pesanan</label>
                    <input
                      type="number"
                      name="jumlah"
                      min={1}
                      className="form-control"
                      value={form.jumlah}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Catatan (opsional)</label>
                    <textarea name="catatan" className="form-control" rows="2" value={form.catatan} onChange={handleChange} />
                  </div>

                  {error && <p className="text-danger small">{error}</p>}
                  {success && <p className="text-success small">{success}</p>}

                  <button type="submit" disabled={submitting} className="btn btn-brand px-4">
                    {submitting ? 'Memproses...' : 'Buat Pesanan'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

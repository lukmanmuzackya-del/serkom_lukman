import { SITE } from '../../constants';
// pages/pembeli/PembeliPesananPage.jsx — bayar + visual status pesanan
import { useMemo, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { pembeliApi } from '../../api';
import { usePembeliList } from '../../hooks';
import { formatRupiah,
  formatTanggal,
  labelStatusBayar,
  labelMetodeBayar,
  labelPengiriman, printStruk } from '../../utils';
import SafeImg from '../../components/SafeImg';
import OrderStatusTracker, {
  OrderStatusSummary,
  getOrderStepIndex,
  orderStepLabel,
  STEPS,
  filterOrdersByStep,
} from '../../components/pembeli/OrderStatusTracker';

export default function PembeliPesananPage() {
  const { rows: pesanan, loading, error, reload } = usePembeliList(pembeliApi.getPembelian);
  const [busyId, setBusyId] = useState(null);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [showSelesai, setShowSelesai] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const tahap = searchParams.get('tahap') || '';

  async function bayar(id, metode) {
    setBusyId(id);
    setMsg('');
    setErr('');
    try {
      await pembeliApi.updatePembelian(id, {
        metode_pembayaran: metode,
        pembayaran: 'Dibayar',
      });
      setMsg(`Pembayaran ${metode} berhasil. Pesanan ditandai Dibayar.`);
      reload();
    } catch (e) {
      setErr(e.message || 'Gagal memproses pembayaran');
    } finally {
      setBusyId(null);
    }
  }

  async function konfirmasiDiterima(id) {
    setBusyId(id);
    setMsg('');
    setErr('');
    try {
      await pembeliApi.updatePembelian(id, { status: 'Diterima' });
      setMsg('Pesanan dikonfirmasi diterima.');
      reload();
    } catch (e) {
      setErr(e.message || 'Gagal mengubah status');
    } finally {
      setBusyId(null);
    }
  }

  function qtyOf(p) {
    if (p.jumlah != null) return Number(p.jumlah) || 1;
    const m = String(p.catatan || '').match(/Jumlah:\s*(\d+)/i);
    return m ? Number(m[1]) : 1;
  }

  function totalOf(p) {
    const harga = Number(p.harga || p.produk_harga || 0);
    return harga * qtyOf(p);
  }

  const aktif = pesanan.filter((p) => String(p.status).toLowerCase() !== 'selesai');
  const selesai = pesanan.filter((p) => String(p.status).toLowerCase() === 'selesai');

  // Filter dari klik ikon Pesanan Saya (?tahap=bayar|dikemas|dikirim|selesai)
  const list = useMemo(() => {
    if (tahap && STEPS.some((s) => s.key === tahap)) {
      return filterOrdersByStep(pesanan, tahap);
    }
    return showSelesai ? selesai : aktif;
  }, [pesanan, tahap, showSelesai, aktif, selesai]);

  const tahapLabel = STEPS.find((s) => s.key === tahap)?.label;

  useEffect(() => {
    if (tahap === 'selesai') setShowSelesai(true);
    else if (tahap) setShowSelesai(false);
  }, [tahap]);

  return (
    <div>
      <p className="text-secondary mb-3">Riwayat pesanan, pembayaran, dan status pengiriman.</p>

      {!loading && pesanan.length > 0 && (
        <div className="mb-4">
          <OrderStatusSummary orders={pesanan} linkTo="/akun/pesanan" />
        </div>
      )}

      {tahap && (
        <div className="alert alert-light border d-flex justify-content-between align-items-center py-2 mb-3">
          <span className="small mb-0">
            Menampilkan tahap: <strong>{tahapLabel || tahap}</strong> ({list.length} pesanan)
          </span>
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary"
            onClick={() => setSearchParams({})}
          >
            Tampilkan semua
          </button>
        </div>
      )}

      {!tahap && (
        <div className="d-flex gap-2 mb-3">
          <button
            type="button"
            className={`btn btn-sm ${!showSelesai ? 'btn-brand' : 'btn-outline-secondary'}`}
            onClick={() => setShowSelesai(false)}
          >
            Aktif ({aktif.length})
          </button>
          <button
            type="button"
            className={`btn btn-sm ${showSelesai ? 'btn-brand' : 'btn-outline-secondary'}`}
            onClick={() => setShowSelesai(true)}
          >
            Selesai ({selesai.length})
          </button>
        </div>
      )}

      {msg && <div className="alert alert-success py-2">{msg}</div>}
      {err && <div className="alert alert-danger py-2">{err}</div>}
      {error && <div className="alert alert-danger py-2">{error}</div>}
      {loading && <p className="text-muted">Memuat pesanan…</p>}

      {!loading && !list.length && (
        <div className="empty-state">Belum ada pesanan {showSelesai ? 'selesai' : 'aktif'}.</div>
      )}

      {!loading && list.length > 0 && (
        <div className="accordion" id="pesananAccordion">
          {list.map((p) => {
            const qty = qtyOf(p);
            const total = totalOf(p);
            const belumBayar = String(p.pembayaran || '').toLowerCase().includes('belum');
            const isSelesai = String(p.status).toLowerCase() === 'selesai';
            const stepIdx = getOrderStepIndex(p);

            return (
              <div className="accordion-item border-0 shadow-sm mb-2 rounded overflow-hidden" key={p.id}>
                <h2 className="accordion-header">
                  <button
                    className="accordion-button collapsed"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target={`#pesanan-${p.id}`}
                  >
                    <SafeImg
                      src={p.produk_gambar || p.gambar}
                      alt={p.nama_produk}
                      style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 6, marginRight: 12 }}
                    />
                    <div className="flex-fill text-start">
                      <div className="fw-semibold">{p.nama_produk}</div>
                      <div className="small text-muted">
                        {formatTanggal(p.created_at)} · {qty} item · {formatRupiah(total)}
                      </div>
                    </div>
                    <span
                      className={`badge me-2 ${
                        stepIdx === 3 ? 'bg-success' : stepIdx === 0 ? 'bg-warning text-dark' : 'bg-secondary'
                      }`}
                    >
                      {orderStepLabel(p)}
                    </span>
                  </button>
                </h2>
                <div id={`pesanan-${p.id}`} className="accordion-collapse collapse" data-bs-parent="#pesananAccordion">
                  <div className="accordion-body small">
                    {/* Visual status sesuai pesanan */}
                    <div className="mb-1 fw-semibold">Status pesanan</div>
                    <OrderStatusTracker order={p} />

                    <div className="row g-2 mb-3 mt-1">
                      <div className="col-sm-6">
                        <b>Jumlah pesanan:</b> {qty} produk
                      </div>
                      <div className="col-sm-6">
                        <b>Total:</b> {formatRupiah(total)}
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-brand ms-2"
                          onClick={() => printStruk(p, SITE)}
                        >
                          <i className="bi bi-printer" /> Struk
                        </button>
                      </div>
                      <div className="col-sm-6">
                        <b>Status Pembayaran:</b> {labelStatusBayar(p.pembayaran)}
                      </div>
                      <div className="col-sm-6">
                        <b>Metode:</b> {labelMetodeBayar(p.metode_pembayaran)}
                      </div>
                      <div className="col-sm-6">
                        <b>Pengiriman:</b> {labelPengiriman(p.pengiriman)}
                      </div>
                      <div className="col-sm-6">
                        <b>Status proses:</b> {p.status}
                      </div>
                      <div className="col-12">
                        <b>Alamat:</b> {p.alamat_pembeli || '-'}
                      </div>
                      <div className="col-12">
                        <b>No. HP:</b> {p.phone_pembeli || '-'}
                      </div>
                      <div className="col-12">
                        <b>Catatan:</b> {p.catatan || '-'}
                      </div>
                    </div>

                    {!isSelesai && belumBayar && (
                      <div className="border-top pt-3 mb-2">
                        <div className="fw-semibold mb-2">Konfirmasi pembayaran</div>
                        <div className="d-flex flex-wrap gap-2">
                          <button
                            type="button"
                            className="btn btn-sm btn-brand"
                            disabled={busyId === p.id}
                            onClick={() => bayar(p.id, 'Bank Transfer')}
                          >
                            Bank Transfer
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-brand"
                            disabled={busyId === p.id}
                            onClick={() => bayar(p.id, 'COD')}
                          >
                            COD
                          </button>
                        </div>
                        <p className="text-muted small mt-2 mb-0">
                          Setelah konfirmasi, status pembayaran menjadi <b>Dibayar</b>. Admin akan memproses pengiriman.
                        </p>
                      </div>
                    )}

                    {!isSelesai && !belumBayar && ['Dikirim', 'Dikemas'].includes(p.status) && (
                      <div className="border-top pt-3">
                        <div className="fw-semibold mb-2">Konfirmasi penerimaan</div>
                        <button
                          type="button"
                          className="btn btn-sm btn-dark"
                          disabled={busyId === p.id}
                          onClick={() => konfirmasiDiterima(p.id)}
                        >
                          Tandai Diterima
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

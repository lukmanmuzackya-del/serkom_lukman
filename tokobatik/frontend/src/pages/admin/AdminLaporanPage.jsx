import { useEffect, useState } from 'react';
import { adminApi } from '../../api';
import { useAdminGuard } from '../../hooks';
import LoadingBlock from '../../components/admin/LoadingBlock';
import { formatRupiah, formatTanggal } from '../../utils';
import { STATUS_PROSES } from '../../constants';

function qtyOf(p) {
  if (p?.jumlah != null) return Number(p.jumlah) || 1;
  const m = String(p?.catatan || '').match(/Jumlah:\s*(\d+)/i);
  return m ? Number(m[1]) : 1;
}

function extractLaporan(res) {
  // apiRequest normalize → { data, raw, message }
  const raw = res?.raw || {};
  const data = res?.data;

  let ringkasan =
    raw.ringkasan ||
    (data && data.ringkasan) ||
    (data && !Array.isArray(data) && data.total_transaksi != null
      ? data
      : null) ||
    res?.ringkasan ||
    null;

  let laporan =
    raw.laporan ||
    (data && data.laporan) ||
    (Array.isArray(data) ? data : null) ||
    res?.laporan ||
    [];

  if (!Array.isArray(laporan)) laporan = [];
  if (!ringkasan) {
    ringkasan = {
      total_transaksi: laporan.length,
      total_pendapatan: 0,
    };
  }
  return { ringkasan, laporan };
}

export default function AdminLaporanPage() {
  const { handleError } = useAdminGuard();
  const [dari, setDari] = useState('');
  const [sampai, setSampai] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [ringkasan, setRingkasan] = useState({ total_transaksi: 0, total_pendapatan: 0 });
  const [rows, setRows] = useState([]);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (dari) params.dari = dari;
      if (sampai) params.sampai = sampai;
      if (status) params.status = status;
      const res = await adminApi.getLaporan(params);
      const { ringkasan: ring, laporan } = extractLaporan(res);
      setRingkasan({
        total_transaksi: Number(ring.total_transaksi) || laporan.length,
        total_pendapatan: Number(ring.total_pendapatan) || 0,
        dari: ring.dari || dari || null,
        sampai: ring.sampai || sampai || null,
      });
      setRows(laporan);
    } catch (e) {
      if (!handleError(e)) setError(e.message || 'Gagal memuat laporan');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function printPage() {
    window.print();
  }

  return (
    <div className="laporan-page anim-fade-in">
      <p className="text-secondary mb-3">Laporan penjualan berdasarkan tanggal dan status pesanan.</p>

      <div className="panel mb-3 anim-slide-up">
        <div className="row g-2 align-items-end">
          <div className="col-md-3">
            <label className="form-label small fw-semibold">Dari tanggal</label>
            <input type="date" className="form-control" value={dari} onChange={(e) => setDari(e.target.value)} />
          </div>
          <div className="col-md-3">
            <label className="form-label small fw-semibold">Sampai tanggal</label>
            <input type="date" className="form-control" value={sampai} onChange={(e) => setSampai(e.target.value)} />
          </div>
          <div className="col-md-3">
            <label className="form-label small fw-semibold">Status</label>
            <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">Semua status</option>
              {STATUS_PROSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-3 d-flex gap-2">
            <button type="button" className="btn btn-brand flex-grow-1" onClick={load} disabled={loading}>
              {loading ? 'Memuat…' : 'Tampilkan'}
            </button>
            <button type="button" className="btn btn-outline-secondary" onClick={printPage} title="Cetak">
              <i className="bi bi-printer" />
            </button>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-danger anim-fade-in">{error}</div>}
      {loading ? (
        <LoadingBlock text="Memuat laporan…" />
      ) : (
        <>
          <div className="row g-3 mb-3">
            <div className="col-md-6 anim-slide-up" style={{ animationDelay: '0.05s' }}>
              <div className="metric-card">
                <div className="metric-card__label">Total transaksi</div>
                <div className="metric-card__value">{ringkasan.total_transaksi ?? rows.length}</div>
              </div>
            </div>
            <div className="col-md-6 anim-slide-up" style={{ animationDelay: '0.1s' }}>
              <div className="metric-card">
                <div className="metric-card__label">Total pendapatan (dibayar/selesai)</div>
                <div className="metric-card__value">{formatRupiah(ringkasan.total_pendapatan || 0)}</div>
              </div>
            </div>
          </div>

          <div className="admin-panel anim-slide-up" style={{ animationDelay: '0.15s' }}>
            <div className="table-responsive">
              <table className="table table-sm table-hover mb-0 align-middle">
                <thead>
                  <tr>
                    <th>Tanggal</th>
                    <th>Pembeli</th>
                    <th>Produk</th>
                    <th>Qty</th>
                    <th>Total</th>
                    <th>Bayar</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => {
                    const qty = qtyOf(r);
                    const harga = Number(r.harga || r.produk_harga || 0);
                    const namaPembeli =
                      r.nama_pembeli ||
                      [r.pembeli_nama_d, r.pembeli_nama_b].filter(Boolean).join(' ') ||
                      r.pembeli_uname ||
                      '—';
                    return (
                      <tr key={r.id}>
                        <td className="small">{formatTanggal(r.created_at)}</td>
                        <td>{namaPembeli}</td>
                        <td>{r.nama_produk || '—'}</td>
                        <td>{qty}</td>
                        <td>{formatRupiah(harga * qty)}</td>
                        <td>{r.pembayaran || '—'}</td>
                        <td>
                          <span className="badge bg-secondary">{r.status}</span>
                        </td>
                      </tr>
                    );
                  })}
                  {!rows.length && (
                    <tr>
                      <td colSpan={7} className="text-center text-muted py-4">
                        Tidak ada data pada filter ini.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

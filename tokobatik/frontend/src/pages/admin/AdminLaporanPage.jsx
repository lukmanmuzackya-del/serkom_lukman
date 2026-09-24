import { useEffect, useState } from 'react';
import { adminApi } from '../../api';
import { useAdminGuard } from '../../hooks';
import LoadingBlock from '../../components/admin/LoadingBlock';
import { formatRupiah, formatTanggal } from '../../utils';
import { STATUS_PROSES, SITE } from '../../constants';

function qtyOf(p) {
  if (p?.jumlah != null) return Number(p.jumlah) || 1;
  const m = String(p?.catatan || '').match(/Jumlah:\s*(\d+)/i);
  return m ? Number(m[1]) : 1;
}

function namaPembeliOf(r) {
  return (
    r.nama_pembeli ||
    [r.pembeli_nama_d, r.pembeli_nama_b].filter(Boolean).join(' ') ||
    r.pembeli_uname ||
    '—'
  );
}

function totalOf(r) {
  const qty = qtyOf(r);
  const harga = Number(r.harga || r.produk_harga || 0);
  return harga * qty;
}

function extractLaporan(res) {
  const raw = res?.raw || {};
  const data = res?.data;

  let ringkasan =
    raw.ringkasan ||
    (data && data.ringkasan) ||
    (data && !Array.isArray(data) && data.total_transaksi != null ? data : null) ||
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
    ringkasan = { total_transaksi: laporan.length, total_pendapatan: 0 };
  }
  return { ringkasan, laporan };
}

/** Buka jendela cetak struk satu transaksi */
function cetakStruk(r) {
  const qty = qtyOf(r);
  const harga = Number(r.harga || r.produk_harga || 0);
  const total = harga * qty;
  const nama = namaPembeliOf(r);
  const toko = SITE.nama_toko || 'Batik Nusantara';
  const alamat = SITE.alamat_toko || '';
  const tlp = SITE.tlp_toko || '';

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <title>Struk #${r.id} — ${toko}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: "Courier New", Courier, monospace;
      font-size: 12px;
      color: #111;
      padding: 12px;
      max-width: 320px;
      margin: 0 auto;
    }
    .center { text-align: center; }
    .bold { font-weight: 700; }
    .line { border-top: 1px dashed #333; margin: 8px 0; }
    .row { display: flex; justify-content: space-between; gap: 8px; margin: 2px 0; }
    .muted { color: #555; font-size: 11px; }
    h1 { font-size: 14px; margin-bottom: 2px; }
    @media print {
      body { padding: 0; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="center">
    <h1 class="bold">${toko}</h1>
    <div class="muted">${alamat}</div>
    <div class="muted">${tlp}</div>
  </div>
  <div class="line"></div>
  <div class="center bold">STRUK TRANSAKSI</div>
  <div class="row"><span>No</span><span>#${r.id}</span></div>
  <div class="row"><span>Tanggal</span><span>${formatTanggal(r.created_at)}</span></div>
  <div class="row"><span>Pembeli</span><span>${nama}</span></div>
  <div class="line"></div>
  <div class="bold">${r.nama_produk || 'Produk'}</div>
  <div class="row"><span>${qty} x ${formatRupiah(harga)}</span><span>${formatRupiah(total)}</span></div>
  <div class="line"></div>
  <div class="row bold"><span>TOTAL</span><span>${formatRupiah(total)}</span></div>
  <div class="row"><span>Bayar</span><span>${r.pembayaran || '—'} / ${r.metode_pembayaran || '—'}</span></div>
  <div class="row"><span>Status</span><span>${r.status || '—'}</span></div>
  <div class="row"><span>Kirim</span><span>${r.pengiriman || '—'}</span></div>
  <div class="line"></div>
  <div class="center muted">Terima kasih telah berbelanja<br/>${toko}</div>
  <div class="center no-print" style="margin-top:16px">
    <button onclick="window.print()" style="padding:8px 16px;cursor:pointer">Cetak</button>
    <button onclick="window.close()" style="padding:8px 16px;cursor:pointer;margin-left:8px">Tutup</button>
  </div>
  <script>window.onload = function(){ setTimeout(function(){ window.print(); }, 250); };</script>
</body>
</html>`;

  const w = window.open('', '_blank', 'width=400,height=600');
  if (!w) {
    alert('Popup diblokir. Izinkan popup untuk mencetak struk.');
    return;
  }
  w.document.write(html);
  w.document.close();
}

/** Simpan laporan sebagai CSV (bisa dibuka Excel) */
function simpanCSV(rows, ringkasan) {
  const header = ['No', 'ID', 'Tanggal', 'Pembeli', 'Produk', 'Qty', 'Harga', 'Total', 'Pembayaran', 'Metode', 'Status', 'Pengiriman'];
  const lines = [header.join(',')];
  rows.forEach((r, i) => {
    const qty = qtyOf(r);
    const harga = Number(r.harga || r.produk_harga || 0);
    const cells = [
      i + 1,
      r.id,
      `"${formatTanggal(r.created_at)}"`,
      `"${String(namaPembeliOf(r)).replace(/"/g, '""')}"`,
      `"${String(r.nama_produk || '—').replace(/"/g, '""')}"`,
      qty,
      harga,
      harga * qty,
      `"${r.pembayaran || ''}"`,
      `"${r.metode_pembayaran || ''}"`,
      `"${r.status || ''}"`,
      `"${r.pengiriman || ''}"`,
    ];
    lines.push(cells.join(','));
  });
  lines.push('');
  lines.push(`Total transaksi,${ringkasan.total_transaksi || rows.length}`);
  lines.push(`Total pendapatan,${ringkasan.total_pendapatan || 0}`);

  const blob = new Blob(['\ufeff' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const tgl = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `laporan-batik-nusantara-${tgl}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Simpan ringkasan + detail sebagai teks */
function simpanTXT(rows, ringkasan) {
  const toko = SITE.nama_toko || 'Batik Nusantara';
  const lines = [
    `LAPORAN PENJUALAN — ${toko}`,
    `Dicetak: ${formatTanggal(new Date().toISOString())}`,
    `Periode: ${ringkasan.dari || '—'} s/d ${ringkasan.sampai || '—'}`,
    `Total transaksi: ${ringkasan.total_transaksi || rows.length}`,
    `Total pendapatan: ${formatRupiah(ringkasan.total_pendapatan || 0)}`,
    ''.padEnd(48, '-'),
  ];
  rows.forEach((r, i) => {
    const qty = qtyOf(r);
    const total = totalOf(r);
    lines.push(
      `${i + 1}. #${r.id} | ${formatTanggal(r.created_at)}`,
      `   ${namaPembeliOf(r)} — ${r.nama_produk || '—'}`,
      `   ${qty} x | ${formatRupiah(total)} | ${r.pembayaran || '—'} | ${r.status || '—'}`,
      ''
    );
  });
  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `laporan-batik-nusantara-${new Date().toISOString().slice(0, 10)}.txt`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
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

  function printLaporan() {
    window.print();
  }

  return (
    <div className="laporan-page anim-fade-in">
      <p className="text-secondary mb-3 no-print">
        Laporan penjualan — filter tanggal/status, cetak struk per transaksi, atau simpan file.
      </p>

      <div className="panel mb-3 anim-slide-up no-print">
        <div className="row g-2 align-items-end">
          <div className="col-md-3">
            <label className="form-label small fw-semibold">Dari tanggal</label>
            <input type="date" className="form-control" value={dari} onChange={(e) => setDari(e.target.value)} />
          </div>
          <div className="col-md-3">
            <label className="form-label small fw-semibold">Sampai tanggal</label>
            <input type="date" className="form-control" value={sampai} onChange={(e) => setSampai(e.target.value)} />
          </div>
          <div className="col-md-2">
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
          <div className="col-md-4 d-flex flex-wrap gap-2">
            <button type="button" className="btn btn-brand flex-grow-1" onClick={load} disabled={loading}>
              {loading ? 'Memuat…' : 'Tampilkan'}
            </button>
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={printLaporan}
              title="Cetak laporan"
              disabled={!rows.length}
            >
              <i className="bi bi-printer" /> Cetak
            </button>
            <button
              type="button"
              className="btn btn-outline-brand"
              onClick={() => simpanCSV(rows, ringkasan)}
              title="Simpan CSV (Excel)"
              disabled={!rows.length}
            >
              <i className="bi bi-download" /> CSV
            </button>
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => simpanTXT(rows, ringkasan)}
              title="Simpan teks"
              disabled={!rows.length}
            >
              <i className="bi bi-file-text" /> TXT
            </button>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-danger anim-fade-in no-print">{error}</div>}
      {loading ? (
        <LoadingBlock text="Memuat laporan…" />
      ) : (
        <>
          <div className="print-only print-laporan-header mb-3">
            <h1 className="h5 fw-bold mb-1">{SITE.nama_toko || 'Batik Nusantara'} — Laporan Penjualan</h1>
            <p className="small mb-0">
              Periode: {ringkasan.dari || '—'} s/d {ringkasan.sampai || '—'} · Dicetak:{' '}
              {formatTanggal(new Date().toISOString())}
            </p>
          </div>

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
                    <th className="no-print" style={{ width: 100 }}>
                      Struk
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => {
                    const qty = qtyOf(r);
                    const total = totalOf(r);
                    return (
                      <tr key={r.id}>
                        <td className="small">{formatTanggal(r.created_at)}</td>
                        <td>{namaPembeliOf(r)}</td>
                        <td>{r.nama_produk || '—'}</td>
                        <td>{qty}</td>
                        <td>{formatRupiah(total)}</td>
                        <td>{r.pembayaran || '—'}</td>
                        <td>
                          <span className="badge bg-secondary">{r.status}</span>
                        </td>
                        <td className="no-print">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-brand"
                            title="Cetak struk"
                            onClick={() => cetakStruk(r)}
                          >
                            <i className="bi bi-receipt" /> Struk
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {!rows.length && (
                    <tr>
                      <td colSpan={8} className="text-center text-muted py-4">
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

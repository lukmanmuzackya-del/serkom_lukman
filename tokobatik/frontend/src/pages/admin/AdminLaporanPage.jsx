import { useEffect, useMemo, useState } from 'react';
import { BarChart } from '../../components/SimpleCharts';
import { adminApi } from '../../api';
import { useAdminGuard } from '../../hooks';
import LoadingBlock from '../../components/admin/LoadingBlock';
import { formatRupiah, formatTanggal } from '../../utils';
import { STATUS_PROSES, SITE, KATEGORI_PRODUK } from '../../constants';

const PER_PAGE = 5;

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
  return Number(r.harga || r.produk_harga || 0) * qtyOf(r);
}

function extractLaporan(res) {
  const raw = res?.raw || {};
  const data =
    res?.data && typeof res.data === 'object' && !Array.isArray(res.data) ? res.data : null;
  const ringkasan = raw.ringkasan || data?.ringkasan || res?.ringkasan || {
    total_transaksi: 0,
    total_pendapatan: 0,
  };
  let laporan = raw.laporan || data?.laporan || res?.laporan || [];
  if (!Array.isArray(laporan)) laporan = Array.isArray(data) ? data : [];
  let rekap = raw.rekap_kategori || data?.rekap_kategori || res?.rekap_kategori || [];
  if (!Array.isArray(rekap)) rekap = [];
  return { ringkasan, laporan, rekap_kategori: rekap };
}

function cetakStruk(r) {
  const qty = qtyOf(r);
  const harga = Number(r.harga || r.produk_harga || 0);
  const total = harga * qty;
  const nama = namaPembeliOf(r);
  const toko = SITE.nama_toko || 'Batik Nusantara';
  const kat = r.kategori || r.kategori_produk || '—';
  const html = `<!DOCTYPE html><html lang="id"><head><meta charset="utf-8"/>
<title>Struk #${r.id}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:"Courier New",monospace;font-size:12px;padding:12px;max-width:320px;margin:0 auto}
.center{text-align:center}.bold{font-weight:700}
.line{border-top:1px dashed #333;margin:8px 0}
.row{display:flex;justify-content:space-between;gap:8px;margin:2px 0}
.muted{color:#555;font-size:11px}
@media print{.no-print{display:none!important}}
</style></head><body>
<div class="center"><div class="bold" style="font-size:14px">${toko}</div>
<div class="muted">${SITE.alamat_toko || ''}</div>
<div class="muted">${SITE.tlp_toko || ''}</div></div>
<div class="line"></div>
<div class="center bold">STRUK TRANSAKSI</div>
<div class="row"><span>No</span><span>#${r.id}</span></div>
<div class="row"><span>Tanggal</span><span>${formatTanggal(r.created_at)}</span></div>
<div class="row"><span>Pembeli</span><span>${nama}</span></div>
<div class="row"><span>Kategori</span><span>${kat}</span></div>
<div class="line"></div>
<div class="bold">${r.nama_produk || 'Produk'}</div>
<div class="row"><span>${qty} x ${formatRupiah(harga)}</span><span>${formatRupiah(total)}</span></div>
<div class="line"></div>
<div class="row bold"><span>TOTAL</span><span>${formatRupiah(total)}</span></div>
<div class="row"><span>Bayar</span><span>${r.pembayaran || '—'} / ${r.metode_pembayaran || '—'}</span></div>
<div class="row"><span>Status</span><span>${r.status || '—'}</span></div>
<div class="line"></div>
<div class="center muted">Terima kasih<br/>${toko}</div>
<div class="center no-print" style="margin-top:16px">
<button onclick="window.print()">Cetak</button>
<button onclick="window.close()">Tutup</button>
</div>
<script>setTimeout(function(){window.print()},300)</script>
</body></html>`;
  const w = window.open('', '_blank', 'width=400,height=600');
  if (!w) {
    alert('Izinkan popup untuk cetak struk');
    return;
  }
  w.document.write(html);
  w.document.close();
}

function simpanCSV(rows, ringkasan) {
  const lines = [
    'No,ID,Tanggal,Pembeli,Produk,Kategori,Qty,Harga,Total,Pembayaran,Metode,Status,Pengiriman',
  ];
  rows.forEach((r, i) => {
    const qty = qtyOf(r);
    const harga = Number(r.harga || r.produk_harga || 0);
    lines.push(
      [
        i + 1,
        r.id,
        `"${formatTanggal(r.created_at)}"`,
        `"${String(namaPembeliOf(r)).replace(/"/g, '""')}"`,
        `"${String(r.nama_produk || '').replace(/"/g, '""')}"`,
        `"${String(r.kategori || r.kategori_produk || '').replace(/"/g, '""')}"`,
        qty,
        harga,
        harga * qty,
        `"${r.pembayaran || ''}"`,
        `"${r.metode_pembayaran || ''}"`,
        `"${r.status || ''}"`,
        `"${r.pengiriman || ''}"`,
      ].join(',')
    );
  });
  lines.push('');
  lines.push(`Total transaksi,${ringkasan.total_transaksi || rows.length}`);
  lines.push(`Total pendapatan,${ringkasan.total_pendapatan || 0}`);
  const blob = new Blob(['\ufeff' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `laporan-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
}

export default function AdminLaporanPage() {
  const { handleError } = useAdminGuard();
  const [dari, setDari] = useState('');
  const [sampai, setSampai] = useState('');
  const [status, setStatus] = useState('');
  const [kategori, setKategori] = useState('');
  const [kategoriList, setKategoriList] = useState(KATEGORI_PRODUK || []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [ringkasan, setRingkasan] = useState({ total_transaksi: 0, total_pendapatan: 0 });
  const [rows, setRows] = useState([]);
  const [rekap, setRekap] = useState([]);
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(rows.length / PER_PAGE) || 1);
  const pageRows = useMemo(
    () => rows.slice((page - 1) * PER_PAGE, page * PER_PAGE),
    [rows, page]
  );

  const chartByKategori = useMemo(() => {
    if (rekap?.length) {
      return rekap.map((k) => ({
        label: k.kategori,
        value: Number(k.total) || 0,
        jumlah: k.jumlah,
      }));
    }
    const map = {};
    rows.forEach((r) => {
      const kat = r.kategori || r.kategori_produk || 'Lainnya';
      if (!map[kat]) map[kat] = 0;
      const harga = Number(r.harga || r.produk_harga || 0);
      let qty = 1;
      if (r.jumlah != null) qty = Number(r.jumlah) || 1;
      map[kat] += harga * qty;
    });
    return Object.entries(map).map(([label, value]) => ({ label, value }));
  }, [rekap, rows]);

  const chartByStatus = useMemo(() => {
    const map = {};
    rows.forEach((r) => {
      const st = r.status || 'Lainnya';
      map[st] = (map[st] || 0) + 1;
    });
    return Object.entries(map).map(([label, value]) => ({ label, value }));
  }, [rows]);

  useEffect(() => {
    adminApi
      .getKategori()
      .then((res) => {
        const list = (res.kategori || res.raw?.kategori || res.data || [])
          .map((k) => (typeof k === 'string' ? k : k.nama))
          .filter(Boolean);
        if (list.length) setKategoriList(list);
      })
      .catch(() => {});
  }, []);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (dari) params.dari = dari;
      if (sampai) params.sampai = sampai;
      if (status) params.status = status;
      if (kategori) params.kategori = kategori;
      const res = await adminApi.getLaporan(params);
      const { ringkasan: ring, laporan, rekap_kategori } = extractLaporan(res);
      setRingkasan({
        total_transaksi: Number(ring.total_transaksi) || laporan.length,
        total_pendapatan: Number(ring.total_pendapatan) || 0,
        dari: ring.dari || dari || null,
        sampai: ring.sampai || sampai || null,
        kategori: ring.kategori || kategori || null,
      });
      // Cadangan: sembunyikan dibatalkan di frontend (backend juga filter)
      const filtered = status === 'Dibatalkan'
        ? laporan
        : laporan.filter((r) => String(r.status || '').toLowerCase() !== 'dibatalkan');
      setRows(filtered);
      setRekap(rekap_kategori || []);
      setPage(1);
    } catch (e) {
      if (!handleError(e)) setError(e.message || 'Gagal memuat laporan');
      setRows([]);
      setRekap([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="laporan-page">
      {/* FILTER */}
      <div className="panel mb-3 no-print">
        <div className="row g-2 align-items-end">
          <div className="col-6 col-lg">
            <label className="form-label small fw-semibold mb-1">Dari</label>
            <input
              type="date"
              className="form-control form-control-sm"
              value={dari}
              onChange={(e) => setDari(e.target.value)}
            />
          </div>
          <div className="col-6 col-lg">
            <label className="form-label small fw-semibold mb-1">Sampai</label>
            <input
              type="date"
              className="form-control form-control-sm"
              value={sampai}
              onChange={(e) => setSampai(e.target.value)}
            />
          </div>
          <div className="col-6 col-lg">
            <label className="form-label small fw-semibold mb-1">Status</label>
            <select
              className="form-select form-select-sm"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">Semua</option>
              {STATUS_PROSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="col-6 col-lg">
            <label className="form-label small fw-semibold mb-1">Kategori</label>
            <select
              className="form-select form-select-sm"
              value={kategori}
              onChange={(e) => setKategori(e.target.value)}
            >
              <option value="">Semua kategori</option>
              {kategoriList.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </div>
          <div className="col-12 col-lg-auto d-flex flex-wrap gap-2">
            <button type="button" className="btn btn-sm btn-brand" onClick={load} disabled={loading}>
              Tampilkan
            </button>
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              onClick={() => window.print()}
              disabled={!rows.length}
            >
              <i className="bi bi-printer" /> Cetak
            </button>
            <button
              type="button"
              className="btn btn-sm btn-outline-brand"
              onClick={() => simpanCSV(rows, ringkasan)}
              disabled={!rows.length}
            >
              <i className="bi bi-download" /> CSV
            </button>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-danger py-2 no-print">{error}</div>}

      {loading ? (
        <LoadingBlock text="Memuat laporan…" />
      ) : (
        <>
          {/* REKAP TOTAL */}
          <div className="row g-2 mb-3">
            <div className="col-sm-6">
              <div className="metric-card">
                <div className="metric-card__label">Total transaksi</div>
                <div className="metric-card__value">{ringkasan.total_transaksi}</div>
              </div>
            </div>
            <div className="col-sm-6">
              <div className="metric-card">
                <div className="metric-card__label">Total pendapatan</div>
                <div className="metric-card__value">
                  {formatRupiah(ringkasan.total_pendapatan || 0)}
                </div>
              </div>
            </div>
          </div>

          
          {/* DIAGRAM BATANG PENJUALAN */}
          <div className="row g-3 mb-3 no-print">
            <div className="col-lg-7">
              <div className="chart-card">
                <div className="chart-card__title">Diagram batang — penjualan per kategori (sesuai filter)</div>
                <BarChart
                  data={chartByKategori}
                  labelKey="label"
                  valueKey="value"
                  formatValue={(v) => formatRupiah(v)}
                  height={240}
                />
              </div>
            </div>
            <div className="col-lg-5">
              <div className="chart-card">
                <div className="chart-card__title">Diagram batang — status (sesuai filter laporan)</div>
                <BarChart
                  data={chartByStatus}
                  labelKey="label"
                  valueKey="value"
                  height={240}
                />
              </div>
            </div>
          </div>

          {/* REKAP KATEGORI */}
          {rekap.length > 0 && (
            <div className="admin-panel mb-3 p-3">
              <h3 className="h6 fw-bold mb-2">Rekap per kategori</h3>
              <table className="table table-sm mb-0">
                <thead>
                  <tr>
                    <th>Kategori</th>
                    <th>Jumlah</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {rekap.map((k) => (
                    <tr key={k.kategori}>
                      <td>{k.kategori}</td>
                      <td>{k.jumlah}</td>
                      <td>{formatRupiah(k.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* DAFTAR — max 5 baris, tanpa scroll box */}
          <div className="admin-panel p-3">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h3 className="h6 fw-bold mb-0">Daftar transaksi</h3>
              <span className="small text-muted no-print">
                {rows.length} data
                {rows.length > PER_PAGE ? ` · hlm ${page}/${totalPages}` : ''}
              </span>
            </div>

            {/* class admin-table-no-scroll = matikan max-height global */}
            <div className="table-responsive admin-table-no-scroll">
              <table className="table table-sm table-hover mb-0 align-middle">
                <thead>
                  <tr>
                    <th className="text-center" style={{ width: 40 }}>
                      No
                    </th>
                    <th>Tanggal</th>
                    <th>Pembeli</th>
                    <th>Produk</th>
                    <th>Kategori</th>
                    <th>Qty</th>
                    <th>Total</th>
                    <th>Bayar</th>
                    <th>Status</th>
                    <th className="no-print">Struk</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((r, idx) => (
                    <tr key={r.id}>
                      <td className="text-center text-muted">
                        {(page - 1) * PER_PAGE + idx + 1}
                      </td>
                      <td>{formatTanggal(r.created_at)}</td>
                      <td>{namaPembeliOf(r)}</td>
                      <td>{r.nama_produk || '—'}</td>
                      <td>{r.kategori || r.kategori_produk || '—'}</td>
                      <td>{qtyOf(r)}</td>
                      <td>{formatRupiah(totalOf(r))}</td>
                      <td>{r.pembayaran || '—'}</td>
                      <td>
                        <span className="badge bg-secondary">{r.status}</span>
                      </td>
                      <td className="no-print">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-brand btn-struk"
                          onClick={() => cetakStruk(r)}
                        >
                          <i className="bi bi-receipt" /> Struk
                        </button>
                      </td>
                    </tr>
                  ))}
                  {!rows.length && (
                    <tr>
                      <td colSpan={10} className="text-center text-muted py-4">
                        Tidak ada data.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {rows.length > PER_PAGE && (
              <div className="laporan-pager no-print">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary rounded-pill px-3"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  ← Sebelumnya
                </button>
                <span className="small text-muted fw-semibold">
                  {page} / {totalPages}
                </span>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary rounded-pill px-3"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Selanjutnya →
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

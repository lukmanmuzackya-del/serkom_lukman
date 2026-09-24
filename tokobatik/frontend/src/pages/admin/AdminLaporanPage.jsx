import { useEffect, useState } from 'react';
import { adminApi } from '../../api';
import { useAdminGuard } from '../../hooks';
import LoadingBlock from '../../components/admin/LoadingBlock';
import { formatRupiah, formatTanggal } from '../../utils';
import { STATUS_PROSES, SITE, KATEGORI_PRODUK } from '../../constants';

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
  const data = res?.data && typeof res.data === 'object' && !Array.isArray(res.data) ? res.data : null;

  const ringkasan =
    raw.ringkasan ||
    data?.ringkasan ||
    res?.ringkasan ||
    { total_transaksi: 0, total_pendapatan: 0 };

  let laporan = raw.laporan || data?.laporan || res?.laporan || [];
  if (!Array.isArray(laporan)) {
    if (Array.isArray(data)) laporan = data;
    else laporan = [];
  }

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
  const alamat = SITE.alamat_toko || '';
  const tlp = SITE.tlp_toko || '';
  const kat = r.kategori || r.kategori_produk || '—';

  const html = `<!DOCTYPE html>
<html lang="id"><head><meta charset="utf-8"/>
<title>Struk #${r.id} — ${toko}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:"Courier New",Courier,monospace;font-size:12px;color:#111;padding:12px;max-width:320px;margin:0 auto}
  .center{text-align:center}.bold{font-weight:700}
  .line{border-top:1px dashed #333;margin:8px 0}
  .row{display:flex;justify-content:space-between;gap:8px;margin:2px 0}
  .muted{color:#555;font-size:11px} h1{font-size:14px;margin-bottom:2px}
  @media print{.no-print{display:none!important}}
</style></head><body>
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
  <div class="row"><span>Kategori</span><span>${kat}</span></div>
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
  <script>window.onload=function(){setTimeout(function(){window.print()},250)}</script>
</body></html>`;

  const w = window.open('', '_blank', 'width=400,height=600');
  if (!w) {
    alert('Popup diblokir. Izinkan popup untuk mencetak struk.');
    return;
  }
  w.document.write(html);
  w.document.close();
}

function simpanCSV(rows, ringkasan, rekap) {
  const header = [
    'No', 'ID', 'Tanggal', 'Pembeli', 'Produk', 'Kategori', 'Qty', 'Harga', 'Total',
    'Pembayaran', 'Metode', 'Status', 'Pengiriman',
  ];
  const lines = [header.join(',')];
  rows.forEach((r, i) => {
    const qty = qtyOf(r);
    const harga = Number(r.harga || r.produk_harga || 0);
    lines.push(
      [
        i + 1,
        r.id,
        `"${formatTanggal(r.created_at)}"`,
        `"${String(namaPembeliOf(r)).replace(/"/g, '""')}"`,
        `"${String(r.nama_produk || '—').replace(/"/g, '""')}"`,
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
  if (rekap?.length) {
    lines.push('');
    lines.push('Rekap kategori,Jumlah transaksi,Total');
    rekap.forEach((k) => {
      lines.push(`"${k.kategori}",${k.jumlah},${k.total}`);
    });
  }
  const blob = new Blob(['\ufeff' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `laporan-batik-nusantara-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function simpanTXT(rows, ringkasan, rekap) {
  const toko = SITE.nama_toko || 'Batik Nusantara';
  const lines = [
    `LAPORAN PENJUALAN — ${toko}`,
    `Dicetak: ${formatTanggal(new Date().toISOString())}`,
    `Periode: ${ringkasan.dari || '—'} s/d ${ringkasan.sampai || '—'}`,
    `Kategori: ${ringkasan.kategori || 'Semua'}`,
    `Total transaksi: ${ringkasan.total_transaksi || rows.length}`,
    `Total pendapatan: ${formatRupiah(ringkasan.total_pendapatan || 0)}`,
    ''.padEnd(48, '-'),
  ];
  if (rekap?.length) {
    lines.push('REKAP PER KATEGORI');
    rekap.forEach((k) => {
      lines.push(`  ${k.kategori}: ${k.jumlah} trx · ${formatRupiah(k.total)}`);
    });
    lines.push(''.padEnd(48, '-'));
  }
  rows.forEach((r, i) => {
    lines.push(
      `${i + 1}. #${r.id} | ${formatTanggal(r.created_at)}`,
      `   ${namaPembeliOf(r)} — ${r.nama_produk || '—'} (${r.kategori || r.kategori_produk || '—'})`,
      `   ${qtyOf(r)} x | ${formatRupiah(totalOf(r))} | ${r.pembayaran || '—'} | ${r.status || '—'}`,
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
  const [kategori, setKategori] = useState('');
  const [kategoriList, setKategoriList] = useState(KATEGORI_PRODUK || []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [ringkasan, setRingkasan] = useState({ total_transaksi: 0, total_pendapatan: 0 });
  const [rows, setRows] = useState([]);
  const [rekap, setRekap] = useState([]);

  useEffect(() => {
    adminApi
      .getKategori()
      .then((res) => {
        const list = (res.kategori || res.data || []).map((k) => k.nama || k).filter(Boolean);
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
      setRows(laporan);
      setRekap(rekap_kategori || []);
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
    <div className="laporan-page anim-fade-in">
      <p className="text-secondary mb-3 no-print">
        Laporan penjualan: tampilkan transaksi, rekap total, filter periode/kategori, cetak struk &amp; simpan file.
      </p>

      {/* Filter */}
      <div className="panel mb-3 anim-slide-up no-print">
        <div className="row g-2 align-items-end">
          <div className="col-6 col-md-2">
            <label className="form-label small fw-semibold">Dari tanggal</label>
            <input type="date" className="form-control form-control-sm" value={dari} onChange={(e) => setDari(e.target.value)} />
          </div>
          <div className="col-6 col-md-2">
            <label className="form-label small fw-semibold">Sampai tanggal</label>
            <input type="date" className="form-control form-control-sm" value={sampai} onChange={(e) => setSampai(e.target.value)} />
          </div>
          <div className="col-6 col-md-2">
            <label className="form-label small fw-semibold">Status</label>
            <select className="form-select form-select-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">Semua status</option>
              {STATUS_PROSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="col-6 col-md-2">
            <label className="form-label small fw-semibold">Kategori</label>
            <select className="form-select form-select-sm" value={kategori} onChange={(e) => setKategori(e.target.value)}>
              <option value="">Semua kategori</option>
              {kategoriList.map((k) => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
          </div>
          <div className="col-12 col-md-4 d-flex flex-wrap gap-2">
            <button type="button" className="btn btn-sm btn-brand" onClick={load} disabled={loading}>
              {loading ? 'Memuat…' : 'Tampilkan'}
            </button>
            <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => window.print()} disabled={!rows.length} title="Cetak laporan">
              <i className="bi bi-printer" /> Cetak
            </button>
            <button type="button" className="btn btn-sm btn-outline-brand" onClick={() => simpanCSV(rows, ringkasan, rekap)} disabled={!rows.length} title="Simpan CSV">
              <i className="bi bi-download" /> CSV
            </button>
            <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => simpanTXT(rows, ringkasan, rekap)} disabled={!rows.length} title="Simpan TXT">
              <i className="bi bi-file-text" /> TXT
            </button>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-danger no-print">{error}</div>}
      {loading ? (
        <LoadingBlock text="Memuat laporan…" />
      ) : (
        <>
          <div className="print-only print-laporan-header mb-3">
            <h1 className="h5 fw-bold mb-1">{SITE.nama_toko || 'Batik Nusantara'} — Laporan Penjualan</h1>
            <p className="small mb-0">
              Periode: {ringkasan.dari || '—'} s/d {ringkasan.sampai || '—'}
              {ringkasan.kategori ? ` · Kategori: ${ringkasan.kategori}` : ''}
              {' · '}Dicetak: {formatTanggal(new Date().toISOString())}
            </p>
          </div>

          {/* Rekap total penjualan */}
          <div className="row g-3 mb-3">
            <div className="col-md-6">
              <div className="metric-card">
                <div className="metric-card__label">Total transaksi</div>
                <div className="metric-card__value">{ringkasan.total_transaksi ?? rows.length}</div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="metric-card">
                <div className="metric-card__label">Total pendapatan (dibayar/selesai)</div>
                <div className="metric-card__value">{formatRupiah(ringkasan.total_pendapatan || 0)}</div>
              </div>
            </div>
          </div>

          {/* Rekap per kategori */}
          {rekap.length > 0 && (
            <div className="admin-panel mb-3">
              <h3 className="h6 fw-bold mb-2">Rekap per kategori</h3>
              <div className="table-responsive">
                <table className="table table-sm mb-0 align-middle">
                  <thead>
                    <tr>
                      <th>Kategori</th>
                      <th>Jumlah transaksi</th>
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
            </div>
          )}

          {/* Daftar transaksi — max ~5 baris terlihat, geser horizontal */}
          <div className="admin-panel">
            <h3 className="h6 fw-bold mb-2">Daftar transaksi</h3>
            <div className="laporan-table-scroll">
              <table className="table table-sm table-hover mb-0 align-middle laporan-table">
                <thead>
                  <tr>
                    <th className="text-center" style={{ width: 48 }}>No</th>
                    <th>Tanggal</th>
                    <th>Pembeli</th>
                    <th>Produk</th>
                    <th>Kategori</th>
                    <th>Qty</th>
                    <th>Total</th>
                    <th>Bayar</th>
                    <th>Status</th>
                    <th className="no-print" style={{ width: 90 }}>Struk</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, idx) => (
                    <tr key={r.id}>
                      <td className="text-center text-muted small">{idx + 1}</td>
                      <td className="small text-nowrap">{formatTanggal(r.created_at)}</td>
                      <td className="text-nowrap">{namaPembeliOf(r)}</td>
                      <td className="text-nowrap">{r.nama_produk || '—'}</td>
                      <td className="small text-nowrap">{r.kategori || r.kategori_produk || '—'}</td>
                      <td>{qtyOf(r)}</td>
                      <td className="text-nowrap">{formatRupiah(totalOf(r))}</td>
                      <td className="text-nowrap">{r.pembayaran || '—'}</td>
                      <td><span className="badge bg-secondary">{r.status}</span></td>
                      <td className="no-print">
                        <button type="button" className="btn btn-sm btn-outline-brand" title="Cetak struk" onClick={() => cetakStruk(r)}>
                          <i className="bi bi-receipt" /> Struk
                        </button>
                      </td>
                    </tr>
                  ))}
                  {!rows.length && (
                    <tr>
                      <td colSpan={10} className="text-center text-muted py-4">
                        Tidak ada data pada filter ini.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {rows.length > 5 && (
              <p className="small text-muted mt-2 mb-0 no-print">
                <i className="bi bi-arrow-left-right me-1" />
                Geser ke kanan untuk melihat kolom lainnya · {rows.length} transaksi
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

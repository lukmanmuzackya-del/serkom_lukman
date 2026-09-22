import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { pembeliApi } from '../../api';
import { usePembeliList } from '../../hooks';
import {
  formatRupiah,
  formatTanggal,
  labelStatusBayar,
  labelMetodeBayar,
  labelPengiriman,
  mediaUrl,
} from '../../utils';
import SafeImg from '../../components/SafeImg';
import { METODE_BAYAR, BANK_OPTIONS } from '../../constants';
import { useCart } from '../../context/CartContext';
import { labelMetodeBayar as labelBayar } from '../../utils';

export default function PembeliTransaksiPage() {
  const { rows: pesanan, loading, error, reload } = usePembeliList(pembeliApi.getPembelian);
  const { addItem } = useCart();
  const [busyId, setBusyId] = useState(null);
  const [busyAll, setBusyAll] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [tab, setTab] = useState('aktif');
  const [selected, setSelected] = useState(() => new Set());
  const [metodeMassal, setMetodeMassal] = useState(METODE_BAYAR[0]);
  const [bankMassal, setBankMassal] = useState(BANK_OPTIONS[0].id);
  const [bankSatu, setBankSatu] = useState({}); // id -> bank
  const [buktiFile, setBuktiFile] = useState({}); // id -> File
  const [buktiMassal, setBuktiMassal] = useState(null); // File untuk bayar banyak/semua


  const belumBayarList = useMemo(
    () =>
      pesanan.filter((p) => {
        const status = String(p.status || '').toLowerCase();
        const bayar = String(p.pembayaran || '').toLowerCase();
        return status !== 'dibatalkan' && status !== 'selesai' && bayar.includes('belum');
      }),
    [pesanan]
  );

  function qtyOf(p) {
    if (p.jumlah != null) return Number(p.jumlah) || 1;
    const m = String(p.catatan || '').match(/Jumlah:\s*(\d+)/i);
    return m ? Number(m[1]) : 1;
  }

  function totalOf(p) {
    const harga = Number(p.harga || p.produk_harga || 0);
    return harga * qtyOf(p);
  }

  function toggleSelect(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAllBelumBayar() {
    if (selected.size === belumBayarList.length && belumBayarList.length > 0) {
      setSelected(new Set());
      return;
    }
    setSelected(new Set(belumBayarList.map((p) => p.id)));
  }

  async function bayarSatu(id, metode) {
    setBusyId(id);
    setMsg('');
    setErr('');
    try {
      const row = pesanan.find((x) => x.id === id);
      const qty = row ? qtyOf(row) : 1;
      if (metode === 'Bank Transfer') {
        const bankId = bankSatu[id] || BANK_OPTIONS[0].id;
        const b = BANK_OPTIONS.find((x) => x.id === bankId) || BANK_OPTIONS[0];
        const file = buktiFile[id];
        if (!file) {
          setErr('Untuk Bank Transfer, unggah bukti pembayaran dulu.');
          setBusyId(null);
          return;
        }
        // unggah bukti
        await pembeliApi.uploadBukti(id, file);
        const catatanBaru = `Jumlah: ${qty}. Bank: ${b.label} ${b.norek} a/n ${b.atas_nama}.`;
        await pembeliApi.updatePembelian(id, {
          metode_pembayaran: 'Bank Transfer',
          pembayaran: 'Dibayar',
          catatan: catatanBaru,
        });
        setMsg(`Bukti transfer ${b.label} terkirim. Menunggu verifikasi admin.`);
      } else {
        await pembeliApi.updatePembelian(id, {
          metode_pembayaran: metode,
          pembayaran: 'Dibayar',
          catatan: `Jumlah: ${qty}.`,
        });
        setMsg(`Pembayaran ${metode} untuk pesanan #${id} berhasil.`);
      }
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      reload();
    } catch (e) {
      setErr(e.message || 'Gagal memproses pembayaran');
    } finally {
      setBusyId(null);
    }
  }

  function buildCatatanBayar(row, metode) {
    const qty = row ? qtyOf(row) : 1;
    if (metode === 'Bank Transfer') {
      const b = BANK_OPTIONS.find((x) => x.id === bankMassal) || BANK_OPTIONS[0];
      return `Jumlah: ${qty}. Bank: ${b.label} ${b.norek} a/n ${b.atas_nama}.`;
    }
    return `Jumlah: ${qty}.`;
  }

  /** Bayar daftar id dengan metode massal + bukti (Bank Transfer) */
  async function prosesBayarMassal(list) {
    if (!list.length) {
      setErr('Tidak ada pesanan yang dipilih.');
      return;
    }
    if (metodeMassal === 'Bank Transfer' && !buktiMassal) {
      setErr('Untuk Bank Transfer, unggah bukti pembayaran dulu (satu bukti untuk semua pesanan yang dipilih).');
      return;
    }
    if (metodeMassal === 'Bank Transfer') {
      const totalRp = list.reduce((s, p) => s + totalOf(p), 0);
      if (
        !window.confirm(
          `Bayar ${list.length} pesanan (total ${totalRp.toLocaleString('id-ID')}) via Bank Transfer dengan bukti yang sama?`
        )
      ) {
        return;
      }
    } else if (!window.confirm(`Bayar ${list.length} pesanan dengan COD?`)) {
      return;
    }

    setBusyAll(true);
    setMsg('');
    setErr('');
    let ok = 0;
    let fail = 0;

    for (const p of list) {
      try {
        if (metodeMassal === 'Bank Transfer' && buktiMassal) {
          await pembeliApi.uploadBukti(p.id, buktiMassal);
        }
        await pembeliApi.updatePembelian(p.id, {
          metode_pembayaran: metodeMassal,
          pembayaran: 'Dibayar',
          catatan: buildCatatanBayar(p, metodeMassal),
        });
        ok += 1;
      } catch {
        fail += 1;
      }
    }

    setSelected(new Set());
    setBuktiMassal(null);
    reload();
    if (ok) {
      setMsg(
        metodeMassal === 'Bank Transfer'
          ? `Bukti terkirim untuk ${ok} pesanan. Menunggu verifikasi admin.`
          : `Berhasil bayar ${ok} pesanan (COD).`
      );
    }
    if (fail) setErr(`${fail} pesanan gagal dibayar.`);
    setBusyAll(false);
  }

  async function bayarTerpilih() {
    const list = belumBayarList.filter((p) => selected.has(p.id));
    if (!list.length) {
      setErr('Pilih minimal satu pesanan yang belum dibayar.');
      return;
    }
    await prosesBayarMassal(list);
  }

  async function bayarSemuaBelum() {
    if (!belumBayarList.length) {
      setErr('Tidak ada pesanan yang belum dibayar.');
      return;
    }
    await prosesBayarMassal(belumBayarList);
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

  async function tandaiSelesai(id) {
    setBusyId(id);
    setMsg('');
    setErr('');
    try {
      await pembeliApi.updatePembelian(id, { status: 'Selesai' });
      setMsg('Transaksi selesai.');
      reload();
    } catch (e) {
      setErr(e.message || 'Gagal menyelesaikan transaksi');
    } finally {
      setBusyId(null);
    }
  }

  function qtyOfOrder(p) {
    if (p.jumlah != null) return Math.max(1, Number(p.jumlah) || 1);
    const m = String(p.catatan || '').match(/Jumlah:\s*(\d+)/i);
    return m ? Math.max(1, Number(m[1]) || 1) : 1;
  }

  async function batalkan(p) {
    if (!window.confirm('Batalkan pesanan ini? Barang akan dikembalikan ke keranjang.')) return;
    const id = typeof p === 'object' ? p.id : p;
    const row = typeof p === 'object' ? p : pesanan.find((x) => x.id === id);
    setBusyId(id);
    setMsg('');
    setErr('');
    try {
      await pembeliApi.updatePembelian(id, { status: 'Dibatalkan' });
      // Kembalikan ke keranjang
      if (row) {
        addItem(
          {
            id_produk: row.id_produk,
            nama_produk: row.nama_produk || `Produk #${row.id_produk}`,
            harga: Number(row.harga || row.produk_harga) || 0,
            gambar: row.gambar || row.produk_gambar || '',
            kategori: row.kategori || '',
          },
          qtyOfOrder(row)
        );
      }
      setMsg('Pesanan dibatalkan. Barang dikembalikan ke keranjang.');
      reload();
    } catch (e) {
      setErr(e.message || 'Gagal membatalkan pesanan');
    } finally {
      setBusyId(null);
    }
  }

  const aktif = pesanan.filter(
    (p) => !['selesai', 'dibatalkan'].includes(String(p.status).toLowerCase())
  );
  const selesai = pesanan.filter((p) => String(p.status).toLowerCase() === 'selesai');
  const list = tab === 'aktif' ? aktif : tab === 'selesai' ? selesai : pesanan;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-3">
        <div>
          <h2 className="page-title mb-1">Transaksi</h2>
          <p className="text-secondary mb-0 small">
            Bayar satu pesanan atau bayar banyak sekaligus.
          </p>
        </div>
        <div className="d-flex gap-2">
          <Link to="/akun/keranjang" className="btn btn-sm btn-outline-brand">
            Keranjang
          </Link>
          <Link to="/toko" className="btn btn-sm btn-brand">
            Belanja
          </Link>
        </div>
      </div>

      {/* Panel bayar massal */}
      {belumBayarList.length > 0 && (
        <div className="panel mb-3">
          <div className="d-flex flex-wrap align-items-end gap-3">
            <div>
              <div className="small text-muted mb-1">Belum dibayar</div>
              <div className="fw-bold">{belumBayarList.length} pesanan</div>
            </div>
            <div>
              <label className="form-label small mb-1">Metode bayar massal</label>
              <select
                className="form-select form-select-sm"
                style={{ minWidth: 160 }}
                value={metodeMassal}
                onChange={(e) => setMetodeMassal(e.target.value)}
              >
                {METODE_BAYAR.map((m) => (
                  <option key={m} value={m}>
                    {labelBayar(m)}
                  </option>
                ))}
              </select>
            </div>
            {metodeMassal === 'Bank Transfer' && (
              <>
                <div>
                  <label className="form-label small mb-1">Bank tujuan</label>
                  <select
                    className="form-select form-select-sm"
                    style={{ minWidth: 200 }}
                    value={bankMassal}
                    onChange={(e) => setBankMassal(e.target.value)}
                  >
                    {BANK_OPTIONS.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.label} — {b.norek}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label small mb-1">
                    Bukti transfer <span className="text-danger">*</span>
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    className="form-control form-control-sm"
                    style={{ minWidth: 200 }}
                    onChange={(e) => setBuktiMassal(e.target.files?.[0] || null)}
                  />
                  {buktiMassal ? (
                    <div className="small text-success mt-1">
                      <i className="bi bi-check-circle me-1" />
                      {buktiMassal.name}
                    </div>
                  ) : (
                    <div className="form-text">Satu bukti untuk semua pesanan yang dibayar.</div>
                  )}
                </div>
              </>
            )}
            <button
              type="button"
              className="btn btn-sm btn-outline-brand"
              disabled={
                busyAll ||
                selected.size === 0 ||
                (metodeMassal === 'Bank Transfer' && !buktiMassal)
              }
              onClick={bayarTerpilih}
            >
              Bayar terpilih ({selected.size})
            </button>
            <button
              type="button"
              className="btn btn-sm btn-brand"
              disabled={busyAll}
              onClick={bayarSemuaBelum}
            >
              {busyAll ? 'Memproses...' : `Bayar semua (${belumBayarList.length})`}
            </button>
          </div>
        </div>
      )}

      <div className="d-flex gap-2 mb-3 flex-wrap">
        {[
          { key: 'aktif', label: `Aktif (${aktif.length})` },
          { key: 'selesai', label: `Selesai (${selesai.length})` },
          { key: 'semua', label: `Semua (${pesanan.length})` },
        ].map((t) => (
          <button
            key={t.key}
            type="button"
            className={`btn btn-sm ${tab === t.key ? 'btn-brand' : 'btn-outline-secondary'}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {msg && <div className="alert alert-success py-2">{msg}</div>}
      {(error || err) && <div className="alert alert-danger py-2">{error || err}</div>}

      {loading ? (
        <p className="text-muted">Memuat transaksi...</p>
      ) : list.length === 0 ? (
        <div className="panel empty-state">
          <p className="mb-3">Belum ada transaksi{tab === 'aktif' ? ' aktif' : ''}.</p>
          <Link to="/toko" className="btn btn-brand btn-sm">
            Mulai belanja
          </Link>
        </div>
      ) : (
        <div className="d-flex flex-column gap-3">
          {tab === 'aktif' && belumBayarList.length > 0 && (
            <label className="d-flex align-items-center gap-2 small text-muted mb-0">
              <input
                type="checkbox"
                checked={selected.size === belumBayarList.length && belumBayarList.length > 0}
                onChange={toggleSelectAllBelumBayar}
              />
              Pilih semua yang belum dibayar
            </label>
          )}

          {list.map((p) => {
            const isSelesai = String(p.status).toLowerCase() === 'selesai';
            const isBatal = String(p.status).toLowerCase() === 'dibatalkan';
            const belumBayar = String(p.pembayaran || '').toLowerCase().includes('belum');
            const img = p.gambar || p.produk_gambar;
            const canSelect = !isSelesai && !isBatal && belumBayar;

            return (
              <div className="panel" key={p.id}>
                <div className="d-flex gap-3 flex-wrap">
                  {canSelect && (
                    <div className="pt-2">
                      <input
                        type="checkbox"
                        checked={selected.has(p.id)}
                        onChange={() => toggleSelect(p.id)}
                        aria-label={`Pilih pesanan ${p.id}`}
                      />
                    </div>
                  )}
                  <SafeImg
                    src={img}
                    alt={p.nama_produk || 'Produk'}
                    className="rounded"
                    style={{ width: 88, height: 88, objectFit: 'cover', background: '#f0f0f0' }}
                  />
                  <div className="flex-grow-1 min-w-0">
                    <div className="d-flex justify-content-between gap-2 flex-wrap">
                      <div>
                        <div className="fw-bold">{p.nama_produk || `Produk #${p.id_produk}`}</div>
                        <div className="text-muted small">
                          #{p.id} · {formatTanggal(p.created_at)}
                        </div>
                      </div>
                      <div className="text-end">
                        <div className="fw-bold">{formatRupiah(totalOf(p))}</div>
                        <div className="small text-muted">Qty {qtyOf(p)}</div>
                      </div>
                    </div>

                    <div className="d-flex flex-wrap gap-2 mt-2">
                      <span className="badge-soft info">{p.status || '-'}</span>
                      <span className={`badge-soft ${belumBayar ? 'warn' : 'ok'}`}>
                        {labelStatusBayar(p.pembayaran)}
                      </span>
                      <span className="badge-soft muted">{labelMetodeBayar(p.metode_pembayaran)}</span>
                      <span className="badge-soft muted">{labelPengiriman(p.pengiriman)}</span>
                    </div>

                    <div className="row g-1 small text-secondary mt-2">
                      <div className="col-md-6">
                        <b>Penerima:</b> {p.nama_pembeli || '-'}
                      </div>
                      <div className="col-md-6">
                        <b>HP:</b> {p.phone_pembeli || '-'}
                      </div>
                      <div className="col-12">
                        <b>Alamat:</b> {p.alamat_pembeli || '-'}
                      </div>
                      {p.catatan && (
                        <div className="col-12">
                          <b>Catatan:</b> {p.catatan}
                        </div>
                      )}
                    </div>

                    {!isSelesai && !isBatal && (
                      <div className="d-flex flex-wrap gap-2 mt-3">
                        {belumBayar && (
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            disabled={busyId === p.id || busyAll}
                            onClick={() => batalkan(p)}
                          >
                            Batalkan pesanan
                          </button>
                        )}
                        {belumBayar && (
                          <div className="w-100 mt-2">
                            <div className="row g-2 align-items-end">
                              <div className="col-md-4">
                                <label className="form-label small mb-1">Bank tujuan</label>
                                <select
                                  className="form-select form-select-sm"
                                  value={bankSatu[p.id] || BANK_OPTIONS[0].id}
                                  onChange={(e) =>
                                    setBankSatu((prev) => ({ ...prev, [p.id]: e.target.value }))
                                  }
                                >
                                  {BANK_OPTIONS.map((b) => (
                                    <option key={b.id} value={b.id}>
                                      {b.label} — {b.norek} a/n {b.atas_nama}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="col-md-4">
                                <label className="form-label small mb-1">Bukti transfer</label>
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="form-control form-control-sm"
                                  onChange={(e) =>
                                    setBuktiFile((prev) => ({
                                      ...prev,
                                      [p.id]: e.target.files?.[0] || null,
                                    }))
                                  }
                                />
                              </div>
                              <div className="col-md-4 d-flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  className="btn btn-sm btn-brand"
                                  disabled={busyId === p.id || busyAll}
                                  onClick={() => bayarSatu(p.id, 'Bank Transfer')}
                                >
                                  Bayar Transfer
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-brand"
                                  disabled={busyId === p.id || busyAll}
                                  onClick={() => bayarSatu(p.id, 'COD')}
                                >
                                  Bayar COD
                                </button>
                              </div>
                            </div>
                            {p.foto_bukti && (
                              <div className="mt-2 d-flex align-items-center gap-2 flex-wrap">
                                <a
                                  href={mediaUrl(p.foto_bukti)}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="d-inline-block"
                                  title="Lihat bukti pembayaran"
                                >
                                  <img
                                    src={mediaUrl(p.foto_bukti)}
                                    alt="Bukti pembayaran"
                                    style={{
                                      width: 72,
                                      height: 72,
                                      objectFit: 'cover',
                                      borderRadius: 8,
                                      border: '1px solid #e5ddd0',
                                    }}
                                  />
                                </a>
                                <div className="small">
                                  <div className="fw-semibold text-success">
                                    <i className="bi bi-receipt me-1" />
                                    Bukti pembayaran
                                  </div>
                                  <a href={mediaUrl(p.foto_bukti)} target="_blank" rel="noreferrer">
                                    Buka / unduh
                                  </a>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                        {!belumBayar && ['Dikirim', 'Dikemas'].includes(p.status) && (
                          <button
                            type="button"
                            className="btn btn-sm btn-brand"
                            disabled={busyId === p.id}
                            onClick={() => konfirmasiDiterima(p.id)}
                          >
                            Tandai diterima
                          </button>
                        )}
                        {p.status === 'Diterima' && (
                          <button
                            type="button"
                            className="btn btn-sm btn-brand"
                            disabled={busyId === p.id}
                            onClick={() => tandaiSelesai(p.id)}
                          >
                            Selesaikan
                          </button>
                        )}
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

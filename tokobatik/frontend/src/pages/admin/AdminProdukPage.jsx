/**
 * [buatan] CRUD produk toko.
 * URL: `/admin/produk` — adminApi produk, modal form, ImageUploadField.
 * Dilengkapi pencarian nama / no. barang / kategori.
 */
import { useState, useEffect, useMemo } from 'react';
import { adminApi } from '../../api';
import { useAdminList } from '../../hooks';
import { useAdminGuard } from '../../hooks';
import { KATEGORI_PRODUK as KATEGORI_FALLBACK } from '../../constants';
import PageHeader from '../../components/admin/PageHeader';
import LoadingBlock from '../../components/admin/LoadingBlock';
import AdminModal from '../../components/admin/AdminModal';
import AdminDetailModal from '../../components/admin/AdminDetailModal';
import AdminRowActions from '../../components/admin/AdminRowActions';
import DetailDl from '../../components/admin/DetailDl';
import ImageUploadField from '../../components/admin/ImageUploadField';
import { formatRupiah } from '../../utils';
import { mediaUrl } from '../../utils';

const empty = { nama_produk: '', deskripsi: '', harga: '', stok: '10', gambar: '', kategori: KATEGORI_FALLBACK[0] };

const PER_PAGE = 5;

function matchProduk(p, term) {
  if (!term) return true;
  const parts = [
    p?.nama_produk,
    p?.deskripsi,
    p?.kategori,
    p?.id_produk,
    p?.harga,
  ];
  const hay = parts
    .filter((v) => v != null && v !== '')
    .map((v) => String(v).toLowerCase())
    .join(' ');
  return term
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((w) => hay.includes(w));
}

export default function AdminProdukPage() {
  const { handleError } = useAdminGuard();
  const { rows, loading, error, reload } = useAdminList(adminApi.getProduk);
  const [modal, setModal] = useState(null); // null | 'create' | { type: 'edit', id }
  const [detail, setDetail] = useState(null); // baris untuk AdminDetailModal
  const [form, setForm] = useState(empty);
  const [kategoriOptions, setKategoriOptions] = useState(typeof KATEGORI_FALLBACK !== 'undefined' ? KATEGORI_FALLBACK : ['Kemeja Batik', 'Dress Batik', 'Kain Batik']); // isi form modal tambah/ubah

  useEffect(() => {
    adminApi.getKategori()
      .then((res) => {
        const list = (res.kategori || []).map((k) => k.nama).filter(Boolean);
        if (list.length) setKategoriOptions(list);
      })
      .catch(() => {});
  }, []);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [page, setPage] = useState(0); // halaman untuk geser (5 produk per halaman)
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    const term = q.trim();
    if (!term) return rows;
    return rows.filter((r) => matchProduk(r, term));
  }, [rows, q]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  useEffect(() => {
    if (page > totalPages - 1) setPage(Math.max(0, totalPages - 1));
  }, [filtered.length, page, totalPages]);

  // Reset ke halaman 1 saat kata kunci berubah
  useEffect(() => {
    setPage(0);
  }, [q]);

  // Buka modal kosong untuk produk baru
  const openCreate = () => {
    setDetail(null);
    setForm(empty);
    setModal('create');
  };

  // Muat detail lengkap lalu tampilkan modal read-only
  const openDetail = async (row) => {
    setModal(null);
    try {
      const r = await adminApi.getProdukById(row.id_produk);
      setDetail(r.data);
    } catch (err) {
      if (!handleError(err)) setFormError(err.message);
    }
  };

  // Muat data ke form lalu buka modal edit
  const openEdit = async (row) => {
    setFormError('');
    setDetail(null);
    try {
      const r = await adminApi.getProdukById(row.id_produk);
      const p = r.data;
      setForm({
        nama_produk: p.nama_produk ?? '',
        deskripsi: p.deskripsi ?? '',
        harga: String(p.harga ?? ''),
        gambar: p.gambar || '',
        kategori: p.kategori ?? KATEGORI_FALLBACK[0],
        stok: p.stok != null ? String(p.stok) : '0',
      });
      setModal({ type: 'edit', id: row.id_produk });
    } catch (err) {
      if (!handleError(err)) setFormError(err.message);
    }
  };

  // POST create atau PUT update → tutup modal → reload tabel
  const onSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    const payload = { ...form, harga: parseInt(form.harga, 10), stok: parseInt(form.stok, 10) || 0, gambar: form.gambar || null };
    try {
      if (modal === 'create') await adminApi.createProduk(payload);
      else await adminApi.updateProduk(modal.id, payload);
      setModal(null);
      reload();
    } catch (err) {
      if (!handleError(err)) setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // DELETE setelah konfirmasi browser
  const onDelete = async (id) => {
    if (!window.confirm('Hapus produk ini?')) return;
    try {
      await adminApi.deleteProduk(id);
      reload();
    } catch (err) {
      if (!handleError(err)) setFormError(err.message);
    }
  };


  if (loading) return <LoadingBlock />;

  const safePage = Math.min(page, totalPages - 1);
  const slice = filtered.slice(safePage * PER_PAGE, safePage * PER_PAGE + PER_PAGE);
  const usePager = filtered.length > PER_PAGE;

  return (
    <div>
      <PageHeader
        title="Daftar produk"
        subtitle={`${filtered.length}${q.trim() ? ` dari ${rows.length}` : ''} produk`}
        action={
          <button type="button" className="btn btn-dark rounded-0" onClick={openCreate}>
            + Produk baru
          </button>
        }
      />
      {(error || formError) && <div className="alert alert-danger">{error || formError}</div>}

      <div className="admin-panel mb-3">
        <div className="px-3 py-3 border-bottom d-flex flex-wrap align-items-center gap-2">
          <div className="input-group" style={{ maxWidth: 360 }}>
            <span className="input-group-text bg-white border-end-0">
              <i className="bi bi-search text-secondary" />
            </span>
            <input
              type="search"
              className="form-control border-start-0"
              placeholder="Cari nama, no. barang, kategori…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              aria-label="Cari produk"
            />
            {q && (
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setQ('')}
                title="Hapus pencarian"
              >
                ×
              </button>
            )}
          </div>
          {q.trim() && (
            <span className="small text-secondary">
              Menampilkan {filtered.length} hasil
            </span>
          )}
        </div>
        <div className={`table-responsive${usePager ? ' admin-table-no-scroll' : ''}`}>
          <table className="table admin-table mb-0">
            <thead>
              <tr>
                <th>Gambar</th>
                <th>Nama</th>
                <th>Kategori</th>
                  <th>Stok</th>
                <th>Harga</th>
                <th className="col-actions">Tindakan</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-secondary">
                    {rows.length === 0
                      ? 'Belum ada produk. Klik "Produk baru" untuk menambah.'
                      : 'Tidak ada produk yang cocok dengan pencarian.'}
                  </td>
                </tr>
              ) : (
                slice.map((row) => (
                  <tr key={row.id_produk}>
                    <td>
                      <img src={mediaUrl(row.gambar)} alt="" width={48} height={48} className="admin-thumb" />
                    </td>
                    <td>
                      <strong>{row.nama_produk}</strong>
                    </td>
                    <td>{row.kategori}</td>
                    <td>{row.stok != null ? row.stok : "—"}</td>
                    <td>{formatRupiah(row.harga)}</td>
                    <td className="col-actions">
                      <AdminRowActions
                        onDetail={() => openDetail(row)}
                        onEdit={() => openEdit(row)}
                        onDelete={() => onDelete(row.id_produk)}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {usePager && (
          <div className="d-flex align-items-center justify-content-between px-3 py-2 border-top">
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              disabled={safePage <= 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              ← Sebelumnya
            </button>
            <span className="small text-secondary">
              {safePage + 1} / {totalPages}
            </span>
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              disabled={safePage >= totalPages - 1}
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            >
              Selanjutnya →
            </button>
          </div>
        )}
      </div>

      <AdminDetailModal
        show={Boolean(detail)}
        title={detail ? `Detail: ${detail.nama_produk}` : ''}
        onClose={() => setDetail(null)}
      >
        {detail && (
          <>
            <img src={mediaUrl(detail.gambar)} alt="" className="admin-detail-img" />
            <DetailDl
              items={[
                ['Nama', detail.nama_produk],
                ['Kategori', detail.kategori],
                ['Harga', formatRupiah(detail.harga)],
                ['Deskripsi', detail.deskripsi],
              ]}
            />
          </>
        )}
      </AdminDetailModal>

      <AdminModal show={Boolean(modal)} title={modal === 'create' ? 'Tambah produk' : 'Ubah produk'} onClose={() => setModal(null)} wide>
        <form onSubmit={onSave}>
          <div className="mb-3">
            <label className="form-label">Nama produk</label>
            <input className="form-control" value={form.nama_produk} onChange={(e) => setForm({ ...form, nama_produk: e.target.value })} required />
          </div>
          <div className="mb-3">
            <label className="form-label">Deskripsi</label>
            <textarea className="form-control" rows={3} value={form.deskripsi} onChange={(e) => setForm({ ...form, deskripsi: e.target.value })} required />
          </div>
          <div className="row g-3 mb-3">
            <div className="col-md-4">
              <label className="form-label">Harga (Rp)</label>
              <input type="number" min={0} className="form-control" value={form.harga} onChange={(e) => setForm({ ...form, harga: e.target.value })} required />
            </div>
            <div className="col-md-4">
              <label className="form-label">Stok</label>
              <input type="number" min={0} className="form-control" value={form.stok} onChange={(e) => setForm({ ...form, stok: e.target.value })} required />
            </div>
            <div className="col-md-4">
              <label className="form-label">Kategori</label>
              <select className="form-select" value={form.kategori} onChange={(e) => setForm({ ...form, kategori: e.target.value })}>
                {(kategoriOptions || KATEGORI_FALLBACK).map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <ImageUploadField
            label="Gambar"
            value={form.gambar}
            onChange={(v) => setForm({ ...form, gambar: v })}
            clearable
          />
          <button type="submit" className="btn btn-dark rounded-0 w-100 mt-2" disabled={saving}>
            {saving ? 'Menyimpan…' : 'Simpan'}
          </button>
        </form>
      </AdminModal>
    </div>
  );
}

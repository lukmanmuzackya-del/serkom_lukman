import { useEffect, useState } from 'react';
import { adminApi, asList } from '../../api';
import { useAdminGuard } from '../../hooks';
import LoadingBlock from '../../components/admin/LoadingBlock';
import AdminModal from '../../components/admin/AdminModal';

export default function AdminKategoriPage() {
  const { handleError } = useAdminGuard();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [modal, setModal] = useState(null); // null | 'create' | { type:'edit', id }
  const [form, setForm] = useState({ nama: '', deskripsi: '' });
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const res = await adminApi.getKategori();
      setRows(asList(res) || res.kategori || []);
    } catch (e) {
      if (!handleError(e)) setError(e.message || 'Gagal memuat kategori');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openCreate() {
    setForm({ nama: '', deskripsi: '' });
    setModal('create');
  }

  function openEdit(row) {
    setForm({ nama: row.nama || '', deskripsi: row.deskripsi || '' });
    setModal({ type: 'edit', id: row.id });
  }

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setMsg('');
    setError('');
    try {
      const nama = form.nama.trim();
      if (nama.length < 2) throw new Error('Nama kategori minimal 2 karakter');
      if (modal === 'create') {
        await adminApi.createKategori({ nama, deskripsi: form.deskripsi });
        setMsg('Kategori ditambahkan');
      } else {
        await adminApi.updateKategori(modal.id, { nama, deskripsi: form.deskripsi });
        setMsg('Kategori diperbarui');
      }
      setModal(null);
      await load();
    } catch (err) {
      if (!handleError(err)) setError(err.message || 'Gagal menyimpan');
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(row) {
    if (!window.confirm(`Hapus kategori "${row.nama}"?`)) return;
    setError('');
    try {
      await adminApi.deleteKategori(row.id);
      setMsg('Kategori dihapus');
      await load();
    } catch (err) {
      if (!handleError(err)) setError(err.message || 'Gagal menghapus');
    }
  }

  if (loading) return <LoadingBlock />;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <p className="text-secondary mb-0">Kelola kategori produk (CRUD).</p>
        <button type="button" className="btn btn-brand btn-sm" onClick={openCreate}>
          + Tambah kategori
        </button>
      </div>
      {msg && <div className="alert alert-success py-2">{msg}</div>}
      {error && <div className="alert alert-danger py-2">{error}</div>}

      <div className="admin-panel">
        <table className="table table-hover mb-0 align-middle">
          <thead>
            <tr>
              <th>Nama</th>
              <th>Deskripsi</th>
              <th style={{ width: 140 }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="fw-semibold">{r.nama}</td>
                <td className="text-muted small">{r.deskripsi || '—'}</td>
                <td>
                  <div className="admin-row-actions d-flex align-items-center gap-1">
                    <button
                      type="button"
                      className="btn-icon btn-icon--edit"
                      onClick={() => openEdit(r)}
                      title="Ubah"
                      aria-label="Ubah"
                    >
                      <i className="bi bi-pencil-square" />
                    </button>
                    <button
                      type="button"
                      className="btn-icon btn-icon--danger"
                      onClick={() => onDelete(r)}
                      title="Hapus"
                      aria-label="Hapus"
                    >
                      <i className="bi bi-trash3" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={3} className="text-center text-muted py-4">
                  Belum ada kategori. Tambahkan atau jalankan migration-kategori-laporan.sql
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <AdminModal
        show={Boolean(modal)}
        title={modal === 'create' ? 'Tambah kategori' : 'Ubah kategori'}
        onClose={() => setModal(null)}
      >
        <form onSubmit={onSubmit}>
          <div className="mb-3">
            <label className="form-label fw-semibold">Nama kategori</label>
            <input
              className="form-control"
              value={form.nama}
              onChange={(e) => setForm({ ...form, nama: e.target.value })}
              required
              minLength={2}
              placeholder="Contoh: Selendang Batik"
            />
          </div>
          <div className="mb-3">
            <label className="form-label fw-semibold">Deskripsi</label>
            <textarea
              className="form-control"
              rows={3}
              value={form.deskripsi}
              onChange={(e) => setForm({ ...form, deskripsi: e.target.value })}
              placeholder="Opsional"
            />
          </div>
          <div className="d-flex justify-content-end gap-2">
            <button type="button" className="btn btn-outline-secondary" onClick={() => setModal(null)}>
              Batal
            </button>
            <button type="submit" className="btn btn-brand" disabled={busy}>
              {busy ? 'Menyimpan…' : 'Simpan'}
            </button>
          </div>
        </form>
      </AdminModal>
    </div>
  );
}

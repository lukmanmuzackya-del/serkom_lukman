/**
 * Profil admin — data pribadi + foto.
 */
import { useEffect, useState } from 'react';
import { adminApi } from '../../api';
import { useAdminGuard } from '../../hooks';
import { useAuth } from '../../context/AuthContext';
import LoadingBlock from '../../components/admin/LoadingBlock';
import ImageUploadField from '../../components/admin/ImageUploadField';
import { KELAMIN } from '../../constants';
import { normalizeKelamin, toDateInputValue, mediaUrl } from '../../utils';

function pickProfile(payload, fallbackUser) {
  const r = payload || {};
  // apiRequest → { data, raw }
  let p =
    r.data && (r.data.nama_d || r.data.uname)
      ? r.data
      : r.data?.user ||
        r.data?.admin ||
        r.raw?.user ||
        r.raw?.admin ||
        r.user ||
        r.admin ||
        null;

  if (!p || (!p.nama_d && !p.uname && !p.email)) {
    p = fallbackUser || {};
  }

  return {
    nama_d: p.nama_d || '',
    nama_b: p.nama_b || '',
    kelamin: normalizeKelamin(p.kelamin) || KELAMIN[0],
    lahir: toDateInputValue(p.lahir) || '',
    alamat: p.alamat || '',
    phone: String(p.phone ?? ''),
    email: p.email || '',
    uname: p.uname || '',
    foto: p.foto || p.gambar || '',
  };
}

export default function AdminProfilPage() {
  const { handleError } = useAdminGuard();
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState(() => pickProfile(null, user));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);
  const [passwdLama, setPasswdLama] = useState('');
  const [passwdBaru, setPasswdBaru] = useState('');
  const [passwdBaru2, setPasswdBaru2] = useState('');

  useEffect(() => {
    let alive = true;
    setLoading(true);
    adminApi
      .getMe()
      .then((r) => {
        if (!alive) return;
        setForm(pickProfile(r, user));
        setError('');
      })
      .catch((err) => {
        if (!alive) return;
        // tetap tampilkan form dari sesi login
        setForm(pickProfile(null, user));
        if (!handleError(err)) {
          setError(err.message || 'Gagal memuat profil dari server. Menampilkan data sesi.');
        }
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [handleError, user]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  function applyFoto(path) {
    setForm((f) => ({ ...f, foto: path || '' }));
    setSuccess('');
    setError('');
  }

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      if (!form.nama_d?.trim()) throw new Error('Nama depan wajib diisi');
      if (!form.alamat?.trim()) throw new Error('Alamat wajib diisi');

      const payload = {
        nama_d: form.nama_d.trim(),
        nama_b: form.nama_b?.trim() || '',
        kelamin: form.kelamin,
        lahir: form.lahir || undefined,
        alamat: form.alamat.trim(),
        phone: parseInt(String(form.phone).replace(/\D/g, ''), 10) || form.phone,
        email: form.email || undefined,
        uname: form.uname || undefined,
        foto: form.foto || null,
      };
      if (passwdBaru) {
        if (passwdBaru.length < 6) throw new Error('Password baru minimal 6 karakter');
        if (passwdBaru !== passwdBaru2) throw new Error('Konfirmasi password baru tidak cocok');
        if (!passwdLama) throw new Error('Password lama wajib diisi');
        payload.passwd_lama = passwdLama;
        payload.passwd_baru = passwdBaru;
      }
      const res = await adminApi.putMe(payload);
      const updated = pickProfile(res, { ...user, ...form });
      setForm(updated);
      updateUser({
        nama_d: updated.nama_d,
        nama_b: updated.nama_b,
        foto: updated.foto,
        email: updated.email,
        uname: updated.uname,
      });
      setSuccess(passwdBaru ? 'Profil & password berhasil diperbarui.' : 'Profil berhasil diperbarui.');
      setPasswdLama('');
      setPasswdBaru('');
      setPasswdBaru2('');
    } catch (err) {
      if (!handleError(err)) setError(err.message || 'Gagal menyimpan profil');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingBlock text="Memuat profil…" />;

  const fullName = [form.nama_d, form.nama_b].filter(Boolean).join(' ') || 'Admin';

  return (
    <div>
      <p className="text-secondary mb-3">Kelola data akun admin Batik Nusantara.</p>
      {error && <div className="alert alert-warning py-2">{error}</div>}
      {success && <div className="alert alert-success py-2">{success}</div>}

      <div className="row g-4">
        <div className="col-lg-4">
          <div className="admin-panel p-4 text-center h-100">
            <div className="mb-3 d-inline-block position-relative">
              <img
                src={mediaUrl(form.foto)}
                alt="Foto profil"
                width={120}
                height={120}
                className="rounded-circle border"
                style={{ objectFit: 'cover', background: '#eee' }}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src =
                    'data:image/svg+xml,' +
                    encodeURIComponent(
                      `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect fill="#eee" width="120" height="120"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#999" font-size="36">${(fullName || 'A').charAt(0)}</text></svg>`
                    );
                }}
              />
            </div>
            <h2 className="h5 fw-bold mb-1">{fullName}</h2>
            <p className="text-secondary small mb-3">Admin · {form.uname || '—'}</p>
            <ImageUploadField
              label="Ganti foto profil"
              value={form.foto}
              onChange={applyFoto}
              clearable
            />
            <p className="form-text small mt-2 mb-0">Klik Simpan profil untuk menyimpan foto.</p>
          </div>
        </div>

        <div className="col-lg-8">
          <form onSubmit={onSubmit} className="admin-panel p-4">
            <h3
              className="h6 fw-semibold text-uppercase text-secondary mb-3"
              style={{ letterSpacing: '0.04em' }}
            >
              Data pribadi
            </h3>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Nama depan</label>
                <input
                  className="form-control"
                  value={form.nama_d}
                  onChange={set('nama_d')}
                  required
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Nama belakang</label>
                <input className="form-control" value={form.nama_b} onChange={set('nama_b')} />
              </div>
              <div className="col-md-6">
                <label className="form-label">Jenis kelamin</label>
                <select className="form-select" value={form.kelamin} onChange={set('kelamin')}>
                  {KELAMIN.map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label">Tanggal lahir</label>
                <input
                  type="date"
                  className="form-control"
                  value={form.lahir}
                  onChange={set('lahir')}
                />
              </div>
              <div className="col-12">
                <label className="form-label">Alamat</label>
                <textarea
                  className="form-control"
                  rows={2}
                  value={form.alamat}
                  onChange={set('alamat')}
                  required
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Telepon</label>
                <input className="form-control" value={form.phone} onChange={set('phone')} required />
              </div>
              <div className="col-md-6">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-control"
                  value={form.email}
                  onChange={set('email')}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Username</label>
                <input className="form-control" value={form.uname} onChange={set('uname')} />
              </div>
            </div>

            <h3
              className="h6 fw-semibold text-uppercase text-secondary mb-3 mt-4 pt-3 border-top"
              style={{ letterSpacing: '0.04em' }}
            >
              Ganti password
            </h3>
            <p className="small text-muted mb-3">Kosongkan jika tidak ingin mengubah password.</p>
            <div className="row g-3">
              <div className="col-md-4">
                <label className="form-label">Password lama</label>
                <input
                  type="password"
                  className="form-control"
                  value={passwdLama}
                  onChange={(e) => setPasswdLama(e.target.value)}
                  autoComplete="current-password"
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">Password baru</label>
                <input
                  type="password"
                  className="form-control"
                  value={passwdBaru}
                  onChange={(e) => setPasswdBaru(e.target.value)}
                  autoComplete="new-password"
                  minLength={6}
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">Konfirmasi password baru</label>
                <input
                  type="password"
                  className="form-control"
                  value={passwdBaru2}
                  onChange={(e) => setPasswdBaru2(e.target.value)}
                  autoComplete="new-password"
                  minLength={6}
                />
              </div>
            </div>

            <div className="d-flex justify-content-end mt-4 pt-3 border-top">
              <button type="submit" className="btn btn-brand px-4" disabled={saving}>
                {saving ? 'Menyimpan…' : 'Simpan profil'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

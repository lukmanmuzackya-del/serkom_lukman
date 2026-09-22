// Profil pembeli — data + foto + ganti password (opsional)
import { useEffect, useState } from 'react';
import { pembeliApi } from '../../api';
import { usePembeliGuard } from '../../hooks';
import { useAuth } from '../../context/AuthContext';
import { KELAMIN } from '../../constants';
import SafeImg from '../../components/SafeImg';
import ImageUploadField from '../../components/admin/ImageUploadField';
import LoadingBlock from '../../components/admin/LoadingBlock';
import ProfilePasswordFields from '../../components/profile/ProfilePasswordFields';
import { toDateInputValue } from '../../utils';

export default function PembeliProfilPage() {
  const { handleError } = usePembeliGuard();
  const { updateUser } = useAuth();
  const [form, setForm] = useState(null);
  const [passwd, setPasswd] = useState({
    passwd_lama: '',
    passwd_baru: '',
    passwd_baru_konfirmasi: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let alive = true;
    pembeliApi
      .getMe()
      .then((res) => {
        if (!alive) return;
        const p = res.data || {};
        setForm({
          nama_d: p.nama_d || '',
          nama_b: p.nama_b || '',
          kelamin: p.kelamin || KELAMIN[0],
          phone: String(p.phone ?? ''),
          alamat: p.alamat || '',
          email: p.email || '',
          uname: p.uname || '',
          foto: p.foto || p.gambar || '',
          lahir: toDateInputValue(p.lahir),
        });
      })
      .catch((err) => {
        if (!alive) return;
        if (!handleError(err)) setError(err.message || 'Gagal memuat profil');
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [handleError]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handlePasswdChange(key, value) {
    setPasswd((p) => ({ ...p, [key]: value }));
  }

  function applyFoto(path) {
    setForm((f) => ({ ...f, foto: path || '' }));
    setSuccess('');
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (passwd.passwd_baru) {
      if (passwd.passwd_baru.length < 6) {
        setError('Kata sandi baru minimal 6 karakter.');
        return;
      }
      if (passwd.passwd_baru !== passwd.passwd_baru_konfirmasi) {
        setError('Konfirmasi kata sandi baru tidak cocok.');
        return;
      }
      if (!passwd.passwd_lama) {
        setError('Kata sandi lama wajib diisi untuk ganti password.');
        return;
      }
    }

    setSaving(true);
    try {
      const payload = {
        nama_d: form.nama_d,
        nama_b: form.nama_b,
        kelamin: form.kelamin,
        phone: form.phone,
        alamat: form.alamat,
        email: form.email,
        uname: form.uname,
        foto: form.foto || null,
      };
      if (form.lahir) payload.lahir = form.lahir;
      if (passwd.passwd_baru) {
        payload.passwd_lama = passwd.passwd_lama;
        payload.passwd_baru = passwd.passwd_baru;
      }
      await pembeliApi.putMe(payload);
      updateUser({
        nama_d: form.nama_d,
        nama_b: form.nama_b,
        foto: form.foto,
      });
      setSuccess('Profil berhasil diperbarui');
      setPasswd({ passwd_lama: '', passwd_baru: '', passwd_baru_konfirmasi: '' });
    } catch (err) {
      if (!handleError(err)) setError(err.message || 'Gagal memperbarui profil');
    } finally {
      setSaving(false);
    }
  }

  if (loading || !form) return <LoadingBlock text="Memuat profil…" />;

  const fullName = [form.nama_d, form.nama_b].filter(Boolean).join(' ') || 'Pembeli';

  return (
    <div>
      <div className="mb-4">
        <h1 className="h4 fw-bold mb-1">Profil Saya</h1>
        <p className="text-secondary mb-0">Ubah data akun, foto profil, dan kata sandi.</p>
      </div>

      {error && <div className="alert alert-danger py-2">{error}</div>}
      {success && <div className="alert alert-success py-2">{success}</div>}

      <div className="row g-4">
        {/* Kartu foto */}
        <div className="col-lg-4">
          <div className="admin-panel p-4 text-center h-100">
            <div className="mb-3 d-inline-block">
              <SafeImg
                src={form.foto}
                alt={fullName}
                style={{ width: 120, height: 120, borderRadius: '50%', objectFit: 'cover' }}
              />
            </div>
            <h2 className="h5 fw-bold mb-1">{fullName}</h2>
            <p className="text-secondary small mb-3">{form.email || form.uname || '—'}</p>
            <ImageUploadField
              label="Ganti foto profil"
              value={form.foto}
              onChange={applyFoto}
              clearable
              uploadFn={pembeliApi.uploadGambar}
            />
            <p className="form-text small mt-2 mb-0">
              Simpan perubahan di form untuk menerapkan foto baru.
            </p>
          </div>
        </div>

        {/* Form data */}
        <div className="col-lg-8">
          <form onSubmit={handleSubmit} className="admin-panel p-4">
            <h3 className="h6 fw-semibold text-uppercase text-secondary mb-3" style={{ letterSpacing: '0.04em' }}>
              Data pribadi
            </h3>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label small fw-semibold">Nama Depan</label>
                <input name="nama_d" className="form-control" value={form.nama_d} onChange={handleChange} required />
              </div>
              <div className="col-md-6">
                <label className="form-label small fw-semibold">Nama Belakang</label>
                <input name="nama_b" className="form-control" value={form.nama_b} onChange={handleChange} required />
              </div>
              <div className="col-md-4">
                <label className="form-label small fw-semibold">Kelamin</label>
                <select name="kelamin" className="form-select" value={form.kelamin} onChange={handleChange}>
                  {KELAMIN.map((k) => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label small fw-semibold">Tanggal lahir</label>
                <input type="date" name="lahir" className="form-control" value={form.lahir} onChange={handleChange} />
              </div>
              <div className="col-md-4">
                <label className="form-label small fw-semibold">No. HP</label>
                <input name="phone" className="form-control" value={form.phone} onChange={handleChange} required />
              </div>
              <div className="col-12">
                <label className="form-label small fw-semibold">Alamat</label>
                <textarea name="alamat" className="form-control" rows="2" value={form.alamat} onChange={handleChange} required />
              </div>
              <div className="col-md-6">
                <label className="form-label small fw-semibold">Email</label>
                <input type="email" name="email" className="form-control" value={form.email} onChange={handleChange} required />
              </div>
              <div className="col-md-6">
                <label className="form-label small fw-semibold">Username</label>
                <input name="uname" className="form-control" value={form.uname} onChange={handleChange} required />
              </div>
            </div>

            <ProfilePasswordFields values={passwd} onChange={handlePasswdChange} />

            <div className="d-flex justify-content-end mt-4 pt-3 border-top">
              <button type="submit" disabled={saving} className="btn btn-brand px-4">
                {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

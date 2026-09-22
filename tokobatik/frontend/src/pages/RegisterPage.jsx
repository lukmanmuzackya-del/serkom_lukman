import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SITE, KELAMIN } from '../constants';
import { api } from '../api';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    nama_d: '',
    nama_b: '',
    email: '',
    uname: '',
    phone: '',
    kelamin: 'Laki-laki',
    lahir: '',
    alamat: '-',
    passwd: '',
    passwd2: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (form.passwd.length < 6) {
      setError('Kata sandi minimal 6 karakter');
      return;
    }
    if (form.passwd !== form.passwd2) {
      setError('Konfirmasi kata sandi tidak cocok');
      return;
    }
    setLoading(true);
    try {
      const uname = form.uname || form.email.split('@')[0];
      await api.register({
        nama_d: form.nama_d,
        nama_b: form.nama_b || '-',
        kelamin: form.kelamin,
        lahir: form.lahir || '2000-01-01',
        alamat: form.alamat || '-',
        phone: form.phone || '000',
        email: form.email,
        uname,
        passwd: form.passwd,
        role: 'pembeli',
      });
      navigate('/login', { replace: true });
    } catch (err) {
      setError(err.message || 'Registrasi gagal');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page auth-page--compact">
      <div className="auth-brand-panel">
        <div className="auth-brand-inner">
          <Link to="/" className="auth-brand-logo-link text-decoration-none">
            {SITE.logo_auth_white || SITE.logo_auth || SITE.logo ? (
              <img
                src={SITE.logo_auth_white || SITE.logo_auth || SITE.logo}
                alt={SITE.nama_toko}
                className="auth-brand-logo"
              />
            ) : (
              <span className="fw-bold text-white" style={{ fontSize: '1.25rem' }}>
                {SITE.nama_toko}
              </span>
            )}
          </Link>
          <p className="auth-brand-tagline">{SITE.tagline}</p>
          <h2 className="auth-brand-title">Bergabung dengan komunitas pecinta batik lokal.</h2>
          <p className="auth-brand-desc">
            Daftar gratis, akses koleksi batik tulis, kemeja, dan kain batik.
          </p>
          <div className="auth-brand-badges">
            <span>Gratis daftar</span>
            <span>Order mudah</span>
            <span>Kirim cepat</span>
          </div>
        </div>
      </div>

      <div className="auth-form-panel">
        <div className="auth-form-card">
          <div className="auth-form-header">
            <h1 className="auth-form-title">Buat akun</h1>
            <p className="auth-form-subtitle">Isi data singkat di bawah</p>
          </div>

          {error && (
            <div className="auth-alert" role="alert">
              <i className="bi bi-exclamation-circle me-2" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form auth-form--dense">
            <div className="row g-2">
              <div className="col-6">
                <div className="auth-field">
                  <label htmlFor="nama_d">Nama depan</label>
                  <input
                    id="nama_d"
                    name="nama_d"
                    className="auth-input auth-input--plain"
                    placeholder="Nama"
                    value={form.nama_d}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              <div className="col-6">
                <div className="auth-field">
                  <label htmlFor="nama_b">Nama belakang</label>
                  <input
                    id="nama_b"
                    name="nama_b"
                    className="auth-input auth-input--plain"
                    placeholder="Opsional"
                    value={form.nama_b}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="col-6">
                <div className="auth-field">
                  <label htmlFor="email">Email</label>
                  <input
                    id="email"
                    type="email"
                    name="email"
                    className="auth-input auth-input--plain"
                    placeholder="nama@email.com"
                    value={form.email}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              <div className="col-6">
                <div className="auth-field">
                  <label htmlFor="uname">Username</label>
                  <input
                    id="uname"
                    name="uname"
                    className="auth-input auth-input--plain"
                    placeholder="username"
                    value={form.uname}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="col-6">
                <div className="auth-field">
                  <label htmlFor="phone">No. WhatsApp</label>
                  <input
                    id="phone"
                    name="phone"
                    className="auth-input auth-input--plain"
                    placeholder="08xxxxxxxxxx"
                    value={form.phone}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="col-6">
                <div className="auth-field">
                  <label htmlFor="kelamin">Jenis kelamin</label>
                  <select
                    id="kelamin"
                    name="kelamin"
                    className="auth-input auth-input--plain"
                    value={form.kelamin}
                    onChange={handleChange}
                  >
                    {KELAMIN.map((k) => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="col-6">
                <div className="auth-field">
                  <label htmlFor="lahir">Tanggal lahir</label>
                  <input
                    id="lahir"
                    type="date"
                    name="lahir"
                    className="auth-input auth-input--plain"
                    value={form.lahir}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="col-6">
                <div className="auth-field">
                  <label htmlFor="passwd">Kata sandi</label>
                  <div className="auth-input-wrap">
                    <input
                      id="passwd"
                      type={showPass ? 'text' : 'password'}
                      name="passwd"
                      className="auth-input auth-input--plain"
                      style={{ paddingRight: '2.25rem' }}
                      placeholder="Min. 6 karakter"
                      value={form.passwd}
                      onChange={handleChange}
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      className="auth-pass-toggle"
                      onClick={() => setShowPass((v) => !v)}
                      tabIndex={-1}
                      aria-label="Tampilkan sandi"
                    >
                      <i className={`bi ${showPass ? 'bi-eye-slash' : 'bi-eye'}`} />
                    </button>
                  </div>
                </div>
              </div>
              <div className="col-12">
                <div className="auth-field">
                  <label htmlFor="passwd2">Konfirmasi kata sandi</label>
                  <input
                    id="passwd2"
                    type={showPass ? 'text' : 'password'}
                    name="passwd2"
                    className="auth-input auth-input--plain"
                    placeholder="Ulangi kata sandi"
                    value={form.passwd2}
                    onChange={handleChange}
                    required
                    minLength={6}
                  />
                </div>
              </div>
            </div>

            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? (
                <>
                  <span className="auth-spinner" /> Mendaftar...
                </>
              ) : (
                <>
                  Daftar <i className="bi bi-arrow-right ms-1" />
                </>
              )}
            </button>
          </form>

          <div className="auth-form-footer auth-form-footer--tight">
            <p>
              Sudah punya akun? <Link to="/login">Masuk</Link>
            </p>
            <Link to="/" className="auth-back-link">
              <i className="bi bi-arrow-left me-1" /> Beranda
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

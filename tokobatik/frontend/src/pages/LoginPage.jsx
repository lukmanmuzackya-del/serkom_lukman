import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { SITE } from '../constants';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [form, setForm] = useState({ credential: '', passwd: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const from = location.state?.from || '';

  function onChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const user = await login(form.credential, form.passwd);

      if (user?.role === 'admin') {
        try { sessionStorage.setItem('admin_welcome', '1'); } catch (_) {}
        navigate('/admin');
        return;
      }

      if (
        from &&
        from !== '/login' &&
        from !== '/register' &&
        !from.startsWith('/admin') &&
        !from.startsWith('/akun')
      ) {
        navigate(from);
        return;
      }

      navigate('/akun');
    } catch (err) {
      setError(err.message || 'Login gagal');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-page">
      {/* Panel kiri — brand */}
      <div className="auth-brand-panel">
        <div className="auth-brand-inner">
          <Link to="/" className="auth-brand-logo-link text-decoration-none">
            {(SITE.logo_auth_white || SITE.logo_auth || SITE.logo) ? (
              <img
                src={SITE.logo_auth_white || SITE.logo_auth || SITE.logo}
                alt={SITE.nama_toko}
                className="auth-brand-logo"
              />
            ) : (
              <span className="fw-bold text-white" style={{ fontSize: '1.35rem' }}>{SITE.nama_toko}</span>
            )}
          </Link>
          <p className="auth-brand-tagline">{SITE.tagline}</p>
          <h2 className="auth-brand-title">
            Warisan batik asli untuk gaya elegan.
          </h2>
          <p className="auth-brand-desc">
            Koleksi batik tulis &amp; batik cap — elegan, bermakna, siap dipakai setiap hari.
          </p>
          <div className="auth-brand-badges">
            <span>Kemeja Batik</span>
            <span>Dress Batik</span>
            <span>Kain Batik</span>
          </div>
        </div>
        <div className="auth-brand-footer">
          <span>© {new Date().getFullYear()} {SITE.nama_toko}</span>
        </div>
      </div>

      {/* Panel kanan — form */}
      <div className="auth-form-panel">
        <div className="auth-form-card">
          <div className="auth-form-header">
            {(SITE.logo_auth || SITE.logo) ? (
              <img
                src={SITE.logo_auth || SITE.logo}
                alt={SITE.nama_toko}
                className="auth-form-logo d-lg-none"
              />
            ) : (
              <div className="fw-bold text-brand d-lg-none mb-2" style={{ fontSize: '1.2rem' }}>{SITE.nama_toko}</div>
            )}
            <h1 className="auth-form-title">Masuk</h1>
            <p className="auth-form-subtitle">
              {from
                ? 'Masuk dulu untuk melanjutkan belanja'
                : `Selamat datang kembali di ${SITE.nama_toko}`}
            </p>
          </div>

          {error && (
            <div className="auth-alert" role="alert">
              <i className="bi bi-exclamation-circle me-2" />
              {error}
            </div>
          )}

          <form onSubmit={onSubmit} className="auth-form">
            <div className="auth-field">
              <label htmlFor="credential">Username / Email</label>
              <div className="auth-input-wrap">
                <i className="bi bi-person auth-input-icon" />
                <input
                  id="credential"
                  className="auth-input"
                  name="credential"
                  value={form.credential}
                  onChange={onChange}
                  required
                  autoComplete="username"
                  placeholder="username atau email"
                />
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="passwd">Password</label>
              <div className="auth-input-wrap">
                <i className="bi bi-lock auth-input-icon" />
                <input
                  id="passwd"
                  type={showPass ? 'text' : 'password'}
                  className="auth-input"
                  name="passwd"
                  value={form.passwd}
                  onChange={onChange}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="auth-pass-toggle"
                  onClick={() => setShowPass((v) => !v)}
                  tabIndex={-1}
                  aria-label={showPass ? 'Sembunyikan password' : 'Tampilkan password'}
                >
                  <i className={`bi ${showPass ? 'bi-eye-slash' : 'bi-eye'}`} />
                </button>
              </div>
            </div>

            <button type="submit" className="auth-submit" disabled={busy}>
              {busy ? (
                <>
                  <span className="auth-spinner" /> Memproses...
                </>
              ) : (
                <>
                  Masuk <i className="bi bi-arrow-right ms-1" />
                </>
              )}
            </button>
          </form>

          <div className="auth-form-footer">
            <p>
              Belum punya akun? <Link to="/register">Daftar sekarang</Link>
            </p>
            <Link to="/" className="auth-back-link">
              <i className="bi bi-arrow-left me-1" /> Kembali ke beranda
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

import { NavLink, useNavigate, Link } from 'react-router-dom';
import { SITE, PUBLIC_NAV } from '../../constants';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

export default function Header() {
  const { user, logout, isLoggedIn } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/');
  }

  const dashPath = user?.role === 'admin' ? '/admin' : '/akun';

  return (
    <nav className="navbar navbar-expand-lg site-header py-2">
      <div className="container">
        <Link to="/" className="navbar-brand d-flex align-items-center gap-2 mb-0">
          {SITE.logo ? (
            <img
              src={SITE.logo}
              alt=""
              className="brand-logo-icon"
              onError={(e) => {
                e.target.onerror = null;
                e.target.style.display = 'none';
              }}
            />
          ) : null}
          <div className="brand-text lh-sm">
            <div className="brand-name">{SITE.nama_toko}</div>
            <div className="brand-tagline">{SITE.tagline}</div>
          </div>
        </Link>

        <button
          className="navbar-toggler border-0"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#mainNav"
          aria-controls="mainNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon" />
        </button>

        <div className="collapse navbar-collapse" id="mainNav">
          <ul className="navbar-nav mx-auto gap-1">
            {PUBLIC_NAV.map((n) => (
              <li className="nav-item" key={n.to}>
                <NavLink to={n.to} end={n.end} className="nav-link">
                  {n.label}
                </NavLink>
              </li>
            ))}
          </ul>

          <div className="d-flex align-items-center gap-2">
            <Link
              to={isLoggedIn ? '/akun/keranjang' : '/login'}
              state={isLoggedIn ? undefined : { from: '/akun/keranjang' }}
              className="cart-btn"
              title="Keranjang"
            >
              <i className="bi bi-bag" />
              {count > 0 && <span className="cart-badge">{count > 99 ? '99+' : count}</span>}
            </Link>

            {user ? (
              <>
                {user.role === 'pembeli' && (
                  <Link to="/akun/transaksi" className="btn btn-sm btn-outline-brand">
                    Transaksi
                  </Link>
                )}
                <Link to={dashPath} className="btn btn-sm btn-outline-brand">
                  Dashboard
                </Link>
                <button type="button" className="btn btn-sm btn-brand" onClick={handleLogout}>
                  Keluar
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-sm btn-outline-brand">
                  Masuk
                </Link>
                <Link to="/register" className="btn btn-sm btn-brand">
                  Daftar
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

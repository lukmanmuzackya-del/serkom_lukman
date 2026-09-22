import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { SITE } from '../constants';
import { useAuth } from '../context/AuthContext';
import { mediaUrl } from '../utils';

const ADMIN_NAV = [
  { to: '/admin', label: 'Dashboard', icon: 'bi-grid-1x2', end: true },
  { to: '/admin/produk', label: 'Produk', icon: 'bi-box-seam' },
  { to: '/admin/kategori', label: 'Kategori', icon: 'bi-tags' },
  { to: '/admin/laporan', label: 'Laporan', icon: 'bi-graph-up' },
  { to: '/admin/pembeli', label: 'Pembeli', icon: 'bi-person' },
  { to: '/admin/pembelian', label: 'Pesanan', icon: 'bi-file-text' },
  { to: '/admin/artikel', label: 'Artikel', icon: 'bi-journal-text' },
  { to: '/admin/profil', label: 'Profil Saya', icon: 'bi-person-circle' },
];

const PAGE_TITLES = {
  '/admin': 'Dashboard',
  '/admin/produk': 'Kelola Produk',
  '/admin/kategori': 'Kelola Kategori',
  '/admin/laporan': 'Laporan Penjualan',
  '/admin/pembeli': 'Kelola Pembeli',
  '/admin/pembelian': 'Kelola Pesanan',
  '/admin/artikel': 'Kelola Artikel',
  '/admin/profil': 'Profil Saya',
};

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const title = PAGE_TITLES[location.pathname] || 'Panel Admin';
  const fullName = [user?.nama_d, user?.nama_b].filter(Boolean).join(' ') || 'Admin';

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar d-flex flex-column">
        <div className="d-flex align-items-center gap-2 mb-4 px-2 pt-2">
          {user?.foto && user.foto !== 'default.png' && user.foto !== 'default.jpg' ? (
            <img
              src={mediaUrl(user.foto)}
              alt={fullName}
              className="rounded-circle border border-secondary"
              width={40}
              height={40}
              style={{ objectFit: 'cover', flexShrink: 0 }}
              onError={(e) => {
                e.target.onerror = null;
                e.target.style.display = 'none';
              }}
            />
          ) : (
            <div
              className="rounded-circle d-flex align-items-center justify-content-center"
              style={{
                width: 40,
                height: 40,
                flexShrink: 0,
                background: 'rgba(212, 175, 55, 0.25)',
                border: '1px solid rgba(212, 175, 55, 0.5)',
                color: '#f0d78c',
                fontWeight: 700,
                fontSize: 14,
              }}
            >
              {(fullName || 'U').charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <div className="fw-bold fs-6 lh-1 text-white text-truncate">{fullName}</div>
            <div className="text-white-50 small mt-1" style={{ fontSize: 11 }}>
              {SITE.nama_toko} · Admin
            </div>
          </div>
        </div>

        <nav className="nav flex-column gap-1 flex-fill">
          {ADMIN_NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `nav-link rounded px-3 py-2 text-white-50 d-flex align-items-center gap-2 ${
                  isActive ? 'admin-nav-active text-white fw-semibold' : ''
                }`
              }
            >
              <i className={`bi ${item.icon}`} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="pt-3 border-top border-secondary border-opacity-25 mt-auto">
          <NavLink to="/" className="nav-link text-white-50 px-3 py-1 small mb-1">
            Lihat beranda
          </NavLink>
          <button
            type="button"
            onClick={handleLogout}
            className="btn text-warning text-decoration-none px-3 py-1 small text-start border-0"
          >
            Keluar
          </button>
        </div>
      </aside>

      <div className="admin-main d-flex flex-column">
        <header className="admin-topbar px-4 py-3 bg-white d-flex align-items-center border-bottom">
          <h1 className="h5 mb-0 fw-semibold text-dark">{title}</h1>
        </header>
        <main className="p-4 flex-fill admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const menu = [
  { to: '/admin', label: 'Dashboard', icon: '⊞', end: true },
  { to: '/admin/produk', label: 'Produk', icon: '▣' },
  { to: '/admin/pembeli', label: 'Pembeli', icon: '◎' },
  { to: '/admin/pesanan', label: 'Pesanan', icon: '☰' },
  { to: '/admin/artikel', label: 'Artikel', icon: '≡' },
]

const titles = {
  '/admin': 'Dashboard',
  '/admin/produk': 'Kelola Produk',
  '/admin/pembeli': 'Kelola Pembeli',
  '/admin/pesanan': 'Kelola Pesanan',
  '/admin/artikel': 'Kelola Artikel',
}

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const title = titles[location.pathname] || 'Admin'
  const initial = (user?.nama_d || user?.uname || 'A')[0].toUpperCase()

  return (
    <div className="admin-wrap">
      <aside className="admin-sidebar">
        <div className="brand">
          <div className="brand-icon">🚚</div>
          <div className="brand-text">
            <strong>Panel Admin</strong>
            <span>Toko Baru</span>
          </div>
        </div>
        <nav>
          {menu.map(m => (
            <NavLink key={m.to} to={m.to} end={m.end}>
              <span className="icon">{m.icon}</span> {m.label}
            </NavLink>
          ))}
        </nav>
        <div className="bottom">
          <a href="/" onClick={e => { e.preventDefault(); navigate('/') }}>Lihat beranda</a>
          <a href="#logout" className="keluar" onClick={e => { e.preventDefault(); logout(); navigate('/login') }}>Keluar</a>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <h1>{title}</h1>
          <div className="user-info">
            <div className="avatar">{initial}</div>
            <span>{user?.nama_d || user?.uname || 'Admin'} Sistem</span>
          </div>
        </header>
        <div className="admin-body">
          <Outlet />
        </div>
      </div>
    </div>
  )
}

import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="navbar">
      <div className="container">
        <Link to="/" className="logo">Toko Baru</Link>
        <nav>
          <NavLink to="/" end>Beranda</NavLink>
          <NavLink to="/artikel">Artikel</NavLink>
          {user && (
            <NavLink to="/pesanan-saya">Pesanan Saya</NavLink>
          )}
          {isAdmin && (
            <NavLink to="/admin">Admin</NavLink>
          )}
          {user ? (
            <>
              <span style={{ color: '#aaa', fontSize: '0.9rem' }}>
                Halo, {user.nama_d || user.uname}
              </span>
              <button className="btn btn-sm btn-outline" style={{ color: '#fff', borderColor: '#666' }} onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login">Login</NavLink>
              <NavLink to="/register">Daftar</NavLink>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}

// components/RequireAuth.jsx — bungkus route yang butuh login (+ opsional cek role)
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RequireAuth({ role, children }) {
  const { isLoggedIn, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center min-vh-100 text-muted">
        Memuat sesi...
      </div>
    );
  }

  if (!isLoggedIn || !user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (role) {
    const userRole = String(user.role || '').toLowerCase().trim();
    const need = String(role).toLowerCase().trim();
    if (userRole !== need) {
      // Jangan lempar ke halaman yang memicu loop; selalu ke beranda publik
      return <Navigate to="/" replace />;
    }
  }

  return children;
}

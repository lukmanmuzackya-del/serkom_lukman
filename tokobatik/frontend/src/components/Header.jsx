import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { SITE } from "../constants";

function Header() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="site-header">
      <div className="header-inner">

        <Link to="/" className="brand">
          <span className="brand-mark">LC</span>

          <span className="brand-name">
            {SITE?.nama_toko || "Batik Nusantara"}
          </span>
        </Link>

        <nav className="main-nav">
          <Link to="/" className="nav-link">
            Beranda
          </Link>

          <Link to="/produk" className="nav-link">
            Toko
          </Link>

          <Link to="/artikel" className="nav-link">
            Artikel
          </Link>
        </nav>

        <div className="header-actions">
          {user ? (
            <>
              {user.role === "admin" && (
                <Link to="/admin" className="account-link">
                  Admin
                </Link>
              )}

              {user.role === "pembeli" && (
                <Link to="/akun" className="account-link">
                  Akun
                </Link>
              )}

              <button
                type="button"
                className="header-button"
                onClick={handleLogout}
              >
                Keluar
              </button>
            </>
          ) : (
            <Link to="/login" className="login-button">
              Masuk <span>→</span>
            </Link>
          )}
        </div>

      </div>
    </header>
  );
}

export default Header;
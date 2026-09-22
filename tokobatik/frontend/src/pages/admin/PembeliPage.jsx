import { Link } from "react-router-dom";

function PembeliPage() {
  return (
    <div className="admin-page">

      <div className="admin-page-header">
        <div>
          <span className="section-label">
            CUSTOMER
          </span>

          <h1>Data Pembeli</h1>

          <p>
            Kelola dan lihat data pembeli Batik Nusantara.
          </p>
        </div>

        <Link to="/admin" className="admin-back-btn">
          ← Kembali
        </Link>
      </div>

      <div className="admin-card">

        <div className="admin-card-header">
          <div>
            <h2>Daftar Pembeli</h2>
            <p>
              Data pembeli yang terdaftar di toko.
            </p>
          </div>
        </div>

        <div className="admin-empty">
          <div className="admin-empty-icon">
            👤
          </div>

          <h3>Belum ada data pembeli</h3>

          <p>
            Data pembeli akan muncul di sini.
          </p>
        </div>

      </div>

    </div>
  );
}

export default PembeliPage;

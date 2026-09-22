import { Link } from 'react-router-dom';
import { SITE, PUBLIC_NAV } from '../../constants';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="row g-4 pb-2">
          <div className="col-md-4">
            <div className="d-flex align-items-center gap-2 mb-3">
              {SITE.logo ? (
                <img
                  src={SITE.logo}
                  alt={SITE.nama_toko}
                  className="brand-logo-icon brand-logo-icon--footer"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.style.display = 'none';
                  }}
                />
              ) : null}
              <div>
                <div className="fw-bold text-white">{SITE.nama_toko}</div>
                <div className="small opacity-75">{SITE.tagline}</div>
              </div>
            </div>
            <p className="small mb-0" style={{ maxWidth: 320, lineHeight: 1.7 }}>
              {SITE.tentang}
            </p>
          </div>

          <div className="col-6 col-md-2">
            <h6 className="mb-3">Navigasi</h6>
            <ul className="list-unstyled small mb-0">
              {PUBLIC_NAV.map((n) => (
                <li key={n.to} className="mb-2">
                  <Link to={n.to}>{n.label}</Link>
                </li>
              ))}
              <li className="mb-2">
                <Link to="/login">Masuk</Link>
              </li>
            </ul>
          </div>

          <div className="col-6 col-md-3">
            <h6 className="mb-3">Kontak</h6>
            <ul className="list-unstyled small mb-0">
              <li className="mb-2">
                <i className="bi bi-geo-alt me-2" />
                Jl. Niken Gandini No. 144, Japan, Babadan
              </li>
              <li className="mb-2">
                <a href="https://wa.me/62895807426969" target="_blank" rel="noreferrer">
                  <i className="bi bi-whatsapp me-2" />
                  +62895807426969
                </a>
              </li>
              <li className="mb-2">
                <i className="bi bi-envelope me-2" />
                {SITE.email_toko}
              </li>
              <li className="mb-2">
                <i className="bi bi-clock me-2" />
                {SITE.hari_buka}, {SITE.jam_buka} – {SITE.jam_tutup}
              </li>
            </ul>
          </div>

          <div className="col-md-3">
            <h6 className="mb-3">Hubungi kami</h6>
            <p className="small mb-3">Tanya stok, ukuran, atau pengiriman langsung via WhatsApp.</p>
            <a
              href="https://wa.me/62895807426969"
              target="_blank"
              rel="noreferrer"
              className="btn btn-wa btn-sm"
            >
              <i className="bi bi-whatsapp me-1" /> Chat WhatsApp
            </a>
          </div>
        </div>

        <div className="footer-bottom d-flex flex-wrap justify-content-between gap-2">
          <span>© {new Date().getFullYear()} {SITE.nama_toko}. All rights reserved.</span>
          <span>Jl. Niken Gandini No. 144, Japan, Babadan</span>
        </div>
      </div>
    </footer>
  );
}

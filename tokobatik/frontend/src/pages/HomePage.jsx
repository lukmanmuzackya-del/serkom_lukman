import { Link } from 'react-router-dom';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import ProdukCard from '../components/home/ProdukCard';
import ArtikelCard from '../components/home/ArtikelCard';
import { useBerandaData } from '../hooks';
import { SITE, HERO, KEUNGGULAN, KATEGORI_PRODUK } from '../constants';

const KAT_META = [
  { key: 'Kemeja Batik', icon: 'bi-person-bounding-box', desc: 'Motif klasik & modern untuk pria' },
  { key: 'Dress Batik', icon: 'bi-stars', desc: 'Elegan untuk acara formal & santai' },
  { key: 'Kain Batik', icon: 'bi-grid-3x3-gap', desc: 'Kain tulis & cap siap jahit' },
];

export default function HomePage() {
  const { produk, artikelTampil, loading, error } = useBerandaData();
  const produkTampil = (produk || []).slice(0, 4);
  const totalProduk = (produk || []).length;

  return (
    <>
      <Header />

      {/* HERO */}
      <section className="hero-lads">
        <div className="container py-5 py-lg-5">
          <div className="row align-items-center g-4 g-lg-5">
            <div className="col-lg-6 hero-copy anim-slide-up">
              <span className="hero-badge">{HERO.badge}</span>
              <h1 className="hero-title mb-3">{HERO.title || SITE.nama_toko}</h1>
              <p className="hero-desc mb-4">{HERO.deskripsi}</p>
              <div className="d-flex flex-wrap gap-2 mb-4">
                <Link to="/toko" className="btn btn-brand px-4 py-2">
                  {HERO.cta_koleksi}
                </Link>
                <a
                  href={SITE.link_wa}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-outline-light rounded-pill px-4 py-2"
                >
                  <i className="bi bi-whatsapp me-1" /> {HERO.cta_wa}
                </a>
              </div>
              <div className="hero-stats">
                <div className="hero-stat">
                  <strong>{totalProduk || '—'}</strong>
                  <span>Produk</span>
                </div>
                <div className="hero-stat">
                  <strong>3</strong>
                  <span>Kategori</span>
                </div>
                <div className="hero-stat">
                  <strong>Tulis &amp; Cap</strong>
                  <span>Teknik batik</span>
                </div>
              </div>
            </div>
            <div className="col-lg-6">
              <div className="hero-photo-wrap">
                <div className="hero-photo-ring" aria-hidden />
                <div className="hero-photo-frame">
                  <img
                    src={HERO.gambar || '/hero-batik.jpg'}
                    alt={HERO.gambar_alt || 'Pengrajin batik tulis'}
                    className="hero-photo-img"
                  />
                  <div className="hero-photo-overlay" />
                  <div className="hero-photo-caption">
                    <span className="hero-photo-caption__dot" />
                    Pengrajin batik tulis · warisan hidup
                  </div>
                </div>
                <div className="hero-float hero-float--1" aria-hidden>
                  <i className="bi bi-flower1" />
                </div>
                <div className="hero-float hero-float--2" aria-hidden>
                  <i className="bi bi-stars" />
                </div>
                <div className="hero-float hero-float--3" aria-hidden />
                <div className="hero-chips-float">
                  {KATEGORI_PRODUK.map((k) => (
                    <Link key={k} to="/toko" className="hero-chip">
                      {k}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* KEUNGGULAN */}
      <section className="section-block section-block--tight">
        <div className="container">
          <div className="row g-3">
            {KEUNGGULAN.map((item) => (
              <div className="col-6 col-md-3" key={item.judul}>
                <div className="feature-card">
                  <i className={`bi ${item.icon}`} />
                  <h3>{item.judul}</h3>
                  <p>{item.deskripsi}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* KATEGORI */}
      <section className="section-block">
        <div className="container">
          <div className="section-head">
            <div>
              <p className="section-kicker mb-1">Koleksi</p>
              <h2 className="section-title mb-0">Jelajahi kategori</h2>
            </div>
            <Link to="/toko" className="btn btn-outline-brand btn-sm">
              Semua produk
            </Link>
          </div>
          <div className="row g-3">
            {KAT_META.map((k) => (
              <div className="col-md-4" key={k.key}>
                <Link to="/toko" className="kat-card">
                  <div className="kat-card__icon">
                    <i className={`bi ${k.icon}`} />
                  </div>
                  <div>
                    <h3 className="kat-card__title">{k.key}</h3>
                    <p className="kat-card__desc">{k.desc}</p>
                  </div>
                  <span className="kat-card__arrow">
                    <i className="bi bi-arrow-right" />
                  </span>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRODUK */}
      <section className="section-block section-block--soft">
        <div className="container">
          <div className="section-head">
            <div>
              <p className="section-kicker mb-1">Unggulan</p>
              <h2 className="section-title mb-0">Koleksi pilihan</h2>
            </div>
            <Link to="/toko" className="btn btn-outline-brand btn-sm">
              Lihat semua
            </Link>
          </div>
          {error && <p className="text-danger">{error}</p>}
          {loading ? (
            <p className="text-muted">Memuat produk...</p>
          ) : (
            <div className="row row-cols-2 row-cols-md-3 row-cols-lg-4 g-3">
              {produkTampil.map((p) => (
                <ProdukCard key={p.id_produk ?? p.id} produk={p} />
              ))}
              {!produkTampil.length && (
                <div className="col-12">
                  <div className="empty-state panel">Belum ada produk. Admin dapat menambahkannya di dashboard.</div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* CTA BAND */}
      <section className="cta-band">
        <div className="container">
          <div className="cta-band__inner">
            <div>
              <h2 className="cta-band__title">Butuh motif khusus atau ukuran custom?</h2>
              <p className="cta-band__text">
                Chat kami di WhatsApp — kami bantu pilih motif, ukuran, dan pengiriman ke seluruh Indonesia.
              </p>
            </div>
            <a href={SITE.link_wa} target="_blank" rel="noreferrer" className="btn btn-brand btn-lg">
              <i className="bi bi-whatsapp me-2" />
              Hubungi sekarang
            </a>
          </div>
        </div>
      </section>

      {/* ARTIKEL */}
      <section className="section-block">
        <div className="container">
          <div className="section-head">
            <div>
              <p className="section-kicker mb-1">Cerita batik</p>
              <h2 className="section-title mb-0">Artikel terbaru</h2>
            </div>
            <Link to="/artikel" className="btn btn-outline-brand btn-sm">
              Semua artikel
            </Link>
          </div>
          <div className="row row-cols-1 row-cols-md-3 g-3">
            {(artikelTampil || []).slice(0, 3).map((a) => (
              <ArtikelCard key={a.id} artikel={a} />
            ))}
            {!(artikelTampil || []).length && (
              <div className="col-12">
                <div className="empty-state">Belum ada artikel.</div>
              </div>
            )}
          </div>
        </div>
      </section>


      <Footer />
    </>
  );
}

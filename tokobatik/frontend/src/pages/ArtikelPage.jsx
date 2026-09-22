import { Link } from "react-router-dom";

function ArtikelPage() {
  return (
    <div className="public-page">

      <header className="public-header">
        <Link to="/" className="logo">
          <strong>LC</strong>
          <span>LADS CLOBBERS</span>
        </Link>

        <nav>
          <Link to="/">Beranda</Link>
          <Link to="/toko">Toko</Link>
          <Link to="/artikel" className="active">
            Artikel
          </Link>
          <Link to="/login" className="login-btn">
            Masuk →
          </Link>
        </nav>
      </header>

      <section className="article-hero">
        <span className="section-label">
          LADS CLOBBERS JOURNAL
        </span>

        <h1>
          Artikel &<br />
          Inspirasi Fashion.
        </h1>

        <p>
          Temukan informasi, tips, dan inspirasi
          batik dari Batik Nusantara.
        </p>
      </section>

      <main className="article-container">

        <div className="article-heading">
          <div>
            <span className="section-label">
              LATEST STORIES
            </span>

            <h2>Artikel Terbaru</h2>
          </div>

          <Link to="/toko" className="outline-btn">
            Lihat Toko →
          </Link>
        </div>

        <div className="article-grid">

          <article className="article-card">
            <div className="article-image">
              <span>FASHION</span>
            </div>

            <div className="article-content">
              <small>27 Agustus 2026</small>

              <h3>
                Tips Memilih Outfit Casual
              </h3>

              <p>
                Temukan tips sederhana memilih outfit
                casual yang nyaman untuk digunakan
                sehari-hari.
              </p>

              <button className="read-more">
                Baca Selengkapnya →
              </button>
            </div>
          </article>

          <article className="article-card">
            <div className="article-image">
              <span>STYLE</span>
            </div>

            <div className="article-content">
              <small>26 Agustus 2026</small>

              <h3>
                Tren Fashion Anak Muda
              </h3>

              <p>
                Inspirasi fashion modern yang cocok
                untuk gaya anak muda masa kini.
              </p>

              <button className="read-more">
                Baca Selengkapnya →
              </button>
            </div>
          </article>

          <article className="article-card">
            <div className="article-image">
              <span>LIFESTYLE</span>
            </div>

            <div className="article-content">
              <small>25 Agustus 2026</small>

              <h3>
                Mengenal Dunia Thrifting
              </h3>

              <p>
                Mengenal lebih jauh dunia thrifting
                dan alasan banyak anak muda memilihnya.
              </p>

              <button className="read-more">
                Baca Selengkapnya →
              </button>
            </div>
          </article>

        </div>

      </main>

      <footer className="public-footer">
        <div>
          <strong>LADS CLOBBERS</strong>
          <p>Simple style, better choice.</p>
        </div>

        <p>
          © {new Date().getFullYear()} Batik Nusantara
        </p>
      </footer>

    </div>
  );
}

export default ArtikelPage;
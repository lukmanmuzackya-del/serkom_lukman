import { Link, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import SafeImg from '../components/SafeImg';
import { api } from '../api';
import { formatTanggal } from '../utils';

export default function ArtikelDetailPage() {
  const { id } = useParams();
  const [artikel, setArtikel] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    api.getArtikelById(id)
      .then((r) => { if (alive) setArtikel(r.data); })
      .catch((e) => { if (alive) setError(e.message); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [id]);

  return (
    <>
      <Header />
      <section className="py-5">
        <div className="container" style={{ maxWidth: 800 }}>
          <Link to="/artikel" className="text-brand text-decoration-none small fw-semibold">← Kembali ke artikel</Link>
          {loading && <p className="mt-4 text-muted">Memuat...</p>}
          {error && <p className="mt-4 text-danger">{error}</p>}
          {artikel && (
            <article className="mt-3">
              <h1 className="fw-bold mb-2">{artikel.judul}</h1>
              <p className="text-muted small mb-4">{formatTanggal(artikel.created_at)}</p>
              {artikel.gambar && (
                <SafeImg src={artikel.gambar} alt={artikel.judul} className="img-fluid rounded-4 mb-4 w-100" style={{ maxHeight: 420, objectFit: 'cover' }} />
              )}
              {artikel.ringkasan && <p className="lead text-muted">{artikel.ringkasan}</p>}
              <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.75 }}>{artikel.isi}</div>
            </article>
          )}
        </div>
      </section>
      <Footer />
    </>
  );
}

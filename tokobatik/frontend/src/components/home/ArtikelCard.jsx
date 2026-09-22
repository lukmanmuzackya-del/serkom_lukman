import { Link } from 'react-router-dom';
import SafeImg from '../SafeImg';
import { formatTanggal } from '../../utils';

export default function ArtikelCard({ artikel }) {
  return (
    <div className="col">
      <article className="artikel-card h-100">
        <Link to={`/artikel/${artikel.id}`} className="artikel-card__media">
          <SafeImg
            src={artikel.gambar}
            alt={artikel.judul}
            className="artikel-card__img"
          />
        </Link>
        <div className="artikel-card__body">
          <span className="artikel-card__meta">{formatTanggal(artikel.created_at)}</span>
          <h3 className="artikel-card__title">
            <Link to={`/artikel/${artikel.id}`}>{artikel.judul}</Link>
          </h3>
          <p className="artikel-card__excerpt">
            {(artikel.ringkasan || artikel.isi || '').slice(0, 110)}
            {(artikel.ringkasan || artikel.isi || '').length > 110 ? '…' : ''}
          </p>
          <Link to={`/artikel/${artikel.id}`} className="artikel-card__more">
            Baca selengkapnya <i className="bi bi-arrow-right" />
          </Link>
        </div>
      </article>
    </div>
  );
}

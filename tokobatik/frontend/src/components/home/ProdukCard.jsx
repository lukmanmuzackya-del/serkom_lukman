import { Link, useNavigate } from 'react-router-dom';
import { formatRupiah, mediaUrl, labelKategori } from '../../utils';
import SafeImg from '../SafeImg';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

export default function ProdukCard({ produk }) {
  const id = produk.id_produk ?? produk.id;
  const img = mediaUrl(produk.gambar);
  const { addItem } = useCart();
  const { isLoggedIn, isPembeli, isAdmin } = useAuth();
  const navigate = useNavigate();

  function requireLogin(path) {
    navigate('/login', { state: { from: path } });
  }

  function onAdd(e) {
    e.preventDefault();
    e.stopPropagation();
    if (isAdmin) return;
    if (!isLoggedIn) return requireLogin(`/toko/${id}`);
    if (!isPembeli) return;
    addItem(produk, 1);
  }

  function onBuy(e) {
    e.preventDefault();
    e.stopPropagation();
    if (isAdmin) return;
    if (!isLoggedIn) return requireLogin(`/toko/${id}`);
    if (!isPembeli) return;
    addItem(produk, 1);
    navigate('/akun/keranjang');
  }

  return (
    <div className="produk-card h-100 d-flex flex-column">
      <Link to={`/toko/${id}`} className="text-decoration-none text-dark flex-grow-1">
        <div className="produk-card__media">
          <SafeImg src={img} alt={produk.nama_produk} className="produk-card__img" />
          {produk.kategori ? (
            <span className="produk-card__badge">{labelKategori(produk.kategori)}</span>
          ) : null}
        </div>
        <div className="produk-card__body">
          <h3 className="produk-card__title">{produk.nama_produk}</h3>
          <div className="produk-card__price">{produk.stok != null ? (
        <span className="small text-muted d-block mb-1">Stok: {Number(produk.stok)}</span>
      ) : null}
      {formatRupiah(produk.harga)}</div>
        </div>
      </Link>
      {isAdmin ? (
        <div className="px-3 pb-3">
          <span className="badge-soft muted">Akun admin</span>
        </div>
      ) : (
        <div className="produk-card__actions px-3 pb-3 d-flex gap-2">
          <button type="button" className="btn btn-sm btn-brand flex-grow-1" onClick={onBuy}>
            {!isLoggedIn ? 'Masuk untuk beli' : 'Beli sekarang'}
          </button>
          <button type="button" className="btn btn-sm btn-outline-brand" onClick={onAdd} title="Keranjang">
            <i className="bi bi-bag-plus" />
          </button>
        </div>
      )}
    </div>
  );
}

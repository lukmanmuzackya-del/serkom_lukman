import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { pembeliApi } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { usePembeliGuard, usePembeliList } from '../../hooks';
import LoadingBlock from '../../components/admin/LoadingBlock';
import { OrderStatusSummary } from '../../components/pembeli/OrderStatusTracker';

export default function PembeliOverviewPage() {
  const { user } = useAuth();
  const { handleError } = usePembeliGuard();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { rows: pesanan } = usePembeliList(pembeliApi.getPembelian);

  useEffect(() => {
    let alive = true;
    // cukup pastikan sesi ok; data pesanan dari usePembeliList
    pembeliApi
      .getDashboard()
      .then(() => {})
      .catch((err) => {
        if (!alive) return;
        if (!handleError(err)) setError(err.message || 'Gagal memuat data');
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [handleError]);

  if (loading) return <LoadingBlock />;
  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <div>
      <div className="dash-welcome mb-4">
        <h2 className="page-title mb-1">Halo, {user?.nama_d || 'Pembeli'} 👋</h2>
        <p className="text-secondary mb-0">Ringkasan pesanan & status belanja kamu di Batik Nusantara.</p>
      </div>

      <div className="mb-4">
        <OrderStatusSummary orders={pesanan || []} linkTo="/akun/pesanan" />
      </div>

      <div className="panel mt-2">
        <h3 className="h6 fw-bold mb-2">Aksi cepat</h3>
        <p className="text-secondary small mb-3">Pesan produk favorit atau cek status pesanan terakhir.</p>
        <div className="d-flex flex-wrap gap-2">
          <Link to="/toko" className="btn btn-brand btn-sm">
            + Belanja sekarang
          </Link>
          <Link to="/akun/keranjang" className="btn btn-outline-brand btn-sm">
            Keranjang
          </Link>
          <Link to="/akun/pesanan" className="btn btn-outline-brand btn-sm">
            Lihat pesanan
          </Link>
          <Link to="/akun/profil" className="btn btn-outline-secondary btn-sm rounded-pill">
            Ubah profil
          </Link>
        </div>
      </div>
    </div>
  );
}

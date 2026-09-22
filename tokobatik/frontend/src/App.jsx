import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

/* context */
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

/* components */
import RequireAuth from './components/RequireAuth';
import ScrollToTop from './components/ScrollToTop';

/* layouts */
import AdminLayout from './layouts/AdminLayout';
import PembeliLayout from './layouts/PembeliLayout';

/* pages (publik) */
import HomePage from './pages/HomePage';
import TokoPage from './pages/TokoPage';
import ProductDetailPage from './pages/ProductDetailPage';
import ArtikelListPage from './pages/ArtikelListPage';
import ArtikelDetailPage from './pages/ArtikelDetailPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CartPage from './pages/CartPage';

/* pages/pembeli */
import PembeliOverviewPage from './pages/pembeli/PembeliOverviewPage';
import PembeliBelanjaPage from './pages/pembeli/PembeliBelanjaPage';
import PembeliPesananPage from './pages/pembeli/PembeliPesananPage';
import PembeliTransaksiPage from './pages/pembeli/PembeliTransaksiPage';
import PembeliProfilPage from './pages/pembeli/PembeliProfilPage';
import PembeliKeranjangPage from './pages/pembeli/PembeliKeranjangPage';

/* pages/admin */
import AdminOverviewPage from './pages/admin/AdminOverviewPage';
import AdminProdukPage from './pages/admin/AdminProdukPage';
import AdminPembeliPage from './pages/admin/AdminPembeliPage';
import AdminPembelianPage from './pages/admin/AdminPembelianPage';
import AdminArtikelPage from './pages/admin/AdminArtikelPage';
import AdminProfilPage from './pages/admin/AdminProfilPage';
import AdminKategoriPage from './pages/admin/AdminKategoriPage';
import AdminLaporanPage from './pages/admin/AdminLaporanPage';

function AppRoutes() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* ===== Publik ===== */}
        <Route path="/" element={<HomePage />} />
        <Route path="/toko" element={<TokoPage />} />
        <Route path="/toko/:id" element={<ProductDetailPage />} />
        <Route path="/produk/:id" element={<ProductDetailPage />} />
        <Route path="/artikel" element={<ArtikelListPage />} />
        <Route path="/artikel/:id" element={<ArtikelDetailPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/keranjang" element={<CartPage />} />

        {/* ===== Pembeli (/akun) ===== */}
        <Route
          path="/akun"
          element={
            <RequireAuth role="pembeli">
              <PembeliLayout />
            </RequireAuth>
          }
        >
          <Route index element={<PembeliOverviewPage />} />
          <Route path="keranjang" element={<PembeliKeranjangPage />} />
          <Route path="belanja" element={<PembeliBelanjaPage />} />
          <Route path="pesanan" element={<PembeliPesananPage />} />
          <Route path="transaksi" element={<PembeliTransaksiPage />} />
          <Route path="profil" element={<PembeliProfilPage />} />
        </Route>

        {/* ===== Admin (/admin) ===== */}
        <Route
          path="/admin"
          element={
            <RequireAuth role="admin">
              <AdminLayout />
            </RequireAuth>
          }
        >
          <Route index element={<AdminOverviewPage />} />
          <Route path="produk" element={<AdminProdukPage />} />
          <Route path="kategori" element={<AdminKategoriPage />} />
          <Route path="laporan" element={<AdminLaporanPage />} />
          <Route path="pembeli" element={<AdminPembeliPage />} />
          <Route path="pembelian" element={<AdminPembelianPage />} />
          <Route path="artikel" element={<AdminArtikelPage />} />
          <Route path="profil" element={<AdminProfilPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Scroll ke atas setiap kali path berubah.
 * - window (halaman publik: produk, koleksi, artikel)
 * - .admin-main / .pembeli-main (area dashboard agar konten mulai dari atas)
 */
export default function ScrollToTop() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    // Halaman publik / body
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });

    // Area admin & pembeli (scroll di dalam panel utama, bukan window)
    const mains = document.querySelectorAll('.admin-main, .pembeli-main');
    mains.forEach((el) => {
      el.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    });
  }, [pathname, search]);

  return null;
}

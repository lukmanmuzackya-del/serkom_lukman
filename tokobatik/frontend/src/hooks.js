/**
 * hooks.js — guard sesi + load list + data beranda.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { api, asList } from './api';
import { SITE } from './constants';
import { kategoriDariProduk } from './utils';

export function useAdminGuard() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const handleError = useCallback(
    (err) => {
      if (err?.status === 401 || err?.status === 403) {
        logout();
        navigate('/login', { replace: true, state: { from: '/admin' } });
        return true;
      }
      return false;
    },
    [logout, navigate]
  );
  return { handleError };
}

export function usePembeliGuard() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const handleError = useCallback(
    (err) => {
      if (err?.status === 401 || err?.status === 403) {
        logout();
        navigate('/login', { replace: true, state: { from: '/akun' } });
        return true;
      }
      return false;
    },
    [logout, navigate]
  );
  return { handleError };
}

export function useAdminList(apiFn) {
  const { handleError } = useAdminGuard();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const reload = useCallback(() => {
    setLoading(true);
    setError('');
    return apiFn()
      .then((r) => setRows(asList(r.data).length ? asList(r.data) : asList(r.raw)))
      .catch((err) => {
        if (!handleError(err)) setError(err.message || 'Gagal memuat data');
      })
      .finally(() => setLoading(false));
  }, [apiFn, handleError]);
  useEffect(() => {
    reload();
  }, [reload]);
  return { rows, loading, error, reload };
}

export function usePembeliList(apiFn) {
  const { handleError } = usePembeliGuard();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const reload = useCallback(() => {
    setLoading(true);
    setError('');
    return apiFn()
      .then((r) => setRows(asList(r.data).length ? asList(r.data) : asList(r.raw)))
      .catch((err) => {
        if (!handleError(err)) setError(err.message || 'Gagal memuat data');
      })
      .finally(() => setLoading(false));
  }, [apiFn, handleError]);
  useEffect(() => {
    reload();
  }, [reload]);
  return { rows, loading, error, reload };
}

export function useBerandaData() {
  const [produk, setProduk] = useState([]);
  const [artikel, setArtikel] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const info = SITE;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [pRes, aRes] = await Promise.all([api.getProduk(), api.getArtikel()]);
        if (cancelled) return;
        setProduk(asList(pRes.data).length ? asList(pRes.data) : asList(pRes.raw));
        setArtikel(asList(aRes.data).length ? asList(aRes.data) : asList(aRes.raw));
      } catch {
        if (!cancelled) {
          setError('Data toko tidak dapat dimuat. Periksa koneksi lalu muat ulang halaman.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const kategoriList = useMemo(() => kategoriDariProduk(produk), [produk]);
  const produkTerbaru = useMemo(
    () =>
      [...produk]
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 4),
    [produk]
  );
  const artikelTampil = useMemo(() => artikel.slice(0, 3), [artikel]);

  return { produk, artikel, artikelTampil, info, loading, error, kategoriList, produkTerbaru };
}

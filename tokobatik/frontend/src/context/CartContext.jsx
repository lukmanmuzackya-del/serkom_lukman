import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);
const STORAGE_KEY = 'lads_cart_v1';
const OWNER_KEY = 'lads_cart_owner';

function loadCart() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function loadOwner() {
  try {
    return localStorage.getItem(OWNER_KEY) || '';
  } catch {
    return '';
  }
}

export function CartProvider({ children }) {
  const { user, isLoggedIn } = useAuth();
  const [items, setItems] = useState(() => loadCart());
  const prevUserId = useRef(loadOwner());

  // Kosongkan keranjang jika akun berbeda (ganti login) atau logout
  useEffect(() => {
    const currentId = user?.id != null ? String(user.id) : '';
    const previousId = prevUserId.current;

    // Belum pernah ada owner → set owner saat login pertama tanpa clear
    if (!previousId && currentId) {
      prevUserId.current = currentId;
      localStorage.setItem(OWNER_KEY, currentId);
      return;
    }

    // Logout: kosongkan keranjang
    if (previousId && !currentId) {
      setItems([]);
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(OWNER_KEY);
      prevUserId.current = '';
      return;
    }

    // Ganti akun (id berbeda): kosongkan keranjang
    if (currentId && previousId && currentId !== previousId) {
      setItems([]);
      localStorage.removeItem(STORAGE_KEY);
      localStorage.setItem(OWNER_KEY, currentId);
      prevUserId.current = currentId;
    }
  }, [user?.id, isLoggedIn]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  function addItem(produk, qty = 1) {
    const id = produk.id_produk ?? produk.id;
    const jumlah = Math.max(1, Number(qty) || 1);
    setItems((prev) => {
      const idx = prev.findIndex((x) => String(x.id_produk) === String(id));
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], jumlah: next[idx].jumlah + jumlah };
        return next;
      }
      return [
        ...prev,
        {
          id_produk: id,
          nama_produk: produk.nama_produk,
          harga: Number(produk.harga) || 0,
          gambar: produk.gambar || '',
          kategori: produk.kategori || '',
          jumlah,
        },
      ];
    });
  }

  function setQty(id_produk, qty) {
    const jumlah = Math.max(1, Number(qty) || 1);
    setItems((prev) =>
      prev.map((x) =>
        String(x.id_produk) === String(id_produk) ? { ...x, jumlah } : x
      )
    );
  }

  function removeItem(id_produk) {
    setItems((prev) => prev.filter((x) => String(x.id_produk) !== String(id_produk)));
  }

  function clearCart() {
    setItems([]);
  }

  const count = useMemo(
    () => items.reduce((sum, x) => sum + (Number(x.jumlah) || 0), 0),
    [items]
  );

  const subtotal = useMemo(
    () => items.reduce((sum, x) => sum + (Number(x.harga) || 0) * (Number(x.jumlah) || 0), 0),
    [items]
  );

  const value = {
    items,
    count,
    subtotal,
    addItem,
    setQty,
    removeItem,
    clearCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart harus dipakai di dalam CartProvider');
  return ctx;
}

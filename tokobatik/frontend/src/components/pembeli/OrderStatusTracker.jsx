import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import SafeImg from '../SafeImg';
import { formatRupiah, formatTanggal } from '../../utils';

/**
 * Visual status pesanan:
 * Belum Bayar → Dikemas → Dikirim → Selesai
 */
export const STEPS = [
  { key: 'bayar', label: 'Belum Bayar', icon: 'bi-wallet2' },
  { key: 'dikemas', label: 'Dikemas', icon: 'bi-box-seam' },
  { key: 'dikirim', label: 'Dikirim', icon: 'bi-truck' },
  { key: 'selesai', label: 'Selesai', icon: 'bi-star' },
];

export function getOrderStepIndex(order) {
  const status = String(order?.status || '').toLowerCase();
  const bayar = String(order?.pembayaran || '').toLowerCase();
  const belumBayar = bayar.includes('belum');

  if (status === 'dibatalkan') return -1;
  if (status === 'selesai' || status === 'diterima') return 3;
  if (status === 'dikirim') return 2;
  if (status === 'dikemas') return 1;
  if (belumBayar) return 0;
  return 1;
}

export function orderStepLabel(order) {
  const idx = getOrderStepIndex(order);
  if (idx < 0) return 'Dibatalkan';
  return STEPS[idx]?.label || order?.status || '-';
}

export function filterOrdersByStep(orders, stepKey) {
  const idx = STEPS.findIndex((s) => s.key === stepKey);
  if (idx < 0) return orders || [];
  return (orders || []).filter((o) => getOrderStepIndex(o) === idx);
}

function qtyOf(p) {
  if (p?.jumlah != null) return Number(p.jumlah) || 1;
  const m = String(p?.catatan || '').match(/Jumlah:\s*(\d+)/i);
  return m ? Number(m[1]) : 1;
}

function totalOf(p) {
  const harga = Number(p?.harga || p?.produk_harga || 0);
  return harga * qtyOf(p);
}

export default function OrderStatusTracker({ order, compact = false }) {
  const active = getOrderStepIndex(order);
  const cancelled = active < 0;

  return (
    <div
      className={`order-tracker ${compact ? 'order-tracker--compact' : ''} ${
        cancelled ? 'is-cancelled' : ''
      }`}
    >
      {STEPS.map((step, i) => {
        const done = !cancelled && active > i;
        const current = !cancelled && active === i;
        const upcoming = cancelled || active < i;

        return (
          <div
            key={step.key}
            className={[
              'order-tracker__step',
              done ? 'is-done' : '',
              current ? 'is-current' : '',
              upcoming ? 'is-upcoming' : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {i > 0 && <div className="order-tracker__line" aria-hidden />}
            <div className="order-tracker__icon" title={step.label}>
              <i className={`bi ${step.icon}`} />
              {current && !compact ? <span className="order-tracker__dot" /> : null}
            </div>
            <div className="order-tracker__label">{step.label}</div>
          </div>
        );
      })}
      {cancelled ? <div className="order-tracker__cancel-note">Pesanan dibatalkan</div> : null}
    </div>
  );
}

/** Modal daftar pesanan per tahap (gaya mirip modal edit admin) */
function OrderStepModal({ show, title, icon, orders, onClose }) {
  if (!show) return null;

  return (
    <div className="admin-modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="admin-modal admin-modal--wide"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="admin-modal-header">
          <h3 className="admin-modal-title mb-0">
            {icon ? <i className={`bi ${icon} me-2`} /> : null}
            {title}
            <span className="text-muted fw-normal small ms-2">({orders.length})</span>
          </h3>
          <button type="button" className="btn-close" aria-label="Tutup" onClick={onClose} />
        </div>
        <div className="admin-modal-body">
          {!orders.length ? (
            <p className="text-muted mb-0">Tidak ada barang di tahap ini.</p>
          ) : (
            <div className="order-modal-list">
              {orders.map((p) => {
                const qty = qtyOf(p);
                const total = totalOf(p);
                const nama = p.nama_produk || p.produk_nama || 'Produk';
                const img = p.produk_gambar || p.gambar;
                return (
                  <div key={p.id} className="order-modal-row">
                    <SafeImg src={img} alt={nama} className="order-modal-thumb" />
                    <div className="flex-grow-1 min-w-0">
                      <div className="fw-semibold text-truncate">{nama}</div>
                      <div className="small text-muted">
                        {formatTanggal(p.created_at)} · {qty} item · {formatRupiah(total)}
                      </div>
                      <div className="small text-muted">
                        Status: <strong>{p.status}</strong>
                        {p.pembayaran ? ` · Bayar: ${p.pembayaran}` : ''}
                      </div>
                    </div>
                    <Link
                      to="/akun/pesanan"
                      className="btn btn-sm btn-outline-brand flex-shrink-0"
                      onClick={onClose}
                    >
                      Detail
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div className="admin-modal-footer border-top px-3 py-2 d-flex justify-content-end">
          <button type="button" className="btn btn-sm btn-outline-secondary" onClick={onClose}>
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

/** Ringkasan — klik ikon buka modal (bukan daftar di bawah) */
export function OrderStatusSummary({ orders = [], linkTo = '/akun/pesanan' }) {
  const [modalKey, setModalKey] = useState(null);

  const grouped = useMemo(() => {
    const map = { bayar: [], dikemas: [], dikirim: [], selesai: [] };
    for (const o of orders) {
      const i = getOrderStepIndex(o);
      if (i === 0) map.bayar.push(o);
      else if (i === 1) map.dikemas.push(o);
      else if (i === 2) map.dikirim.push(o);
      else if (i === 3) map.selesai.push(o);
    }
    return map;
  }, [orders]);

  const counts = {
    bayar: grouped.bayar.length,
    dikemas: grouped.dikemas.length,
    dikirim: grouped.dikirim.length,
    selesai: grouped.selesai.length,
  };

  const step = STEPS.find((s) => s.key === modalKey);

  return (
    <>
      <div className="order-summary panel">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h3 className="h6 fw-bold mb-0">Pesanan Saya</h3>
          <Link to={linkTo} className="small text-brand fw-semibold text-decoration-none">
            Lihat Riwayat Pesanan <i className="bi bi-chevron-right" />
          </Link>
        </div>
        <div className="order-summary__grid">
          {STEPS.map((s) => {
            const n = counts[s.key] || 0;
            return (
              <button
                key={s.key}
                type="button"
                className="order-summary__item"
                onClick={() => setModalKey(s.key)}
                title={`Lihat: ${s.label}`}
              >
                <div className="order-summary__icon-wrap">
                  <i className={`bi ${s.icon}`} />
                  {n > 0 ? (
                    <span className="order-summary__badge">{n > 99 ? '99+' : n}</span>
                  ) : null}
                </div>
                <div className="order-summary__label">{s.label}</div>
              </button>
            );
          })}
        </div>
      </div>

      <OrderStepModal
        show={Boolean(modalKey)}
        title={step?.label || 'Pesanan'}
        icon={step?.icon}
        orders={modalKey ? grouped[modalKey] || [] : []}
        onClose={() => setModalKey(null)}
      />
    </>
  );
}

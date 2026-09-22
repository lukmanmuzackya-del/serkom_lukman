/**
 * Modal form admin (tambah/ubah).
 * show, title, onClose, wide?, children
 */
export default function AdminModal({ show, title, onClose, wide, children }) {
  if (!show) return null;

  return (
    <div className="admin-modal-backdrop" onClick={onClose} role="presentation">
      <div
        className={`admin-modal ${wide ? 'admin-modal--wide' : ''}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="admin-modal-header">
          <h3 className="admin-modal-title mb-0">{title}</h3>
          <button type="button" className="btn-close" aria-label="Tutup" onClick={onClose} />
        </div>
        <div className="admin-modal-body">{children}</div>
      </div>
    </div>
  );
}

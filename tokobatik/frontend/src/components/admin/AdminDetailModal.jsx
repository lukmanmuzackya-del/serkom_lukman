/** Modal read-only untuk melihat detail baris */
export default function AdminDetailModal({ show, title, onClose, children }) {
  if (!show) return null;

  return (
    <div className="admin-modal-backdrop" onClick={onClose} role="presentation">
      <div className="admin-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="admin-modal-header">
          <h3 className="admin-modal-title mb-0">{title}</h3>
          <button type="button" className="btn-close" aria-label="Tutup" onClick={onClose} />
        </div>
        <div className="admin-modal-body">{children}</div>
        <div className="admin-modal-footer">
          <button type="button" className="btn btn-outline-secondary rounded-0" onClick={onClose}>
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

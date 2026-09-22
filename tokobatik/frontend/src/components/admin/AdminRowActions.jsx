/** Tombol aksi baris admin — ikon saja */
export default function AdminRowActions({ onDetail, onEdit, onDelete, hideDelete }) {
  return (
    <div className="admin-row-actions d-flex align-items-center gap-1">
      {onDetail && (
        <button
          type="button"
          className="btn-icon btn-icon--muted"
          onClick={onDetail}
          title="Detail"
          aria-label="Detail"
        >
          <i className="bi bi-eye" />
        </button>
      )}
      {onEdit && (
        <button
          type="button"
          className="btn-icon btn-icon--edit"
          onClick={onEdit}
          title="Ubah"
          aria-label="Ubah"
        >
          <i className="bi bi-pencil-square" />
        </button>
      )}
      {onDelete && !hideDelete && (
        <button
          type="button"
          className="btn-icon btn-icon--danger"
          onClick={onDelete}
          title="Hapus"
          aria-label="Hapus"
        >
          <i className="bi bi-trash3" />
        </button>
      )}
    </div>
  );
}

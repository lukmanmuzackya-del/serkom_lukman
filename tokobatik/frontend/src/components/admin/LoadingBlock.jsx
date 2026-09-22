export default function LoadingBlock({ text = 'Memuat data…' }) {
  return (
    <div className="admin-loading py-5 text-center text-secondary">
      <div className="spinner-border spinner-border-sm text-secondary me-2" role="status" />
      <span>{text}</span>
    </div>
  );
}

/** Daftar detail key-value untuk modal detail admin */
export default function DetailDl({ items = [] }) {
  return (
    <dl className="admin-detail-dl mb-0">
      {items.map(([label, value]) => (
        <div key={label} className="admin-detail-row">
          <dt>{label}</dt>
          <dd>{value ?? '—'}</dd>
        </div>
      ))}
    </dl>
  );
}

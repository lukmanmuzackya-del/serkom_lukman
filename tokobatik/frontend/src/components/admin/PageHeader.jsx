export default function PageHeader({ title, subtitle, action }) {
  return (
    <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-3">
      <div>
        <h2 className="admin-section-title mb-1">{title}</h2>
        {subtitle ? <p className="text-secondary small mb-0">{subtitle}</p> : null}
      </div>
      {action ? <div className="flex-shrink-0">{action}</div> : null}
    </div>
  );
}

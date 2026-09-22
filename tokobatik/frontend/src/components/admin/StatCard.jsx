/**
 * Kartu metrik dashboard — angka besar, modern, minimal.
 */
export default function StatCard({
  label,
  value,
  tone = 'brand',
  icon = 'bi-graph-up',
  hint = '',
  prefix = '',
  suffix = '',
}) {
  const display =
    typeof value === 'number'
      ? value.toLocaleString('id-ID')
      : value ?? '0';

  return (
    <div className={`metric-card tone-${tone}`}>
      <div className="metric-card__top">
        <span className="metric-card__icon">
          <i className={`bi ${icon}`} />
        </span>
        <span className="metric-card__label">{label}</span>
      </div>
      <div className="metric-card__value">
        {prefix}
        {display}
        {suffix}
      </div>
      {hint ? <div className="metric-card__hint">{hint}</div> : null}
    </div>
  );
}

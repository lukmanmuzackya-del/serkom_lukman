/**
 * Grafik sederhana tanpa library eksternal (SVG murni).
 */

/** Bar chart horizontal / vertikal */
export function BarChart({
  data = [],
  valueKey = 'value',
  labelKey = 'label',
  height = 180,
  color = '#1a2744',
  formatValue,
}) {
  const items = Array.isArray(data) ? data.filter((d) => d && (d[labelKey] || d[valueKey] != null)) : [];
  const max = Math.max(1, ...items.map((d) => Number(d[valueKey]) || 0));
  if (!items.length) {
    return <p className="small text-muted mb-0 py-3 text-center">Belum ada data grafik.</p>;
  }
  return (
    <div className="simple-bar-chart" style={{ height }}>
      {items.map((d, i) => {
        const v = Number(d[valueKey]) || 0;
        const pct = Math.max(2, (v / max) * 100);
        const label = d[labelKey] || `#${i + 1}`;
        const shown = formatValue ? formatValue(v) : v;
        return (
          <div className="simple-bar-chart__row" key={`${label}-${i}`}>
            <div className="simple-bar-chart__label" title={label}>
              {label}
            </div>
            <div className="simple-bar-chart__track">
              <div
                className="simple-bar-chart__fill"
                style={{ width: `${pct}%`, background: d.color || color }}
                title={String(shown)}
              />
            </div>
            <div className="simple-bar-chart__value">{shown}</div>
          </div>
        );
      })}
    </div>
  );
}

/** Donut / pie sederhana */
export function DonutChart({
  data = [],
  valueKey = 'value',
  labelKey = 'label',
  size = 160,
  colors = ['#1a2744', '#c9a227', '#5c3a18', '#3d6b8c', '#8b5a2b', '#6b7280'],
  formatValue,
}) {
  const items = (Array.isArray(data) ? data : [])
    .map((d, i) => ({
      label: d[labelKey] || `#${i + 1}`,
      value: Math.max(0, Number(d[valueKey]) || 0),
      color: d.color || colors[i % colors.length],
    }))
    .filter((d) => d.value > 0);

  const total = items.reduce((s, d) => s + d.value, 0) || 1;
  const r = 56;
  const c = 2 * Math.PI * r;
  let offset = 0;

  if (!items.length) {
    return <p className="small text-muted mb-0 py-3 text-center">Belum ada data grafik.</p>;
  }

  return (
    <div className="simple-donut d-flex flex-wrap align-items-center gap-3">
      <svg width={size} height={size} viewBox="0 0 140 140" aria-hidden>
        <g transform="translate(70,70)">
          {items.map((d, i) => {
            const len = (d.value / total) * c;
            const el = (
              <circle
                key={i}
                r={r}
                fill="none"
                stroke={d.color}
                strokeWidth="18"
                strokeDasharray={`${len} ${c - len}`}
                strokeDashoffset={-offset}
                transform="rotate(-90)"
              />
            );
            offset += len;
            return el;
          })}
          <circle r="38" fill="#fff" />
          <text textAnchor="middle" dy="0.35em" fontSize="13" fontWeight="700" fill="#1a2744">
            {items.length}
          </text>
        </g>
      </svg>
      <ul className="simple-donut__legend list-unstyled mb-0 small">
        {items.map((d, i) => (
          <li key={i} className="d-flex align-items-center gap-2 mb-1">
            <span
              className="simple-donut__swatch"
              style={{ background: d.color }}
            />
            <span className="text-truncate" style={{ maxWidth: 120 }}>
              {d.label}
            </span>
            <span className="text-muted ms-auto">
              {formatValue ? formatValue(d.value) : d.value}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

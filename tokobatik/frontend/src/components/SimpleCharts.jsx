/**
 * Diagram batang (vertikal) + opsional horizontal — SVG murni, tanpa library.
 */

/** Diagram batang vertikal (kolom) — untuk penjualan */
export function BarChart({
  data = [],
  valueKey = 'value',
  labelKey = 'label',
  height = 220,
  color = '#1a2744',
  formatValue,
  colors = ['#1a2744', '#c9a227', '#5c3a18', '#3d6b8c', '#8b5a2b', '#6b7280', '#2d6a4f'],
}) {
  const items = Array.isArray(data)
    ? data.filter((d) => d && (d[labelKey] || d[valueKey] != null))
    : [];
  const max = Math.max(1, ...items.map((d) => Number(d[valueKey]) || 0));

  if (!items.length) {
    return (
      <p style={{ textAlign: 'center', color: '#888', fontSize: 13, padding: 12 }}>
        Belum ada data grafik.
      </p>
    );
  }

  const padTop = 28;
  const padBottom = 48;
  const padX = 12;
  const chartH = height - padTop - padBottom;
  const n = items.length;
  const gap = 12;
  // lebar area batang proporsional
  const svgW = Math.max(280, n * 72);
  const barSlot = (svgW - padX * 2) / n;
  const barW = Math.min(48, barSlot - gap);

  return (
    <div style={{ width: '100%', overflowX: 'auto' }} data-chart="batang">
      <svg
        width="100%"
        height={height}
        viewBox={`0 0 ${svgW} ${height}`}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Diagram batang"
      >
        {/* garis dasar */}
        <line
          x1={padX}
          y1={padTop + chartH}
          x2={svgW - padX}
          y2={padTop + chartH}
          stroke="#e5e0d6"
          strokeWidth="1"
        />
        {/* garis grid horizontal lembut */}
        {[0.25, 0.5, 0.75].map((f) => {
          const y = padTop + chartH * (1 - f);
          return (
            <line
              key={f}
              x1={padX}
              y1={y}
              x2={svgW - padX}
              y2={y}
              stroke="#f0ebe3"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
          );
        })}

        {items.map((d, i) => {
          const v = Number(d[valueKey]) || 0;
          const h = Math.max(4, (v / max) * chartH);
          const x = padX + i * barSlot + (barSlot - barW) / 2;
          const y = padTop + chartH - h;
          const fill = d.color || colors[i % colors.length] || color;
          const label = String(d[labelKey] || `#${i + 1}`);
          const shown = formatValue ? formatValue(v) : String(v);
          // potong label panjang
          const short =
            label.length > 12 ? label.slice(0, 11) + '…' : label;

          return (
            <g key={`${label}-${i}`}>
              {/* batang */}
              <rect
                x={x}
                y={y}
                width={barW}
                height={h}
                rx="6"
                ry="6"
                fill={fill}
              >
                <title>{`${label}: ${shown}`}</title>
              </rect>
              {/* nilai di atas batang */}
              <text
                x={x + barW / 2}
                y={y - 8}
                textAnchor="middle"
                fontSize="10"
                fontWeight="700"
                fill="#333"
              >
                {shown}
              </text>
              {/* label kategori di bawah */}
              <text
                x={x + barW / 2}
                y={padTop + chartH + 16}
                textAnchor="middle"
                fontSize="10"
                fontWeight="600"
                fill="#555"
              >
                {short}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/** Diagram batang horizontal (cadangan) */
export function BarChartHorizontal({
  data = [],
  valueKey = 'value',
  labelKey = 'label',
  height = 180,
  color = '#1a2744',
  formatValue,
}) {
  const items = Array.isArray(data)
    ? data.filter((d) => d && (d[labelKey] || d[valueKey] != null))
    : [];
  const max = Math.max(1, ...items.map((d) => Number(d[valueKey]) || 0));
  if (!items.length) {
    return (
      <p style={{ textAlign: 'center', color: '#888', fontSize: 13, padding: 12 }}>
        Belum ada data grafik.
      </p>
    );
  }
  return (
    <div style={{ minHeight: height }}>
      {items.map((d, i) => {
        const v = Number(d[valueKey]) || 0;
        const pct = Math.max(3, (v / max) * 100);
        const label = d[labelKey] || `#${i + 1}`;
        const shown = formatValue ? formatValue(v) : v;
        return (
          <div
            key={`${label}-${i}`}
            style={{
              display: 'grid',
              gridTemplateColumns: '110px 1fr 80px',
              gap: '0.5rem',
              alignItems: 'center',
              marginBottom: 8,
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: '#444',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
              title={String(label)}
            >
              {label}
            </div>
            <div
              style={{
                height: 14,
                background: '#efe8dc',
                borderRadius: 999,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${pct}%`,
                  height: '100%',
                  background: d.color || color,
                  borderRadius: 999,
                  minWidth: 4,
                }}
              />
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, textAlign: 'right' }}>{shown}</div>
          </div>
        );
      })}
    </div>
  );
}

/** Donut (opsional) */
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
    return (
      <p style={{ textAlign: 'center', color: '#888', fontSize: 13, padding: 12 }}>
        Belum ada data grafik.
      </p>
    );
  }
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16 }}>
      <svg width={size} height={size} viewBox="0 0 140 140">
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
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, fontSize: 12 }}>
        {items.map((d, i) => (
          <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: d.color, flexShrink: 0 }} />
            <span>{d.label}</span>
            <span style={{ color: '#888', marginLeft: 'auto' }}>
              {formatValue ? formatValue(d.value) : d.value}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

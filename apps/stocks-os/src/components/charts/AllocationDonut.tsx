const COLORS = [
  "#38bdf8", "#a78bfa", "#34d399", "#fbbf24",
  "#f87171", "#2dd4bf", "#fb923c", "#f472b6",
];

interface Props {
  data: Record<string, number>;
  total: number;
}

export function AllocationDonut({ data, total }: Props) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0 || total <= 0) return null;

  // Build segment list and conic-gradient string in one pass
  let acc = 0;
  const segments = entries.map(([label, val], i) => {
    const pct = (val / total) * 100;
    const from = acc;
    acc += pct;
    return {
      label,
      pct,
      from,
      to: acc,
      color: COLORS[i % COLORS.length] ?? "#71717a",
    };
  });

  const gradient = segments
    .map(({ color, from, to }) => `${color} ${from.toFixed(1)}% ${to.toFixed(1)}%`)
    .join(", ");

  return (
    <div className="flex items-center gap-4">
      {/* Donut ring */}
      <div className="relative shrink-0" style={{ width: 96, height: 96 }}>
        <div
          className="w-full h-full rounded-full"
          style={{ background: `conic-gradient(${gradient})` }}
        />
        {/* Hole */}
        <div
          className="absolute rounded-full bg-zinc-900"
          style={{
            width: 56,
            height: 56,
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
        />
      </div>

      {/* Legend */}
      <div className="flex flex-col gap-1.5 flex-1 min-w-0">
        {segments.map(({ label, pct, color }) => (
          <div key={label} className="flex items-center gap-1.5 text-xs min-w-0">
            <span
              className="inline-block w-2 h-2 rounded-sm shrink-0"
              style={{ backgroundColor: color }}
            />
            <span className="text-zinc-400 truncate">{label}</span>
            <span className="text-zinc-500 tabular-nums ml-auto shrink-0">{pct.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

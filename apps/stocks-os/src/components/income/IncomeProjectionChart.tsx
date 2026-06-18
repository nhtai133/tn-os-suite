"use client";

interface Props {
  annualIncome: number;
  growthRates?: [number, number, number];
}

const YEARS = [0, 1, 3, 5, 10];
const W = 600;
const H = 260;
const PAD = { top: 20, right: 20, bottom: 36, left: 72 };

function project(base: number, rate: number, year: number) {
  return base * Math.pow(1 + rate, year);
}

export function IncomeProjectionChart({ annualIncome, growthRates = [0.05, 0.10, 0.15] }: Props) {
  const [low, mid, high] = growthRates;

  if (annualIncome <= 0) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 flex items-center justify-center h-48 text-sm text-zinc-500">
        Add dividend records to see income projection
      </div>
    );
  }

  const allValues = YEARS.flatMap((y) => [
    project(annualIncome, low!, y),
    project(annualIncome, high!, y),
  ]);
  const maxVal = Math.max(...allValues);

  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const maxYear = YEARS[YEARS.length - 1] ?? 10;

  function xPx(year: number) {
    return PAD.left + (year / maxYear) * chartW;
  }
  function yPx(val: number) {
    return PAD.top + chartH - (val / maxVal) * chartH;
  }

  function makePath(rate: number) {
    return YEARS.map((y, i) => {
      const x = xPx(y);
      const v = project(annualIncome, rate, y);
      const y2 = yPx(v);
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y2.toFixed(1)}`;
    }).join(" ");
  }

  function bandPath() {
    const forward = YEARS.map((y) => {
      const x = xPx(y);
      const v = project(annualIncome, high!, y);
      return `${x.toFixed(1)},${yPx(v).toFixed(1)}`;
    });
    const backward = [...YEARS].reverse().map((y) => {
      const x = xPx(y);
      const v = project(annualIncome, low!, y);
      return `${x.toFixed(1)},${yPx(v).toFixed(1)}`;
    });
    return `M ${forward.join(" L ")} L ${backward.join(" L ")} Z`;
  }

  const USD = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);

  const yTicks = 5;
  const tickVals = Array.from({ length: yTicks + 1 }, (_, i) => (maxVal / yTicks) * i);

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
      <div className="text-xs text-zinc-500 mb-3 flex items-center gap-4">
        <span>Income Projection (Annual)</span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-0.5 bg-zinc-600 rounded" />
          5%
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-0.5 bg-emerald-500 rounded" />
          10%
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-0.5 bg-sky-400 rounded" />
          15%
        </span>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ height: H }}
        aria-hidden="true"
      >
        {/* band */}
        <path d={bandPath()} fill="rgba(16,185,129,0.06)" />

        {/* y-axis gridlines + labels */}
        {tickVals.map((v, i) => {
          const y = yPx(v);
          return (
            <g key={i}>
              <line x1={PAD.left} x2={W - PAD.right} y1={y} y2={y} stroke="#27272a" strokeWidth={1} />
              <text x={PAD.left - 6} y={y + 4} textAnchor="end" fontSize={10} fill="#71717a">
                {USD(v)}
              </text>
            </g>
          );
        })}

        {/* x-axis labels */}
        {YEARS.map((yr) => (
          <text key={yr} x={xPx(yr)} y={H - 6} textAnchor="middle" fontSize={10} fill="#71717a">
            Y{yr}
          </text>
        ))}

        {/* scenario lines */}
        <path d={makePath(low!)} fill="none" stroke="#52525b" strokeWidth={1.5} strokeDasharray="4 3" />
        <path d={makePath(mid!)} fill="none" stroke="#10b981" strokeWidth={2} />
        <path d={makePath(high!)} fill="none" stroke="#38bdf8" strokeWidth={1.5} strokeDasharray="4 3" />
      </svg>
    </div>
  );
}

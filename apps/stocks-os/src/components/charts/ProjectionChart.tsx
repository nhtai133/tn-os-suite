import { calculateProjectedValue } from "@/lib/portfolio-metrics";

const YEARS = [0, 1, 3, 5, 10, 15, 20];
const YEAR_LABELS = ["Now", "1Y", "3Y", "5Y", "10Y", "15Y", "20Y"];
const MAX_YEAR = 20;

const SCENARIOS = [
  { label: "Conservative", rate: 8,  stroke: "#71717a", dash: "5 3",  weight: 1.5, opacity: 0.7 },
  { label: "Base",         rate: 12, stroke: "#38bdf8", dash: "",     weight: 2,   opacity: 1   },
  { label: "Optimistic",   rate: 18, stroke: "#34d399", dash: "2 2",  weight: 1.5, opacity: 0.7 },
];

const VB_W = 560;
const VB_H = 240;
const PL = 68;
const PR = 24;
const PT = 20;
const PB = 40;
const CW = VB_W - PL - PR;
const CH = VB_H - PT - PB;

interface Props {
  investedCapital: number;
  currentValue: number;
  monthlyContribution: number;
}

function axisLabel(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

export function ProjectionChart({ investedCapital, currentValue, monthlyContribution }: Props) {
  if (investedCapital <= 0) return null;

  const startValue = currentValue > 0 ? currentValue : investedCapital;

  const scenarioValues = SCENARIOS.map(({ rate }) =>
    YEARS.map((yr) =>
      yr === 0
        ? startValue
        : calculateProjectedValue(investedCapital, monthlyContribution, rate, yr)
    )
  );

  const allVals = scenarioValues.flat();
  const maxVal = Math.max(...allVals, investedCapital * 1.05);
  const minVal = 0;
  const range = maxVal - minVal || 1;

  // Time-proportional x, value-proportional y (inverted)
  const xAt = (yr: number) => PL + (yr / MAX_YEAR) * CW;
  const yAt = (v: number) => PT + CH - ((v - minVal) / range) * CH;

  const makePath = (values: number[]): string =>
    YEARS.map((yr, i) => `${i === 0 ? "M" : "L"}${xAt(yr).toFixed(1)},${yAt(values[i] ?? 0).toFixed(1)}`).join(" ");

  // Shaded band between conservative (index 0) and optimistic (index 2)
  const conVals = scenarioValues[0] ?? [];
  const optVals = scenarioValues[2] ?? [];
  const bandPath = [
    ...YEARS.map((yr, i) => `${i === 0 ? "M" : "L"}${xAt(yr).toFixed(1)},${yAt(optVals[i] ?? 0).toFixed(1)}`),
    ...[...YEARS].reverse().map((yr, ri) => {
      const origI = YEARS.length - 1 - ri;
      return `L${xAt(yr).toFixed(1)},${yAt(conVals[origI] ?? 0).toFixed(1)}`;
    }),
    "Z",
  ].join(" ");

  const baseVals = scenarioValues[1] ?? [];
  const gridTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => minVal + range * f);

  return (
    <div>
      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        className="w-full"
        style={{ maxHeight: 280 }}
        role="img"
        aria-label="Portfolio equity projection"
      >
        {/* Y-axis grid lines + labels */}
        {gridTicks.map((v, i) => {
          const y = yAt(v);
          return (
            <g key={i}>
              <line x1={PL} y1={y} x2={VB_W - PR} y2={y} stroke="#27272a" strokeWidth="1" />
              <text x={PL - 6} y={y + 3.5} textAnchor="end" fontSize="9" fill="#52525b">
                {axisLabel(v)}
              </text>
            </g>
          );
        })}

        {/* X-axis tick marks */}
        {YEARS.map((yr) => (
          <line
            key={yr}
            x1={xAt(yr)} y1={PT + CH} x2={xAt(yr)} y2={PT + CH + 5}
            stroke="#3f3f46" strokeWidth="1"
          />
        ))}

        {/* X-axis labels */}
        {YEARS.map((yr, i) => (
          <text key={yr} x={xAt(yr)} y={VB_H - 8} textAnchor="middle" fontSize="9" fill="#52525b">
            {YEAR_LABELS[i] ?? ""}
          </text>
        ))}

        {/* Shaded confidence band */}
        <path d={bandPath} fill="#38bdf8" fillOpacity="0.06" />

        {/* Scenario lines */}
        {SCENARIOS.map(({ rate, stroke, dash, weight, opacity }, si) => (
          <path
            key={rate}
            d={makePath(scenarioValues[si] ?? [])}
            fill="none"
            stroke={stroke}
            strokeWidth={weight}
            strokeDasharray={dash || undefined}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={opacity}
          />
        ))}

        {/* Dots on base line */}
        {baseVals.map((v, i) => (
          <circle key={i} cx={xAt(YEARS[i] ?? 0)} cy={yAt(v)} r="2.5" fill="#38bdf8" />
        ))}

        {/* Today marker (highlighted) */}
        <circle
          cx={xAt(0)} cy={yAt(baseVals[0] ?? startValue)} r="4"
          fill="#38bdf8" stroke="#082f49" strokeWidth="2"
        />

        {/* Invested capital reference line (if different from current value) */}
        {Math.abs(investedCapital - startValue) > 1 && (
          <line
            x1={PL} y1={yAt(investedCapital)} x2={VB_W - PR} y2={yAt(investedCapital)}
            stroke="#3f3f46" strokeWidth="1" strokeDasharray="3 3"
          />
        )}
      </svg>

      {/* Legend */}
      <div className="flex gap-5 mt-2 flex-wrap">
        {SCENARIOS.map(({ label, rate, stroke }) => (
          <div key={label} className="flex items-center gap-1.5 text-xs text-zinc-500">
            <span className="inline-block rounded-full" style={{ backgroundColor: stroke, width: 20, height: 2 }} />
            {label} ({rate}%)
          </div>
        ))}
      </div>
    </div>
  );
}

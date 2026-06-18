interface Props {
  label: string;
  value: string;
  sub?: string;
  valueColor?: string;
}

export function IncomeCard({ label, value, sub, valueColor = "text-emerald-400" }: Props) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
      <div className="text-xs text-zinc-500 mb-1">{label}</div>
      <div className={`text-lg font-semibold ${valueColor}`}>{value}</div>
      {sub && <div className="text-xs text-zinc-600 mt-0.5">{sub}</div>}
    </div>
  );
}

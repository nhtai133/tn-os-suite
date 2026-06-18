import type { ReviewCheckItem } from "@/lib/cio-engine";

const TYPE_LABEL: Record<ReviewCheckItem["type"], string> = {
  thesis:    "Thesis",
  watchlist: "Watchlist",
  dividend:  "Dividend",
};
const TYPE_COLOR: Record<ReviewCheckItem["type"], string> = {
  thesis:    "text-sky-400",
  watchlist: "text-emerald-400",
  dividend:  "text-amber-400",
};

interface Props {
  items: ReviewCheckItem[];
}

export function ReviewChecklist({ items }: Props) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-5 py-4 text-sm text-zinc-500">
        Nothing to review right now. All clear.
      </div>
    );
  }

  const urgent = items.filter((i) => i.urgent);
  const normal = items.filter((i) => !i.urgent);
  const ordered = [...urgent, ...normal];

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-800 text-zinc-500 text-xs uppercase tracking-wide">
            <th className="px-4 py-3 text-left">Symbol</th>
            <th className="px-4 py-3 text-left">Type</th>
            <th className="px-4 py-3 text-left">Action Needed</th>
            <th className="px-4 py-3 text-left">Priority</th>
          </tr>
        </thead>
        <tbody>
          {ordered.map((item, i) => (
            <tr key={i} className={`border-b border-zinc-800/60 hover:bg-zinc-800/30 transition-colors ${item.urgent ? "bg-amber-900/10" : ""}`}>
              <td className="px-4 py-3 font-medium text-white">{item.symbol}</td>
              <td className="px-4 py-3">
                <span className={`text-xs ${TYPE_COLOR[item.type]}`}>{TYPE_LABEL[item.type]}</span>
              </td>
              <td className="px-4 py-3 text-zinc-400 text-xs">{item.detail}</td>
              <td className="px-4 py-3">
                {item.urgent ? (
                  <span className="text-xs text-amber-400 font-medium">Urgent</span>
                ) : (
                  <span className="text-xs text-zinc-600">Normal</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

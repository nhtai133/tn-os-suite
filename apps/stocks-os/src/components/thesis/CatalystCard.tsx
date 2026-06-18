import type { CompanyThesis } from "@/lib/thesis-types";

interface Props {
  thesis: CompanyThesis;
  onEdit?: (t: CompanyThesis) => void;
}

export function CatalystCard({ thesis, onEdit }: Props) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-4 space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-bold text-white">{thesis.symbol}</span>
        {thesis.companyName && <span className="text-xs text-zinc-500">{thesis.companyName}</span>}
      </div>

      {thesis.catalysts ? (
        <div className="text-sm text-zinc-300 leading-relaxed whitespace-pre-line">{thesis.catalysts}</div>
      ) : (
        <div className="text-xs text-zinc-600 italic">No catalysts documented</div>
      )}

      {onEdit && (
        <button onClick={() => onEdit(thesis)} className="text-xs text-sky-400 hover:text-sky-300 transition-colors">
          Edit →
        </button>
      )}
    </div>
  );
}

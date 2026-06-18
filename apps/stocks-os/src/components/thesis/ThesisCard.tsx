import type { CompanyThesis } from "@/lib/thesis-types";

interface Props {
  thesis: CompanyThesis;
  onEdit?: (t: CompanyThesis) => void;
  onDelete?: (id: string) => void;
}

export function ThesisCard({ thesis, onEdit, onDelete }: Props) {
  const isDue =
    thesis.nextReviewDate != null &&
    thesis.nextReviewDate <= new Date().toISOString().split("T")[0]!;

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-5 py-4 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-white text-base">{thesis.symbol}</span>
            {thesis.companyName && (
              <span className="text-xs text-zinc-500">{thesis.companyName}</span>
            )}
          </div>
          {thesis.sector && <div className="text-xs text-zinc-600 mt-0.5">{thesis.sector}</div>}
        </div>
        {isDue && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-400 shrink-0">
            Review Due
          </span>
        )}
      </div>

      {/* Why Buy */}
      {thesis.whyBuy && (
        <div>
          <div className="text-[10px] text-zinc-600 uppercase tracking-widest mb-1">Why Buy</div>
          <div className="text-sm text-zinc-300 leading-relaxed">{thesis.whyBuy}</div>
        </div>
      )}

      {/* Exit Rule */}
      {thesis.exitRule && (
        <div>
          <div className="text-[10px] text-zinc-600 uppercase tracking-widest mb-1">Exit Rule</div>
          <div className="text-sm text-zinc-400 leading-relaxed">{thesis.exitRule}</div>
        </div>
      )}

      {/* Review */}
      {(thesis.reviewFrequency || thesis.nextReviewDate) && (
        <div className="flex items-center gap-3 text-xs text-zinc-500">
          {thesis.reviewFrequency && <span>Review: {thesis.reviewFrequency}</span>}
          {thesis.nextReviewDate && (
            <span className={isDue ? "text-amber-400" : ""}>
              Next: {thesis.nextReviewDate}
            </span>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-1 text-xs">
        {onEdit && (
          <button onClick={() => onEdit(thesis)} className="text-sky-400 hover:text-sky-300 transition-colors">
            Edit
          </button>
        )}
        {onDelete && (
          <button onClick={() => onDelete(thesis.id)} className="text-zinc-600 hover:text-red-400 transition-colors">
            Delete
          </button>
        )}
      </div>
    </div>
  );
}

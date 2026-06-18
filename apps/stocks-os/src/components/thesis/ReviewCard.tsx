import type { CompanyThesis } from "@/lib/thesis-types";

interface Props {
  thesis: CompanyThesis;
  onEdit?: (t: CompanyThesis) => void;
}

export function ReviewCard({ thesis, onEdit }: Props) {
  const today = new Date().toISOString().split("T")[0]!;
  const isDue = thesis.nextReviewDate != null && thesis.nextReviewDate <= today;
  const daysUntil = thesis.nextReviewDate
    ? Math.ceil(
        (new Date(thesis.nextReviewDate).getTime() - new Date(today).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : null;

  return (
    <div className={`rounded-xl border px-4 py-4 space-y-2 ${
      isDue ? "border-amber-500/40 bg-amber-500/5" : "border-zinc-800 bg-zinc-900/40"
    }`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-bold text-white">{thesis.symbol}</div>
          {thesis.companyName && <div className="text-xs text-zinc-500">{thesis.companyName}</div>}
        </div>
        {isDue && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400/15 text-amber-400 shrink-0 font-medium">
            OVERDUE
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <div className="text-zinc-600 mb-0.5">Frequency</div>
          <div className="text-zinc-300">{thesis.reviewFrequency ?? "Not set"}</div>
        </div>
        <div>
          <div className="text-zinc-600 mb-0.5">Next Review</div>
          <div className={isDue ? "text-amber-400 font-medium" : "text-zinc-300"}>
            {thesis.nextReviewDate ?? "Not set"}
          </div>
        </div>
        {daysUntil != null && (
          <div className="col-span-2">
            <div className={`text-xs ${isDue ? "text-amber-400" : daysUntil <= 14 ? "text-yellow-400" : "text-zinc-500"}`}>
              {isDue
                ? `${Math.abs(daysUntil)} day${Math.abs(daysUntil) !== 1 ? "s" : ""} overdue`
                : `In ${daysUntil} day${daysUntil !== 1 ? "s" : ""}`}
            </div>
          </div>
        )}
      </div>

      {onEdit && (
        <button onClick={() => onEdit(thesis)} className="text-xs text-sky-400 hover:text-sky-300 transition-colors">
          Update Review →
        </button>
      )}
    </div>
  );
}

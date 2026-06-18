"use client";

import { useState } from "react";
import { useThesisStore } from "@/store/useThesisStore";
import type { CompanyThesis, ReviewFrequency } from "@/lib/thesis-types";
import { ThesisCard } from "@/components/thesis/ThesisCard";
import { CatalystCard } from "@/components/thesis/CatalystCard";
import { RiskCard } from "@/components/thesis/RiskCard";
import { ReviewCard } from "@/components/thesis/ReviewCard";

const TABS = ["Thesis", "Catalysts", "Risks", "Exit Rules", "Review Schedule"] as const;
type Tab = (typeof TABS)[number];

const FREQUENCIES: ReviewFrequency[] = ["Monthly", "Quarterly", "Semi-Annual", "Annual"];

type FormState = {
  symbol: string;
  companyName: string;
  sector: string;
  whyBuy: string;
  risks: string;
  catalysts: string;
  valuationNotes: string;
  dividendPolicy: string;
  exitRule: string;
  reviewFrequency: ReviewFrequency | "";
  nextReviewDate: string;
  notes: string;
};

function emptyForm(): FormState {
  return {
    symbol: "", companyName: "", sector: "",
    whyBuy: "", risks: "", catalysts: "",
    valuationNotes: "", dividendPolicy: "", exitRule: "",
    reviewFrequency: "Quarterly", nextReviewDate: "", notes: "",
  };
}

function formToThesis(form: FormState): Omit<CompanyThesis, "id" | "createdAt" | "updatedAt"> {
  return {
    symbol: form.symbol.toUpperCase().trim(),
    companyName: form.companyName.trim() || undefined,
    sector: form.sector.trim() || undefined,
    whyBuy: form.whyBuy.trim() || undefined,
    risks: form.risks.trim() || undefined,
    catalysts: form.catalysts.trim() || undefined,
    valuationNotes: form.valuationNotes.trim() || undefined,
    dividendPolicy: form.dividendPolicy.trim() || undefined,
    exitRule: form.exitRule.trim() || undefined,
    reviewFrequency: form.reviewFrequency || undefined,
    nextReviewDate: form.nextReviewDate || undefined,
    notes: form.notes.trim() || undefined,
  };
}

function thesisToForm(t: CompanyThesis): FormState {
  return {
    symbol: t.symbol,
    companyName: t.companyName ?? "",
    sector: t.sector ?? "",
    whyBuy: t.whyBuy ?? "",
    risks: t.risks ?? "",
    catalysts: t.catalysts ?? "",
    valuationNotes: t.valuationNotes ?? "",
    dividendPolicy: t.dividendPolicy ?? "",
    exitRule: t.exitRule ?? "",
    reviewFrequency: t.reviewFrequency ?? "Quarterly",
    nextReviewDate: t.nextReviewDate ?? "",
    notes: t.notes ?? "",
  };
}

export default function ThesisPage() {
  const store = useThesisStore();
  const [tab, setTab] = useState<Tab>("Thesis");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CompanyThesis | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());

  if (!store.hydrated) {
    return <div className="p-8 text-zinc-600 animate-pulse">Loading...</div>;
  }

  const { theses, addThesis, updateThesis, deleteThesis, getDueForReview } = store;

  const openAdd = () => { setEditing(null); setForm(emptyForm()); setModalOpen(true); };
  const openEdit = (t: CompanyThesis) => { setEditing(t); setForm(thesisToForm(t)); setModalOpen(true); };
  const closeModal = () => setModalOpen(false);

  const handleSubmit = (ev: React.FormEvent) => {
    ev.preventDefault();
    const payload = formToThesis(form);
    if (editing) updateThesis({ ...payload, id: editing.id, createdAt: editing.createdAt, updatedAt: editing.updatedAt });
    else addThesis(payload);
    closeModal();
  };

  const set = (key: keyof FormState, val: string) =>
    setForm((f) => ({ ...f, [key]: val }));

  const filtered = search
    ? theses.filter(
        (t) =>
          t.symbol.includes(search.toUpperCase()) ||
          (t.companyName ?? "").toLowerCase().includes(search.toLowerCase()) ||
          (t.sector ?? "").toLowerCase().includes(search.toLowerCase())
      )
    : theses;

  const dueForReview = getDueForReview();

  // Exit rules: theses that have exitRule defined
  const withExitRule = theses.filter((t) => t.exitRule);

  // Review schedule: sorted by nextReviewDate
  const reviewSorted = [...theses]
    .filter((t) => t.nextReviewDate)
    .sort((a, b) => (a.nextReviewDate ?? "").localeCompare(b.nextReviewDate ?? ""));
  const noReviewDate = theses.filter((t) => !t.nextReviewDate);

  return (
    <div className="p-8 space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Company Thesis</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Investment thesis · Catalysts · Risks · Exit rules</p>
        </div>
        <button
          onClick={openAdd}
          className="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-white text-sm font-medium transition-colors"
        >
          + Add Thesis
        </button>
      </div>

      {/* Stats + Due Alert */}
      {dueForReview.length > 0 && (
        <div
          className="rounded-lg bg-amber-500/10 border border-amber-500/30 px-4 py-3 text-sm text-amber-400 cursor-pointer"
          onClick={() => setTab("Review Schedule")}
        >
          ⚠ {dueForReview.length} thesis review{dueForReview.length !== 1 ? "es" : ""} due — click to view
        </div>
      )}

      <div className="flex items-center gap-4 text-xs text-zinc-500">
        <span>{theses.length} theses</span>
        <span>·</span>
        <span>{theses.filter((t) => t.catalysts).length} with catalysts</span>
        <span>·</span>
        <span>{theses.filter((t) => t.risks).length} with risks</span>
        <span>·</span>
        <span>{withExitRule.length} with exit rules</span>
      </div>

      {/* Tab Nav */}
      <div className="flex gap-1 border-b border-zinc-800">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap ${
              tab === t ? "border-sky-500 text-sky-400" : "border-transparent text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {t}
            {t === "Review Schedule" && dueForReview.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-amber-400/20 text-amber-400 text-[10px]">
                {dueForReview.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search */}
      {(tab === "Thesis" || tab === "Catalysts" || tab === "Risks") && (
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search symbol, company, sector..."
          className="w-full max-w-sm rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-sky-500"
        />
      )}

      {/* ── Thesis Tab ── */}
      {tab === "Thesis" && (
        <>
          {filtered.length === 0 ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-6 py-12 text-center text-sm text-zinc-500">
              {theses.length === 0
                ? "No theses yet. Click + Add Thesis to document your first investment thesis."
                : "No results for your search."}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filtered.map((t) => (
                <ThesisCard key={t.id} thesis={t} onEdit={openEdit} onDelete={deleteThesis} />
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Catalysts Tab ── */}
      {tab === "Catalysts" && (
        <>
          {filtered.length === 0 ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-6 py-12 text-center text-sm text-zinc-500">
              No theses match.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filtered.map((t) => (
                <CatalystCard key={t.id} thesis={t} onEdit={openEdit} />
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Risks Tab ── */}
      {tab === "Risks" && (
        <>
          {filtered.length === 0 ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-6 py-12 text-center text-sm text-zinc-500">
              No theses match.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filtered.map((t) => (
                <RiskCard key={t.id} thesis={t} onEdit={openEdit} />
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Exit Rules Tab ── */}
      {tab === "Exit Rules" && (
        <div className="space-y-3">
          {withExitRule.length === 0 ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-6 py-12 text-center text-sm text-zinc-500">
              No exit rules documented. Edit a thesis to add an exit rule.
            </div>
          ) : (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-500 text-xs uppercase tracking-wide">
                    <th className="px-4 py-3 text-left">Symbol</th>
                    <th className="px-4 py-3 text-left">Company</th>
                    <th className="px-4 py-3 text-left">Exit Rule</th>
                    <th className="px-4 py-3 text-right" />
                  </tr>
                </thead>
                <tbody>
                  {withExitRule.map((t) => (
                    <tr key={t.id} className="border-b border-zinc-800/60 hover:bg-zinc-800/30 transition-colors">
                      <td className="px-4 py-3 font-medium text-white">{t.symbol}</td>
                      <td className="px-4 py-3 text-zinc-400 text-xs">{t.companyName ?? "—"}</td>
                      <td className="px-4 py-3 text-zinc-300 text-xs leading-relaxed max-w-sm">{t.exitRule}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => openEdit(t)}
                          className="text-xs text-sky-400 hover:text-sky-300 transition-colors"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Theses without exit rules */}
          {theses.filter((t) => !t.exitRule).length > 0 && (
            <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/20 px-4 py-3">
              <div className="text-xs text-zinc-600 mb-2">Missing exit rules ({theses.filter((t) => !t.exitRule).length})</div>
              <div className="flex flex-wrap gap-2">
                {theses.filter((t) => !t.exitRule).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => openEdit(t)}
                    className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-500 hover:text-sky-400 hover:bg-zinc-700 transition-colors"
                  >
                    {t.symbol}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Review Schedule Tab ── */}
      {tab === "Review Schedule" && (
        <div className="space-y-4">
          {dueForReview.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-amber-400 uppercase tracking-widest mb-2">Overdue</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {dueForReview.map((t) => (
                  <ReviewCard key={t.id} thesis={t} onEdit={openEdit} />
                ))}
              </div>
            </div>
          )}

          {reviewSorted.filter((t) => !dueForReview.find((d) => d.id === t.id)).length > 0 && (
            <div>
              <div className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-2">Upcoming</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {reviewSorted
                  .filter((t) => !dueForReview.find((d) => d.id === t.id))
                  .map((t) => (
                    <ReviewCard key={t.id} thesis={t} onEdit={openEdit} />
                  ))}
              </div>
            </div>
          )}

          {noReviewDate.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-zinc-600 uppercase tracking-widest mb-2">No Review Date</div>
              <div className="flex flex-wrap gap-2">
                {noReviewDate.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => openEdit(t)}
                    className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-500 hover:text-sky-400 hover:bg-zinc-700 transition-colors"
                  >
                    {t.symbol}
                  </button>
                ))}
              </div>
            </div>
          )}

          {theses.length === 0 && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-6 py-12 text-center text-sm text-zinc-500">
              No theses yet.
            </div>
          )}
        </div>
      )}

      {/* ── Add/Edit Modal ── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl overflow-y-auto max-h-[90vh]">
            <div className="px-6 py-5 border-b border-zinc-800 flex items-center justify-between">
              <h2 className="text-base font-semibold text-white">
                {editing ? `Edit Thesis — ${editing.symbol}` : "Add Thesis"}
              </h2>
              <button onClick={closeModal} className="text-zinc-500 hover:text-zinc-300 text-lg">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-400 mb-1 block">Symbol *</label>
                  <input
                    required
                    value={form.symbol}
                    onChange={(e) => set("symbol", e.target.value)}
                    placeholder="VCB"
                    className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 mb-1 block">Company Name</label>
                  <input
                    value={form.companyName}
                    onChange={(e) => set("companyName", e.target.value)}
                    placeholder="Vietcombank"
                    className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 mb-1 block">Sector</label>
                  <input
                    value={form.sector}
                    onChange={(e) => set("sector", e.target.value)}
                    placeholder="Banking"
                    className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 mb-1 block">Review Frequency</label>
                  <select
                    value={form.reviewFrequency}
                    onChange={(e) => set("reviewFrequency", e.target.value)}
                    className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                  >
                    <option value="">— None —</option>
                    {FREQUENCIES.map((f) => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-zinc-400 mb-1 block">Next Review Date</label>
                  <input
                    type="date"
                    value={form.nextReviewDate}
                    onChange={(e) => set("nextReviewDate", e.target.value)}
                    className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-zinc-400 mb-1 block">Why Buy</label>
                  <textarea rows={3} value={form.whyBuy} onChange={(e) => set("whyBuy", e.target.value)}
                    placeholder="Core investment thesis..."
                    className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500 resize-none" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-zinc-400 mb-1 block">Catalysts</label>
                  <textarea rows={2} value={form.catalysts} onChange={(e) => set("catalysts", e.target.value)}
                    placeholder="Near-term catalysts..."
                    className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500 resize-none" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-zinc-400 mb-1 block">Risks</label>
                  <textarea rows={2} value={form.risks} onChange={(e) => set("risks", e.target.value)}
                    placeholder="Key risks and mitigants..."
                    className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500 resize-none" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-zinc-400 mb-1 block">Exit Rule</label>
                  <textarea rows={2} value={form.exitRule} onChange={(e) => set("exitRule", e.target.value)}
                    placeholder="Sell when thesis is broken, target hit, or..."
                    className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500 resize-none" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-zinc-400 mb-1 block">Valuation Notes</label>
                  <textarea rows={2} value={form.valuationNotes} onChange={(e) => set("valuationNotes", e.target.value)}
                    placeholder="P/E, P/B, DCF assumptions..."
                    className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500 resize-none" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-zinc-400 mb-1 block">Dividend Policy</label>
                  <input value={form.dividendPolicy} onChange={(e) => set("dividendPolicy", e.target.value)}
                    placeholder="Annual 10% stock dividend..."
                    className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-zinc-400 mb-1 block">Notes</label>
                  <textarea rows={2} value={form.notes} onChange={(e) => set("notes", e.target.value)}
                    placeholder="Miscellaneous notes..."
                    className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500 resize-none" />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit"
                  className="px-5 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-white text-sm font-medium transition-colors">
                  {editing ? "Save Changes" : "Add Thesis"}
                </button>
                <button type="button" onClick={closeModal}
                  className="px-5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

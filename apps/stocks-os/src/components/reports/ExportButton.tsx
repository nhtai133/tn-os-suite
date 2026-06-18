"use client";

interface Props {
  label: string;
  format: "csv" | "json";
  onClick: () => void;
  disabled?: boolean;
}

const FORMAT_STYLES = {
  csv:  "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  json: "bg-sky-500/10    text-sky-400    border-sky-500/30",
};

export function ExportButton({ label, format, onClick, disabled = false }: Props) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-zinc-700 bg-zinc-800/60 text-sm text-zinc-300 hover:bg-zinc-700/60 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
    >
      <span
        className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase border ${FORMAT_STYLES[format]}`}
      >
        {format}
      </span>
      {label}
    </button>
  );
}

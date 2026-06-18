interface Props {
  headers: string[];
  rows: string[][];
  errors: Record<number, string>;
  duplicates: Set<number>;
}

export function ImportPreviewTable({ headers, rows, errors, duplicates }: Props) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-6 py-8 text-center text-sm text-zinc-500">
        No rows to preview
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-auto max-h-80">
      <table className="w-full text-xs whitespace-nowrap">
        <thead>
          <tr className="border-b border-zinc-800 text-zinc-500 uppercase tracking-wide sticky top-0 bg-zinc-900">
            <th className="px-3 py-2 text-left w-8">#</th>
            {headers.map((h) => (
              <th key={h} className="px-3 py-2 text-left">{h}</th>
            ))}
            <th className="px-3 py-2 text-left">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const hasError = !!errors[i];
            const isDupe = duplicates.has(i);
            return (
              <tr
                key={i}
                className={`border-b border-zinc-800/50 ${
                  hasError ? "bg-red-900/10" : isDupe ? "bg-amber-900/10" : "hover:bg-zinc-800/20"
                }`}
              >
                <td className="px-3 py-2 text-zinc-600">{i + 1}</td>
                {headers.map((_, j) => (
                  <td key={j} className="px-3 py-2 text-zinc-300">{row[j] ?? ""}</td>
                ))}
                <td className="px-3 py-2">
                  {hasError ? (
                    <span className="text-red-400">{errors[i]}</span>
                  ) : isDupe ? (
                    <span className="text-amber-400">Duplicate</span>
                  ) : (
                    <span className="text-emerald-400">OK</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

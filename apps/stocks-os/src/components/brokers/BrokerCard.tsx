import type { BrokerAccount } from "@/lib/broker-types";

const VND = (n: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(n);
const USD = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(n);
function fmt(n: number, c: "VND" | "USD") { return c === "VND" ? VND(n) : USD(n); }

interface Props {
  account: BrokerAccount;
  holdingCount?: number;
  holdingValue?: number;
  dividendIncome?: number;
  onEdit?: (a: BrokerAccount) => void;
}

export function BrokerCard({ account, holdingCount = 0, holdingValue = 0, dividendIncome = 0, onEdit }: Props) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-5 py-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="font-bold text-white text-base">{account.name}</div>
        <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">{account.currency}</span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-lg bg-zinc-800/60 px-3 py-2">
          <div className="text-zinc-500 mb-0.5">Cash</div>
          <div className="text-white font-medium">{fmt(account.cash, account.currency)}</div>
        </div>
        <div className="rounded-lg bg-zinc-800/60 px-3 py-2">
          <div className="text-zinc-500 mb-0.5">Holdings Value</div>
          <div className="text-sky-400 font-medium">{fmt(holdingValue, account.currency)}</div>
        </div>
        <div className="rounded-lg bg-zinc-800/60 px-3 py-2">
          <div className="text-zinc-500 mb-0.5">Symbols</div>
          <div className="text-zinc-200">{holdingCount}</div>
        </div>
        <div className="rounded-lg bg-zinc-800/60 px-3 py-2">
          <div className="text-zinc-500 mb-0.5">Dividends</div>
          <div className="text-emerald-400">{fmt(dividendIncome, account.currency)}</div>
        </div>
      </div>

      {(account.fees != null || account.taxes != null) && (
        <div className="flex gap-4 text-xs text-zinc-500">
          {account.fees != null && <span>Fees: {fmt(account.fees, account.currency)}</span>}
          {account.taxes != null && <span>Taxes: {fmt(account.taxes, account.currency)}</span>}
        </div>
      )}

      {account.notes && <div className="text-xs text-zinc-600">{account.notes}</div>}

      {onEdit && (
        <button onClick={() => onEdit(account)} className="text-xs text-sky-400 hover:text-sky-300 transition-colors">
          Edit →
        </button>
      )}
    </div>
  );
}

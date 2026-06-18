"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { label: "Dashboard", suffix: "" },
  { label: "Holdings", suffix: "/holdings" },
  { label: "Allocation", suffix: "/allocation" },
  { label: "Performance", suffix: "/performance" },
];

interface Props {
  portfolioId: string;
}

export function PortfolioTabNav({ portfolioId }: Props) {
  const pathname = usePathname();
  const base = `/portfolios/${portfolioId}`;

  return (
    <div className="flex gap-1 px-8 py-2 border-b border-zinc-800 bg-zinc-950/60">
      {TABS.map(({ label, suffix }) => {
        const href = `${base}${suffix}`;
        const active = suffix === "" ? pathname === base : pathname.startsWith(href);
        return (
          <Link
            key={label}
            href={href}
            className={`px-4 py-2 text-sm rounded-lg transition-colors ${
              active
                ? "bg-sky-500/10 text-sky-400 font-medium"
                : "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/50"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </div>
  );
}

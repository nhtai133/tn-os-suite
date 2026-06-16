"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { section: "Overview", items: [{ href: "/dashboard", label: "Dashboard" }] },
  {
    section: "Portfolio",
    items: [
      { href: "/holdings", label: "Holdings" },
      { href: "/watchlist", label: "Watchlist" },
      { href: "/targets", label: "Target Positions" },
    ],
  },
  {
    section: "Analysis",
    items: [
      { href: "/valuation", label: "Valuation Notes" },
      { href: "/thesis", label: "Company Thesis" },
      { href: "/buy-zones", label: "Buy Zones" },
      { href: "/sell-rules", label: "Sell Rules" },
    ],
  },
  {
    section: "Income",
    items: [{ href: "/dividends", label: "Dividends" }],
  },
  {
    section: "System",
    items: [
      { href: "/export", label: "Export Snapshot" },
      { href: "/settings", label: "Settings" },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 shrink-0 border-r border-zinc-800 bg-zinc-950 flex flex-col h-screen sticky top-0">
      <div className="px-4 py-5 border-b border-zinc-800">
        <div className="text-xs text-sky-500 font-semibold uppercase tracking-widest mb-0.5">TN OS Suite</div>
        <div className="text-sm font-bold text-white">Stocks OS</div>
        <div className="text-xs text-zinc-600 mt-0.5">port 3006</div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {NAV.map(({ section, items }) => (
          <div key={section}>
            <div className="text-[10px] font-semibold text-zinc-600 uppercase tracking-widest px-2 mb-1.5">{section}</div>
            <ul className="space-y-0.5">
              {items.map(({ href, label }) => {
                const active = pathname === href || (href !== "/" && pathname.startsWith(href));
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors ${
                        active
                          ? "bg-sky-500/10 text-sky-400 font-medium"
                          : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60"
                      }`}
                    >
                      {label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="px-4 py-3 border-t border-zinc-800">
        <div className="text-xs text-zinc-600">📈 TNPA Stock Portfolio</div>
      </div>
    </aside>
  );
}

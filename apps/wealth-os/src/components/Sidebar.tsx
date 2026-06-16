"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: "◈" },
  { href: "/bank-accounts", label: "Bank Accounts", icon: "🏦" },
  { href: "/real-estate", label: "Real Estate", icon: "🏠" },
  { href: "/vehicles", label: "Vehicles", icon: "🚗" },
  { href: "/liabilities", label: "Liabilities", icon: "📉" },
  { href: "/emergency-fund", label: "Emergency Fund", icon: "🛡" },
  { href: "/family-support", label: "Family Support", icon: "👨‍👩‍👦" },
  { href: "/net-worth", label: "Net Worth History", icon: "📈" },
  { href: "/export", label: "Export Snapshot", icon: "↗" },
  { href: "/settings", label: "Settings", icon: "⚙" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 shrink-0 bg-zinc-950 border-r border-zinc-800 flex flex-col min-h-screen">
      <div className="p-5 border-b border-zinc-800">
        <div className="text-xs text-zinc-600 uppercase tracking-widest mb-0.5">TN OS Suite</div>
        <div className="text-base font-bold text-white">Wealth OS</div>
        <div className="text-xs text-zinc-500 mt-0.5">Net worth & asset tracker</div>
      </div>
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {nav.map((item) => {
          const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href + "/"));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                active
                  ? "bg-emerald-600/15 text-emerald-400 font-medium"
                  : "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/60"
              }`}
            >
              <span className="text-base w-5 text-center leading-none">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-zinc-800">
        <div className="text-xs text-zinc-600">v0.1.0 · Local-first</div>
      </div>
    </aside>
  );
}

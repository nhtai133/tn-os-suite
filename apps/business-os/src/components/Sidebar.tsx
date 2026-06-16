"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  { section: "Overview", items: [
    { href: "/dashboard", label: "Dashboard", icon: "◈" },
    { href: "/pnl", label: "Monthly P&L", icon: "📊" },
  ]},
  { section: "Revenue", items: [
    { href: "/revenue", label: "Revenue Streams", icon: "💰" },
    { href: "/ib-accounts", label: "IB Accounts", icon: "🤝" },
    { href: "/clients", label: "Clients & Leads", icon: "👥" },
    { href: "/partners", label: "Partners", icon: "🔗" },
  ]},
  { section: "Content & Growth", items: [
    { href: "/content", label: "Content Assets", icon: "🎬" },
    { href: "/calendar", label: "Content Calendar", icon: "📅" },
    { href: "/campaigns", label: "Campaigns", icon: "🚀" },
  ]},
  { section: "Operations", items: [
    { href: "/tasks", label: "Tasks", icon: "✅" },
    { href: "/expenses", label: "Expenses", icon: "💸" },
  ]},
  { section: "System", items: [
    { href: "/export", label: "Export Snapshot", icon: "↗" },
    { href: "/settings", label: "Settings", icon: "⚙" },
  ]},
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 shrink-0 bg-zinc-950 border-r border-zinc-800 flex flex-col min-h-screen">
      <div className="p-5 border-b border-zinc-800">
        <div className="text-xs text-zinc-600 uppercase tracking-widest mb-0.5">TN OS Suite</div>
        <div className="text-base font-bold text-white">Business OS</div>
        <div className="text-xs text-zinc-500 mt-0.5">TNPA operations hub</div>
      </div>
      <nav className="flex-1 p-3 space-y-4 overflow-y-auto">
        {nav.map((section) => (
          <div key={section.section}>
            <div className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-600">{section.section}</div>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href + "/"));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                      active
                        ? "bg-violet-600/15 text-violet-400 font-medium"
                        : "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/60"
                    }`}
                  >
                    <span className="text-base w-5 text-center leading-none">{item.icon}</span>
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      <div className="p-4 border-t border-zinc-800">
        <div className="text-xs text-zinc-600">v0.1.0 · Local-first</div>
      </div>
    </aside>
  );
}

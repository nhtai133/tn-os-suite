"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from "@/components/auth/LogoutButton";

const nav = [
  { href: "/dashboard", label: "CEO Dashboard", icon: "⬡" },
  { href: "/ai-ceo", label: "AI CEO Briefing", icon: "AI" },
  { href: "/daily", label: "Daily Command", icon: "D" },
  { href: "/import", label: "Import Snapshots", icon: "↙" },
  { href: "/decisions", label: "Decisions", icon: "◈" },
  { href: "/weekly-review", label: "Weekly Review", icon: "◷" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 shrink-0 bg-zinc-950 border-r border-zinc-800 flex flex-col min-h-screen">
      <div className="p-5 border-b border-zinc-800">
        <div className="text-xs text-zinc-600 uppercase tracking-widest mb-0.5">TN OS Suite</div>
        <div className="text-base font-bold text-white">TN Life OS</div>
        <div className="text-xs text-zinc-600 mt-0.5">Personal CEO Command Center</div>
      </div>
      <nav className="flex-1 p-3 space-y-0.5">
        {nav.map((item) => {
          const active = pathname.startsWith(item.href);
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
              <span className="text-base w-4 text-center">{item.icon}</span>
              <span className="whitespace-nowrap">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-zinc-800 space-y-2">
        <LogoutButton />
        <div className="text-xs text-zinc-700">v2.1 · TN OS Suite</div>
      </div>
    </aside>
  );
}

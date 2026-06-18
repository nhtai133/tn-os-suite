"use client";

interface Props {
  onOpen: () => void;
}

export function MobileHeader({ onOpen }: Props) {
  return (
    <header className="flex md:hidden items-center gap-3 h-14 px-4 border-b border-white/10 bg-slate-950/95 sticky top-0 z-30">
      <button
        onClick={onOpen}
        className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        aria-label="Open navigation"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
          <rect y="2" width="18" height="2" rx="1" />
          <rect y="8" width="18" height="2" rx="1" />
          <rect y="14" width="18" height="2" rx="1" />
        </svg>
      </button>
      <div>
        <div className="text-[10px] text-cyan-300/60 uppercase tracking-widest leading-none">TNPA</div>
        <div className="text-sm font-semibold text-white leading-tight">Trading OS</div>
      </div>
    </header>
  );
}

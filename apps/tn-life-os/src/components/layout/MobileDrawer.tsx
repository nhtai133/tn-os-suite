"use client";

import { useEffect } from "react";
import { Sidebar } from "../Sidebar";
import { LogoutButton } from "../auth/LogoutButton";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function MobileDrawer({ open, onClose }: Props) {
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 md:hidden">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="absolute inset-y-0 left-0 overflow-y-auto flex flex-col bg-zinc-950">
        <Sidebar />
        <div className="px-4 pb-4 border-t border-zinc-800 mt-auto shrink-0">
          <LogoutButton />
        </div>
      </div>
    </div>
  );
}

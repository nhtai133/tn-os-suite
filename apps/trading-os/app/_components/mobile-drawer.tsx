"use client";

import { useEffect } from "react";
import { Sidebar } from "@/app/_components/sidebar";

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
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="absolute inset-y-0 left-0 overflow-y-auto">
        <Sidebar />
      </div>
    </div>
  );
}

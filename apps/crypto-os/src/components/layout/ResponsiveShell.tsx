"use client";

import { useState } from "react";
import { Sidebar } from "../Sidebar";
import { MobileHeader } from "./MobileHeader";
import { MobileDrawer } from "./MobileDrawer";

interface Props {
  children: React.ReactNode;
}

export function ResponsiveShell({ children }: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      <div className="hidden md:block shrink-0">
        <Sidebar />
      </div>
      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <div className="flex flex-col flex-1 min-w-0">
        <MobileHeader onOpen={() => setDrawerOpen(true)} />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

import React from "react";
import type { Metadata } from "next";
import "./globals.css";
import { ResponsiveShell } from "@/components/layout/ResponsiveShell";

export const metadata: Metadata = {
  title: "TN Life OS · Personal CEO Dashboard",
  description: "Federated personal operating system command center",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>
        <ResponsiveShell>{children}</ResponsiveShell>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";
import { ResponsiveShell } from "@/components/layout/ResponsiveShell";

export const metadata: Metadata = {
  title: "Crypto OS · TN OS Suite",
  description: "TNPA crypto portfolio — holdings, wallets, DeFi, security",
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

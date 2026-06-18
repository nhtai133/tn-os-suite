import type { Metadata } from "next";
import "./globals.css";
import { ResponsiveShell } from "@/components/layout/ResponsiveShell";

export const metadata: Metadata = {
  title: "Stocks OS · TN OS Suite",
  description: "TNPA stock portfolio — holdings, watchlist, valuation, dividends",
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

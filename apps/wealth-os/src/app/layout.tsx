import type { Metadata } from "next";
import "./globals.css";
import { ResponsiveShell } from "@/components/layout/ResponsiveShell";

export const metadata: Metadata = {
  title: "Wealth OS · TN OS Suite",
  description: "Personal wealth tracking — net worth, assets, liabilities",
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

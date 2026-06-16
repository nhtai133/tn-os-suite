import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "TN Life OS · Personal CEO Dashboard",
  description: "Federated personal operating system command center",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="flex min-h-screen flex-col md:flex-row">
        <Sidebar />
        <main className="flex-1 overflow-auto min-w-0">
          {children}
        </main>
      </body>
    </html>
  );
}

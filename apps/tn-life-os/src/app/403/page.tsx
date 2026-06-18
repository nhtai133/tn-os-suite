import Link from "next/link";

export const metadata = { title: "403 Unauthorized · TN Life OS" };

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 bg-zinc-950">
      <div className="text-center max-w-sm">
        <div className="text-6xl font-bold text-zinc-800 mb-4">403</div>
        <h1 className="text-xl font-semibold text-white mb-2">Access Denied</h1>
        <p className="text-sm text-zinc-500 mb-8">
          You don&apos;t have permission to view this page.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white hover:bg-violet-500 transition-colors"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}

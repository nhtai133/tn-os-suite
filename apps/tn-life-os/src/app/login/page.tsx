import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata = { title: "Sign in · TN Life OS" };

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12 bg-zinc-950">
      <div className="w-full max-w-sm">
        {/* Logo / Header */}
        <div className="mb-8 text-center">
          <div className="text-xs font-semibold uppercase tracking-[0.3em] text-violet-400 mb-2">
            TN OS Suite
          </div>
          <h1 className="text-2xl font-bold text-white">TN Life OS</h1>
          <p className="mt-1.5 text-sm text-zinc-500">Sign in to your personal operating system</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 shadow-2xl shadow-black/40">
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>

        <p className="mt-6 text-center text-xs text-zinc-700">
          Private access only · TN OS Suite v2.1
        </p>
      </div>
    </div>
  );
}

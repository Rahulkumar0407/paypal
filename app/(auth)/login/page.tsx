import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/LoginForm";
import { demoLoginAction } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Sign In • tmrw",
};

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-serif font-black text-slate-900 tracking-tight">
          Welcome back
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Sign in to access your business cash forecast and approvals.
        </p>
      </div>
      <LoginForm />
      <form action={demoLoginAction}>
        <button
          type="submit"
          className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors shadow-xs"
        >
          Try Live Demo →
        </button>
      </form>
    </div>
  );
}


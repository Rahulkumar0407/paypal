"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerAction, type AuthActionResult } from "@/lib/auth";

const initialState: AuthActionResult = {
  status: "idle",
  message: "",
};

export function RegisterForm() {
  const [state, formAction, isPending] = useActionState(registerAction, initialState);

  return (
    <form action={formAction} className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-4">
      {state.status === "error" && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700">
          {state.message}
        </div>
      )}

      <div>
        <label htmlFor="name" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
          Your full name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          required
          placeholder="Jane Merchant"
          className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
        />
        {state.errors?.name && (
          <p className="text-xs font-medium text-rose-600 mt-1">{state.errors.name}</p>
        )}
      </div>

      <div>
        <label htmlFor="storeName" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
          Store / Business name
        </label>
        <input
          id="storeName"
          name="storeName"
          type="text"
          required
          placeholder="Apex Audio Labs"
          className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
        />
        {state.errors?.storeName && (
          <p className="text-xs font-medium text-rose-600 mt-1">{state.errors.storeName}</p>
        )}
      </div>

      <div>
        <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
          Business email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="owner@yourstore.com"
          className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
        />
        {state.errors?.email && (
          <p className="text-xs font-medium text-rose-600 mt-1">{state.errors.email}</p>
        )}
      </div>

      <div>
        <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
          Password (min 8 characters)
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          placeholder="••••••••"
          className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 font-mono"
        />
        {state.errors?.password && (
          <p className="text-xs font-medium text-rose-600 mt-1">{state.errors.password}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full mt-2 py-2.5 px-4 rounded-xl bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-50 shadow-xs"
      >
        {isPending ? "Creating Merchant Account..." : "Create Merchant Account →"}
      </button>

      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span>Already have an account?</span>
        <Link href="/login" className="font-semibold text-blue-600 hover:text-blue-700 underline underline-offset-2">
          Sign in
        </Link>
      </div>
    </form>
  );
}

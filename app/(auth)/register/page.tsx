import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata: Metadata = {
  title: "Create Merchant Account • tmrw",
};

export default function RegisterPage() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-serif font-black text-slate-900 tracking-tight">
          Create your account
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Set up your store and get a 30-day cash-flow forecast in minutes.
        </p>
      </div>
      <RegisterForm />
    </div>
  );
}


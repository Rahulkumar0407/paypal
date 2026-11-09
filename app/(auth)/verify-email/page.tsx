import type { Metadata } from "next";
import { isEmailDeliveryConfigured } from "@/lib/auth";

export const metadata: Metadata = { title: "Verify email • NeverShort" };

export default function VerifyEmailPage() {
  return (
    <div className="max-w-md mx-auto p-8 space-y-4">
      <h1 className="text-2xl font-serif font-black text-slate-900">Verify your email</h1>
      <p className="text-sm text-slate-500">
        {isEmailDeliveryConfigured()
          ? "Check your inbox for a verification link."
          : "Email delivery is not configured yet, so verification links cannot be sent. This is a known blocker."}
      </p>
    </div>
  );
}

import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2">
        <Link href="/" className="inline-flex items-center gap-2.5 group">
          <span className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-lg shadow-sm group-hover:bg-blue-700 transition-colors">
            N
          </span>
          <span className="font-serif font-black text-2xl text-slate-900 tracking-tight">
            tmrw
          </span>
        </Link>
        <p className="text-xs font-mono uppercase tracking-wider text-slate-500 font-bold">
          Merchant Financial Co-pilot
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        {children}
      </div>

      <div className="mt-8 text-center text-xs text-slate-400 font-mono">
        Protected by Margin Guard™ • 256-bit Encrypted Session
      </div>
    </div>
  );
}


"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RotateCcw, Home } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to console during development
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#F5F4EF] font-sans selection:bg-[#F04D23] selection:text-white flex flex-col justify-between p-6 text-[#141414]">
      <header className="max-w-[1180px] w-full mx-auto flex items-center justify-between py-2">
        <Link href="/" className="flex items-center gap-2 group">
          <span className="size-2 rounded-full bg-[#F04D23] group-hover:scale-125 transition-transform shrink-0" />
          <span className="text-[17px] font-extrabold tracking-[-0.03em] text-[#141414]">Logr</span>
          <span className="text-[11.5px] text-[#7A7973] font-normal ml-0.5">/ OAU</span>
        </Link>
      </header>

      <main className="max-w-[500px] w-full mx-auto my-auto text-center space-y-6">
        <div className="size-16 rounded-2xl bg-red-50 border border-red-200 mx-auto flex items-center justify-center text-red-600 shadow-xs">
          <AlertCircle className="size-7" />
        </div>

        <div className="space-y-2">
          <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-red-600">
            System Error
          </span>
          <h1 className="text-[1.75rem] font-bold tracking-tight text-[#141414]">
            An unexpected error occurred
          </h1>
          <p className="text-[13px] text-[#7A7973] leading-relaxed max-w-[380px] mx-auto">
            The application encountered an issue while processing your request. Please try reloading or return to the overview.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#141414] text-white text-[12.5px] font-semibold hover:bg-[#282828] transition-colors shadow-xs cursor-pointer"
          >
            <RotateCcw className="size-3.5" />
            <span>Try again</span>
          </button>
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-white border border-[#D8D7CE] text-[#141414] text-[12.5px] font-semibold hover:bg-[#F5F4EF] transition-colors shadow-xs"
          >
            <Home className="size-3.5" />
            <span>Return to home</span>
          </Link>
        </div>
      </main>

      <footer className="text-center text-[11px] text-[#9A9990] py-4">
        Obafemi Awolowo University &middot; Technology &amp; Computing Faculties &middot; SWEP &amp; SIWES
      </footer>
    </div>
  );
}

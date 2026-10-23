"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { authApi } from "@/lib/api/auth";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes("@")) {
      setError("Enter a valid email address.");
      return;
    }
    setError(null);

    startTransition(async () => {
      /* Backend always returns success to prevent enumeration */
      await authApi.forgotPassword({ email });
      setSubmitted(true);
    });
  }

  return (
    <div className="min-h-screen bg-[#EDECE6] flex items-center justify-center px-4 py-8 sm:px-6 sm:py-16 font-sans selection:bg-[#F04D23] selection:text-white">
      <div className="w-full max-w-[340px]">

        <Link href="/" className="flex items-center gap-2 mb-6 sm:mb-8 group">
          <span className="size-2 rounded-full bg-[#F04D23] group-hover:scale-125 transition-transform" />
          <span className="text-[15px] font-extrabold tracking-[-0.03em] text-[#141414]">Logr</span>
          <span className="text-[10.5px] text-[#7A7973] font-normal ml-0.5">/ OAU</span>
        </Link>

        {submitted ? (
          <>
            <div className="flex items-center gap-2 mb-3">
              <span className="size-1.5 rounded-full bg-[#F04D23]" />
              <span className="text-[10.5px] font-mono text-[#141414] uppercase tracking-wider">Email dispatched</span>
            </div>
            <h1 className="text-[1.2rem] sm:text-[1.35rem] font-bold tracking-[-0.025em] text-[#141414] mb-2">
              Check your inbox
            </h1>
            <p className="text-[12px] sm:text-[12.5px] text-[#7A7973] leading-relaxed mb-6">
              If an account exists for{" "}
              <strong className="text-[#141414]">{email}</strong>, you'll receive
              a password reset link shortly. Check your spam or junk folder if it doesn't arrive within a few minutes.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center justify-center w-full h-9.5 rounded-full bg-[#141414] text-white text-[12.5px] font-semibold hover:bg-[#282828] active:scale-[0.99] transition-all shadow-sm"
            >
              ← Back to sign in
            </Link>
          </>
        ) : (
          <>
            <h1 className="text-[1.2rem] sm:text-[1.35rem] font-bold tracking-[-0.025em] text-[#141414] mb-1">
              Reset password
            </h1>
            <p className="text-[12px] sm:text-[12.5px] text-[#7A7973] mb-5 leading-relaxed">
              Enter your registered institutional email and we'll dispatch reset instructions.
            </p>

            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="email"
                  className="text-[10px] font-medium text-[#5A5954] uppercase tracking-wider"
                >
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  inputMode="email"
                  value={email}
                  autoComplete="email"
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@oauife.edu.ng"
                  className={`w-full h-9.5 px-3 rounded-xl border bg-white text-[13px] text-[#141414] placeholder:text-[#B0AFA9] outline-none transition-all
                    focus:ring-2 focus:ring-[#F04D23]/20 focus:border-[#F04D23]
                    ${error ? "border-red-400" : "border-[#D8D7CE] hover:border-[#B0AFA9]"}`}
                />
                {error && <p className="text-[10.5px] text-red-500 font-medium">{error}</p>}
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full h-9.5 rounded-full bg-[#141414] text-white text-[12.5px] font-semibold hover:bg-[#282828] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm mt-1"
              >
                {isPending ? "Sending link…" : "Send reset link"}
              </button>
            </form>

            <div className="my-5 border-t border-[#D8D7CE]" />

            <p className="text-[12px] text-center text-[#7A7973]">
              <Link
                href="/login"
                className="font-semibold text-[#141414] hover:underline underline-offset-4"
              >
                ← Back to sign in
              </Link>
            </p>
          </>
        )}

      </div>
    </div>
  );
}

"use client";

import { useState, useTransition, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { authApi } from "@/lib/api/auth";
import { Eye, EyeOff } from "lucide-react";

function ResetPasswordForm() {
  const params = useSearchParams();
  const router = useRouter();

  /* Guide: reset link carries ?email=...&token=... */
  const email = params.get("email") ?? "";
  const token = params.get("token") ?? "";

  const [password,        setPassword]        = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword,    setShowPassword]    = useState(false);
  const [showConfirm,     setShowConfirm]     = useState(false);
  const [error,           setError]           = useState<string | null>(null);
  const [fieldError,      setFieldError]      = useState<string | null>(null);
  const [done,            setDone]            = useState(false);
  const [isPending, startTransition] = useTransition();

  /* Guard: if params are missing the link is broken */
  const linkValid = !!email && !!token;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldError(null);

    if (password.length < 8) {
      setFieldError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setFieldError("Passwords do not match.");
      return;
    }

    startTransition(async () => {
      const res = await authApi.resetPassword({ email, token, password });
      if (!res.ok) {
        const map: Record<string, string> = {
          reset_token_invalid: "This reset link is invalid or has expired. Request a new one.",
        };
        setError(map[res.message] ?? res.message);
        return;
      }
      setDone(true);
    });
  }

  const inputCls = (hasErr?: boolean) =>
    `w-full h-9.5 px-3 rounded-xl border bg-white text-[13px] text-[#141414] placeholder:text-[#B0AFA9] outline-none transition-all
    focus:ring-2 focus:ring-[#F04D23]/20 focus:border-[#F04D23]
    ${hasErr ? "border-red-400" : "border-[#D8D7CE] hover:border-[#B0AFA9]"}`;

  return (
    <div className="min-h-screen bg-[#EDECE6] flex items-center justify-center px-4 sm:px-8 py-8 sm:py-12 font-sans selection:bg-[#F04D23] selection:text-white">
      <div className="w-full max-w-[340px]">

        <Link href="/" className="flex items-center gap-2 mb-6 sm:mb-8 group">
          <span className="size-2 rounded-full bg-[#F04D23] group-hover:scale-125 transition-transform" />
          <span className="text-[15px] font-extrabold tracking-[-0.03em] text-[#141414]">Logr</span>
          <span className="text-[10.5px] text-[#7A7973] font-normal ml-0.5">/ OAU</span>
        </Link>

        {!linkValid ? (
          <>
            <h1 className="text-[1.2rem] sm:text-[1.35rem] font-bold tracking-[-0.025em] text-[#141414] mb-2">
              Invalid link
            </h1>
            <p className="text-[12px] sm:text-[12.5px] text-[#7A7973] leading-relaxed mb-6">
              This password reset link is missing required information.
              Request a new one from the forgot-password page.
            </p>
            <Link href="/forgot-password"
              className="text-[12px] font-semibold text-[#141414] hover:underline underline-offset-4">
              Request a new link →
            </Link>
          </>
        ) : done ? (
          <>
            <div className="flex items-center gap-2 mb-4">
              <span className="size-1.5 rounded-full bg-[#F04D23]" />
              <span className="text-[10px] font-medium text-[#141414]">Password updated</span>
            </div>
            <h1 className="text-[1.2rem] sm:text-[1.35rem] font-bold tracking-[-0.025em] text-[#141414] mb-2">
              All done
            </h1>
            <p className="text-[12px] sm:text-[12.5px] text-[#7A7973] leading-relaxed mb-6">
              Your password has been reset. Sign in with your new password.
            </p>
            <Link href="/login"
              className="inline-flex w-full items-center justify-center h-9.5 rounded-full bg-[#141414] text-white text-[12.5px] font-semibold hover:bg-[#282828] active:scale-[0.99] transition-all shadow-sm">
              Go to sign in
            </Link>
          </>
        ) : (
          <>
            <h1 className="text-[1.2rem] sm:text-[1.35rem] font-bold tracking-[-0.025em] text-[#141414] mb-1">
              Set new password
            </h1>
            <p className="text-[12px] sm:text-[12.5px] text-[#7A7973] mb-5 leading-relaxed">
              Choose a strong password for{" "}
              <strong className="text-[#141414]">{email}</strong>.
            </p>

            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label htmlFor="password"
                  className="text-[10px] font-medium text-[#5A5954] uppercase tracking-wider">
                  New password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    autoComplete="new-password"
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    className={`${inputCls(!!fieldError)} pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#9A9990] hover:text-[#141414] transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor="confirmPassword"
                  className="text-[10px] font-medium text-[#5A5954] uppercase tracking-wider">
                  Confirm password
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    autoComplete="new-password"
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`${inputCls(!!fieldError)} pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#9A9990] hover:text-[#141414] transition-colors"
                    aria-label={showConfirm ? "Hide password" : "Show password"}
                  >
                    {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                {fieldError && <p className="text-[10.5px] text-red-500 font-medium">{fieldError}</p>}
              </div>

              {error && (
                <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-red-50 border border-red-200">
                  <span className="mt-1 size-1.5 rounded-full bg-red-400 shrink-0" />
                  <p className="text-[11.5px] text-red-600 leading-relaxed">{error}</p>
                </div>
              )}

              <button
                type="submit" disabled={isPending}
                className="w-full h-9.5 rounded-full bg-[#141414] text-white text-[12.5px] font-semibold hover:bg-[#282828] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm mt-1 cursor-pointer"
              >
                {isPending ? "Saving…" : "Set new password"}
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

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#EDECE6] flex items-center justify-center font-sans text-[13px] text-[#7A7973]">
          Loading…
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}

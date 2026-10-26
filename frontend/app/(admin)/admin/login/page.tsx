"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api/auth";
import { ArrowUpRight, Lock, Eye, EyeOff } from "lucide-react";
import { AuthBrandPanel, MobileAuthBar } from "@/components/auth/BrandPanel";

export default function AdminLoginPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password) {
      setError("Please enter your administrator email and password.");
      return;
    }
    startTransition(async () => {
      const res = await authApi.adminLogin({ email, password });
      if (!res.ok) {
        setError(
          res.message === "invalid_credentials" || res.status === 401
            ? "Administrator credentials not recognised or account lacks superuser privileges."
            : (res.message ?? "Authentication failed.")
        );
        return;
      }
      router.replace("/admin");
    });
  }

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[340px_1fr] xl:grid-cols-[380px_1fr] font-sans selection:bg-[#F04D23] selection:text-white">

      {/* Brand panel with "Admin Governance" flavour */}
      <AuthBrandPanel variant="admin" />

      {/* Right form panel */}
      <div className="min-h-screen bg-[#EDECE6] flex flex-col">
        <MobileAuthBar />

        <div className="flex-1 flex items-center justify-center px-4 sm:px-8 py-8 sm:py-12">
          <div className="w-full max-w-[340px]">

            <div className="mb-5">
              <div className="flex items-center gap-1.5 mb-2">
                <span className="size-2 rounded-full bg-[#141414]" />
                <span className="text-[10.5px] font-mono uppercase tracking-wider font-semibold text-[#141414]">
                  Admin Portal
                </span>
              </div>
              <h1 className="text-[1.2rem] sm:text-[1.35rem] font-bold tracking-[-0.025em] text-[#141414] mb-1">
                Administrator Sign In
              </h1>
              <p className="text-[12px] sm:text-[12.5px] text-[#7A7973] leading-relaxed">
                Sign in to manage coordinators, configure cohorts, and oversee internship records for OAU.
              </p>
            </div>

            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label htmlFor="admin-email" className="text-[10px] font-medium text-[#5A5954] uppercase tracking-wider">
                  Administrator Email
                </label>
                <input
                  id="admin-email" type="email" inputMode="email"
                  autoComplete="email" value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@oauife.edu.ng"
                  className={`w-full h-9.5 px-3 rounded-xl border bg-white text-[13px] text-[#141414] placeholder:text-[#B0AFA9] outline-none transition-all
                    focus:ring-2 focus:ring-[#F04D23]/20 focus:border-[#F04D23]
                    ${error ? "border-red-400" : "border-[#D8D7CE] hover:border-[#B0AFA9]"}`}
                />
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <label htmlFor="admin-password" className="text-[10px] font-medium text-[#5A5954] uppercase tracking-wider">
                    Password
                  </label>
                  <Link href="/forgot-password" className="text-[10px] text-[#7A7973] hover:text-[#141414] transition-colors">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    id="admin-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`w-full h-9.5 pl-3 pr-10 rounded-xl border bg-white text-[13px] text-[#141414] placeholder:text-[#B0AFA9] outline-none transition-all
                      focus:ring-2 focus:ring-[#F04D23]/20 focus:border-[#F04D23]
                      ${error ? "border-red-400" : "border-[#D8D7CE] hover:border-[#B0AFA9]"}`}
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

              {error && (
                <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-red-50 border border-red-200">
                  <span className="mt-1 size-1.5 rounded-full bg-red-400 shrink-0" />
                  <p className="text-[11.5px] text-red-600 leading-relaxed">{error}</p>
                </div>
              )}

              <button
                type="submit" disabled={isPending}
                className="w-full h-9.5 rounded-full bg-[#141414] text-white text-[12.5px] font-semibold hover:bg-[#282828] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-1 shadow-sm cursor-pointer"
              >
                {isPending ? "Signing in…" : "Sign In to Admin Portal"}
              </button>
            </form>

            <div className="my-5 border-t border-[#D8D7CE]" />

            <div className="space-y-2.5 text-center">
              <p className="text-[12px] text-[#7A7973]">
                Not an administrator?{" "}
                <Link href="/login" className="font-semibold text-[#141414] hover:underline underline-offset-4 inline-flex items-center gap-0.5">
                  Student & Coordinator Sign In <ArrowUpRight className="size-2.5" />
                </Link>
              </p>
              <p className="text-[10.5px] text-[#9A9990] flex items-center justify-center gap-1.5">
                <Lock className="size-3 text-[#B0AFA9]" />
                Authorized administrative access only.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useTransition, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { authApi } from "@/lib/api/auth";
import { ArrowUpRight, Eye, EyeOff } from "lucide-react";
import { AuthBrandPanel, MobileAuthBar } from "@/components/auth/BrandPanel";

function decodeRole(token: string): "student" | "coordinator" | "admin" | null {
  try {
    const seg = token.split(".")[1];
    const b64 = seg.replace(/-/g, "+").replace(/_/g, "/").padEnd(seg.length + ((4 - (seg.length % 4)) % 4), "=");
    const payload = JSON.parse(atob(b64)) as { role?: string; user_role?: string };
    const r = (payload.role ?? payload.user_role)?.toLowerCase();
    if (r === "student" || r === "coordinator" || r === "admin") return r;
    return null;
  } catch { return null; }
}

const ROLE_HOME = { student: "/student", coordinator: "/coordinator", admin: "/admin" } as const;

/* ── Form ─────────────────────────────────────────────────── */
function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password) { setError("Please enter your email and password."); return; }

    startTransition(async () => {
      const result = await authApi.login({ email, password });
      if (!result.ok) {
        const map: Record<string, string> = {
          invalid_credentials: "Incorrect email or password.",
          email_not_verified: "Verify your student email before signing in.",
          account_type_invalid: "This account type cannot sign in here.",
        };
        setError(map[result.message] ?? result.message);
        return;
      }
      let role = decodeRole(result.data.access);
      if (!role) {
        const s = await authApi.studentProfile();
        role = s.ok ? "student" : "coordinator";
      }
      const next = params.get("next");
      const safe = next?.startsWith(ROLE_HOME[role]) ? next : ROLE_HOME[role];
      router.replace(safe);
    });
  }

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[340px_1fr] xl:grid-cols-[380px_1fr] font-sans selection:bg-[#F04D23] selection:text-white">
      <AuthBrandPanel variant="login" />

      {/* Right panel */}
      <div className="min-h-screen bg-[#EDECE6] flex flex-col">
        <MobileAuthBar />

        <div className="flex-1 flex items-center justify-center px-4 sm:px-8 py-8 sm:py-12">
          <div className="w-full max-w-[340px]">

            {/* Heading */}
            <div className="mb-5">
              <h1 className="text-[1.2rem] sm:text-[1.35rem] font-bold tracking-[-0.025em] text-[#141414] mb-1">
                Welcome back
              </h1>
              <p className="text-[12px] sm:text-[12.5px] text-[#7A7973] leading-relaxed">
                Student and Coordinator portal.
              </p>
            </div>

            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label htmlFor="email" className="text-[10px] font-medium text-[#5A5954] uppercase tracking-wider">Email address</label>
                <input
                  id="email" type="email" inputMode="email" value={email}
                  onChange={(e) => setEmail(e.target.value)} autoComplete="email"
                  placeholder="you@oauife.edu.ng"
                  className={`w-full h-9.5 px-3 rounded-xl border bg-white text-[13px] text-[#141414] placeholder:text-[#B0AFA9] outline-none transition-all focus:ring-2 focus:ring-[#F04D23]/20 focus:border-[#F04D23] ${error ? "border-red-400" : "border-[#D8D7CE] hover:border-[#B0AFA9]"}`}
                />
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="text-[10px] font-medium text-[#5A5954] uppercase tracking-wider">Password</label>
                  <Link href="/forgot-password" className="text-[10px] text-[#7A7973] hover:text-[#141414] transition-colors">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className={`w-full h-9.5 pl-3 pr-10 rounded-xl border bg-white text-[13px] text-[#141414] placeholder:text-[#B0AFA9] outline-none transition-all focus:ring-2 focus:ring-[#F04D23]/20 focus:border-[#F04D23] ${error ? "border-red-400" : "border-[#D8D7CE] hover:border-[#B0AFA9]"}`}
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
                {isPending ? "Signing in…" : "Sign in"}
              </button>
            </form>

            <div className="my-5 border-t border-[#D8D7CE]" />

            <div className="space-y-2.5 text-center">
              <p className="text-[12px] text-[#7A7973]">
                New student?{" "}
                <Link href="/signup" className="font-semibold text-[#141414] hover:underline underline-offset-4">
                  Create an account
                </Link>
              </p>
              <Link
                href="/admin/login"
                className="inline-flex items-center gap-1.5 text-[10.5px] font-medium text-[#7A7973] hover:text-[#141414] transition-colors"
              >
                System Administrator? <span className="text-[#F04D23] font-semibold">Admin Portal <ArrowUpRight className="inline size-3" /></span>
              </Link>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#EDECE6] flex items-center justify-center font-sans text-[13px] text-[#7A7973]">
        Loading…
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}

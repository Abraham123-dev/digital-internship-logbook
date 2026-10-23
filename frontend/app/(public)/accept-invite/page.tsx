"use client";

import { useState, useEffect, useTransition, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { authApi } from "@/lib/api/auth";
import type { ValidateInviteResponse } from "@/lib/api/auth";
import { ArrowLeft } from "lucide-react";
import { AuthBrandPanel, MobileAuthBar } from "@/components/auth/BrandPanel";

const inputCls = (hasErr?: boolean) =>
  `w-full h-9.5 px-3 rounded-xl border bg-white text-[13px] text-[#141414] placeholder:text-[#B0AFA9] outline-none transition-all
  focus:ring-2 focus:ring-[#F04D23]/20 focus:border-[#F04D23]
  ${hasErr ? "border-red-400" : "border-[#D8D7CE] hover:border-[#B0AFA9]"}`;

function Field({ label, id, children, error }: {
  label: string; id: string; children: React.ReactNode; error?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-[10px] font-medium text-[#5A5954] uppercase tracking-wider">{label}</label>
      {children}
      {error && <p className="text-[10px] text-red-500 font-medium">{error}</p>}
    </div>
  );
}

type FormState = { first_name: string; last_name: string; phone: string; password: string; confirmPassword: string };
const INITIAL: FormState = { first_name: "", last_name: "", phone: "", password: "", confirmPassword: "" };

function AcceptInviteForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";

  const [invite, setInvite] = useState<ValidateInviteResponse | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(INITIAL);
  const [fieldErrs, setFieldErrs] = useState<Partial<Record<keyof FormState, string>>>({});
  const [globalErr, setGlobalErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!token) { setLoadErr("No invitation token found in the link."); return; }
    authApi.validateInvite(token).then((res) => {
      if (res.ok) setInvite(res.data);
      else {
        setLoadErr(
          res.message === "invitation_invalid"
            ? "This invitation link is invalid, expired, or has already been used."
            : res.message
        );
      }
    });
  }, [token]);

  const set = (key: keyof FormState) => (val: string) => setForm((f) => ({ ...f, [key]: val }));

  function validate(): boolean {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!form.first_name.trim()) e.first_name = "Required.";
    if (!form.last_name.trim()) e.last_name = "Required.";
    if (!form.phone.trim()) e.phone = "Required.";
    if (form.password.length < 8) e.password = "At least 8 characters.";
    if (form.password !== form.confirmPassword) e.confirmPassword = "Passwords do not match.";
    setFieldErrs(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGlobalErr(null);
    if (!validate()) return;
    const { confirmPassword: _c, ...rest } = form;
    startTransition(async () => {
      const res = await authApi.acceptInvite({ token, ...rest });
      if (!res.ok) {
        const map: Record<string, string> = {
          invitation_invalid: "This invitation link is no longer valid.",
          email_taken: "An account with this email already exists.",
        };
        if (res.errors) {
          const mapped: Partial<Record<keyof FormState, string>> = {};
          for (const [k, msgs] of Object.entries(res.errors)) mapped[k as keyof FormState] = msgs[0];
          setFieldErrs(mapped);
        } else {
          setGlobalErr(map[res.message] ?? res.message);
        }
        return;
      }
      setDone(true);
    });
  }

  /* ── Shared split layout wrapper ─────────────────────── */
  const Layout = ({ children }: { children: React.ReactNode }) => (
    <div className="min-h-screen lg:grid lg:grid-cols-[340px_1fr] xl:grid-cols-[380px_1fr] font-sans selection:bg-[#F04D23] selection:text-white">
      <AuthBrandPanel variant="invite" inviteDetail={invite} />
      <div className="min-h-screen bg-[#EDECE6] flex flex-col">
        <MobileAuthBar />
        <div className="flex-1 flex items-center justify-center px-4 sm:px-8 py-8 sm:py-12">
          {children}
        </div>
      </div>
    </div>
  );

  /* Loading */
  if (!token || (!invite && !loadErr)) {
    return (
      <Layout>
        <div className="flex items-center gap-2 text-[12.5px] text-[#7A7973]">
          <span className="size-1.5 rounded-full bg-[#F04D23] animate-pulse" />
          Validating invitation…
        </div>
      </Layout>
    );
  }

  /* Error */
  if (loadErr) {
    return (
      <Layout>
        <div className="w-full max-w-[340px]">
          <h1 className="text-[1.2rem] sm:text-[1.35rem] font-bold tracking-[-0.025em] text-[#141414] mb-2">Invalid invitation</h1>
          <p className="text-[12px] sm:text-[12.5px] text-[#7A7973] leading-relaxed mb-6">{loadErr}</p>
          <Link href="/login" className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#141414] hover:underline underline-offset-4">
            <ArrowLeft className="size-3.5" /> Go to sign in
          </Link>
        </div>
      </Layout>
    );
  }

  /* Done */
  if (done) {
    return (
      <Layout>
        <div className="w-full max-w-[340px]">
          <div className="flex items-center gap-2 mb-4">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Account Created
            </span>
          </div>
          <h1 className="text-[1.2rem] sm:text-[1.35rem] font-bold tracking-[-0.025em] text-[#141414] mb-2">
            Welcome, {form.first_name}
          </h1>
          <p className="text-[12px] sm:text-[12.5px] text-[#7A7973] leading-relaxed mb-6">
            Your coordinator account is ready. You&apos;re signed in and can access your portal now.
          </p>
          <Link href="/coordinator"
            className="inline-flex w-full items-center justify-center h-9.5 rounded-full bg-[#141414] text-white text-[12.5px] font-semibold hover:bg-[#282828] active:scale-[0.99] transition-all shadow-sm">
            Go to coordinator portal →
          </Link>
        </div>
      </Layout>
    );
  }

  /* Accept form */
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[340px_1fr] xl:grid-cols-[380px_1fr] font-sans selection:bg-[#F04D23] selection:text-white">
      <AuthBrandPanel variant="invite" inviteDetail={invite} />
      <div className="min-h-screen bg-[#EDECE6] flex flex-col">
        <MobileAuthBar />
        <div className="flex-1 flex items-center justify-center px-4 sm:px-8 py-8 sm:py-12 overflow-y-auto">
          <div className="w-full max-w-[340px]">

            <div className="mb-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="size-1.5 rounded-full border-[1.5px] border-[#F04D23]" />
                <span className="text-[10px] font-mono text-[#7A7973] uppercase tracking-wider">{invite!.department} · {invite!.programme}</span>
              </div>
              <h1 className="text-[1.2rem] sm:text-[1.35rem] font-bold tracking-[-0.025em] text-[#141414] mb-1">
                Set up your account
              </h1>
              <p className="text-[12px] sm:text-[12.5px] text-[#7A7973] leading-relaxed">
                Complete your coordinator profile to access your department portal.
              </p>
            </div>

            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3">
              {/* Email — read-only */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-medium text-[#5A5954] uppercase tracking-wider">Email address</label>
                <div className="w-full h-9.5 px-3 flex items-center rounded-xl border border-[#D8D7CE] bg-[#F5F4F0] text-[13px] text-[#7A7973]">
                  {invite!.email}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <Field label="First name" id="first_name" error={fieldErrs.first_name}>
                  <input id="first_name" type="text" value={form.first_name}
                    onChange={(e) => set("first_name")(e.target.value)}
                    autoComplete="given-name" placeholder="Ada"
                    className={inputCls(!!fieldErrs.first_name)} />
                </Field>
                <Field label="Last name" id="last_name" error={fieldErrs.last_name}>
                  <input id="last_name" type="text" value={form.last_name}
                    onChange={(e) => set("last_name")(e.target.value)}
                    autoComplete="family-name" placeholder="Coordinator"
                    className={inputCls(!!fieldErrs.last_name)} />
                </Field>
              </div>

              <Field label="Phone number" id="phone" error={fieldErrs.phone}>
                <input id="phone" type="tel" value={form.phone}
                  onChange={(e) => set("phone")(e.target.value)}
                  autoComplete="tel" placeholder="+2348000000000"
                  className={inputCls(!!fieldErrs.phone)} />
              </Field>

              <div className="grid grid-cols-2 gap-2.5">
                <Field label="Password" id="password" error={fieldErrs.password}>
                  <input id="password" type="password" value={form.password}
                    onChange={(e) => set("password")(e.target.value)}
                    autoComplete="new-password" placeholder="••••••••"
                    className={inputCls(!!fieldErrs.password)} />
                </Field>
                <Field label="Confirm" id="confirmPassword" error={fieldErrs.confirmPassword}>
                  <input id="confirmPassword" type="password" value={form.confirmPassword}
                    onChange={(e) => set("confirmPassword")(e.target.value)}
                    autoComplete="new-password" placeholder="••••••••"
                    className={inputCls(!!fieldErrs.confirmPassword)} />
                </Field>
              </div>

              {globalErr && (
                <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-red-50 border border-red-200">
                  <span className="mt-1 size-1.5 rounded-full bg-red-400 shrink-0" />
                  <p className="text-[11.5px] text-red-600 leading-relaxed">{globalErr}</p>
                </div>
              )}

              <button type="submit" disabled={isPending}
                className="w-full h-9.5 rounded-full bg-[#141414] text-white text-[12.5px] font-semibold hover:bg-[#282828] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-1 shadow-sm">
                {isPending ? "Setting up account…" : "Create coordinator account"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#EDECE6] flex items-center justify-center font-sans text-[13px] text-[#7A7973]">
        Loading…
      </div>
    }>
      <AcceptInviteForm />
    </Suspense>
  );
}

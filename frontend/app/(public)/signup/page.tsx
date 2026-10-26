"use client";

import { useState, useEffect, useTransition, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api/auth";
import type { Department, StudentSignupPayload } from "@/lib/api/auth";
import { ArrowUpRight, Eye, EyeOff } from "lucide-react";
import { AuthBrandPanel, MobileAuthBar } from "@/components/auth/BrandPanel";

/* ── Default OAU Tech departments fallback ────────────────── */
const DEFAULT_DEPTS: Department[] = [
  { id: 1, name: "Computer Science & Engineering" },
  { id: 2, name: "Electrical & Electronic Engineering" },
  { id: 3, name: "Mechanical Engineering" },
  { id: 4, name: "Civil Engineering" },
  { id: 5, name: "Chemical Engineering" },
  { id: 6, name: "Agricultural & Environmental Engineering" },
  { id: 7, name: "Materials Science & Engineering" },
  { id: 8, name: "Food Science & Technology" },
];

/* ── Shared field components ─────────────────────────────── */
function Field({ label, id, children, error, hint }: {
  label: string; id: string; children: React.ReactNode; error?: string; hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-[10px] font-medium text-[#5A5954] uppercase tracking-wider">{label}</label>
      {children}
      {hint && !error && <p className="text-[10px] text-[#9A9990]">{hint}</p>}
      {error && <p className="text-[10px] text-red-500 font-medium">{error}</p>}
    </div>
  );
}

const inputCls = (hasError?: boolean) =>
  `w-full h-9.5 px-3 rounded-xl border bg-white text-[13px] text-[#141414] placeholder:text-[#B0AFA9] outline-none transition-all focus:ring-2 focus:ring-[#F04D23]/20 focus:border-[#F04D23] ${hasError ? "border-red-400" : "border-[#D8D7CE] hover:border-[#B0AFA9]"}`;

/* ── OTP step ─────────────────────────────────────────────── */
function OtpStep({ email, onVerified }: { email: string; onVerified: () => void }) {
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const [isPending, startTransition] = useTransition();
  const [isResending, startResend] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [resendMsg, setResendMsg] = useState<string | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  function handleInput(index: number, val: string) {
    const char = val.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = char;
    setDigits(next);
    setError(null);
    if (char && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      if (!digits[index] && index > 0) {
        const next = [...digits];
        next[index - 1] = "";
        setDigits(next);
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const next = Array(6).fill("").map((_, i) => pasted[i] ?? "");
    setDigits(next);
    setError(null);
    const nextFocusIdx = Math.min(pasted.length, 5);
    inputRefs.current[nextFocusIdx]?.focus();
  }

  const otp = digits.join("");

  function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (otp.length !== 6) {
      setError("Please enter the full 6-digit code sent to your student email.");
      return;
    }
    startTransition(async () => {
      const res = await authApi.verifyOtp({ email, otp });
      if (!res.ok) {
        const map: Record<string, string> = {
          otp_invalid_or_expired: "This code is invalid or has expired. Try resending.",
          signup_expired: "Your signup session expired. Please register again.",
        };
        setError(map[res.message] ?? res.message);
        return;
      }
      onVerified();
    });
  }

  return (
    <div className="w-full max-w-[340px]">
      <div className="mb-5">
        <h1 className="text-[1.2rem] sm:text-[1.35rem] font-bold tracking-[-0.025em] text-[#141414] mb-1">
          Verify your email
        </h1>
        <p className="text-[12px] sm:text-[12.5px] text-[#7A7973] leading-relaxed">
          We sent a 6-digit code to <strong className="text-[#141414]">{email}</strong>.
        </p>
      </div>

      <form onSubmit={handleVerify} noValidate className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-medium text-[#5A5954] uppercase tracking-wider">
            Verification code
          </label>
          <div className="grid grid-cols-6 gap-2 sm:gap-2.5 my-1" onPaste={handlePaste}>
            {digits.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => { inputRefs.current[idx] = el; }}
                id={`otp-box-${idx}`}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="one-time-code"
                maxLength={1}
                value={digit}
                onChange={(e) => handleInput(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                className={`size-11 sm:size-12 rounded-xl border text-center text-[18px] font-mono font-bold text-[#141414] outline-none transition-all focus:ring-2 focus:ring-[#F04D23]/20 focus:border-[#F04D23] bg-white shadow-xs ${
                  error
                    ? "border-red-400 bg-red-50/20 text-red-700"
                    : digit
                    ? "border-[#141414]"
                    : "border-[#D8D7CE] hover:border-[#B0AFA9]"
                }`}
              />
            ))}
          </div>

          {error && (
            <div className="flex items-start gap-1.5 px-2.5 py-1.5 rounded-lg bg-red-50 border border-red-200 mt-1">
              <span className="mt-1 size-1.5 rounded-full bg-red-500 shrink-0" />
              <p className="text-[11px] text-red-600 leading-snug">{error}</p>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={isPending || otp.length !== 6}
          className="w-full h-9.5 rounded-full bg-[#141414] text-white text-[12.5px] font-semibold hover:bg-[#282828] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-2 shadow-sm cursor-pointer"
        >
          {isPending ? "Verifying…" : "Confirm email"}
        </button>
      </form>

      <div className="mt-5 text-center">
        {resendMsg ? (
          <p className="text-[12px] text-emerald-700 font-medium">{resendMsg}</p>
        ) : (
          <button
            onClick={() => {
              setError(null);
              setResendMsg(null);
              startResend(async () => {
                await authApi.resendOtp({ email });
                setResendMsg("A new 6-digit code was sent.");
              });
            }}
            disabled={isResending}
            className="text-[12px] font-semibold text-[#141414] hover:underline underline-offset-4 disabled:opacity-50 cursor-pointer"
          >
            {isResending ? "Resending code…" : "Didn't get the code? Resend"}
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Verified step ─────────────────────────────────────────── */
function VerifiedStep() {
  return (
    <div className="w-full max-w-[340px]">
      <div className="mb-5">
        <h1 className="text-[1.2rem] sm:text-[1.35rem] font-bold tracking-[-0.025em] text-[#141414] mb-1">
          Account ready
        </h1>
        <p className="text-[12px] sm:text-[12.5px] text-[#7A7973] leading-relaxed">
          Your student profile is verified. Sign in to start documenting your SWEP/SIWES training logbook.
        </p>
      </div>
      <Link href="/login"
        className="inline-flex w-full items-center justify-center h-9.5 rounded-full bg-[#141414] text-white text-[12.5px] font-semibold hover:bg-[#282828] active:scale-[0.99] transition-all shadow-sm">
        Sign in to your account →
      </Link>
    </div>
  );
}

/* ── Signup form ─────────────────────────────────────────── */
type FormState = Omit<StudentSignupPayload, "department_id"> & {
  department_id: number | "";
  confirmPassword: string;
};

const INITIAL: FormState = {
  first_name: "", last_name: "", matric_no: "", email: "",
  department_id: "", programme: "SWEP", password: "", confirmPassword: "",
};

type Step = "form" | "otp" | "done";

export default function SignupPage() {
  const [isPending, startTransition] = useTransition();
  const [step, setStep] = useState<Step>("form");
  const [form, setForm] = useState<FormState>(INITIAL);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [depts, setDepts] = useState<Department[]>(DEFAULT_DEPTS);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);

  useEffect(() => {
    authApi.departments().then((res) => {
      if (res.ok && res.data && res.data.length > 0) {
        setDepts(res.data);
      }
    }).catch(() => {
      // Keep DEFAULT_DEPTS fallback
    });
  }, []);

  const set = (key: keyof FormState) => (val: string) => setForm((f) => ({ ...f, [key]: val }));

  function validate(): boolean {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!form.first_name.trim()) e.first_name = "Required.";
    if (!form.last_name.trim()) e.last_name = "Required.";
    if (!form.matric_no.trim()) e.matric_no = "Required.";
    if (!form.email.includes("@")) e.email = "Enter a valid student email.";
    if (!form.department_id) e.department_id = "Select your department.";
    if (form.password.length < 8) e.password = "Min 8 chars.";
    if (form.password !== form.confirmPassword) e.confirmPassword = "Passwords do not match.";
    setFieldErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGlobalError(null);
    if (!validate()) return;
    const { confirmPassword: _c, ...rest } = form;
    const payload: StudentSignupPayload = { ...rest, department_id: rest.department_id as number };
    startTransition(async () => {
      const res = await authApi.studentSignup(payload);
      if (!res.ok) {
        if (res.errors) {
          const mapped: Partial<Record<keyof FormState, string>> = {};
          for (const [k, msgs] of Object.entries(res.errors)) mapped[k as keyof FormState] = msgs[0];
          setFieldErrors(mapped);
        } else setGlobalError(res.message);
        return;
      }
      setStep("otp");
    });
  }

  /* Shared right-panel wrapper */
  const RightPanel = ({ children }: { children: React.ReactNode }) => (
    <div className="min-h-screen lg:grid lg:grid-cols-[340px_1fr] xl:grid-cols-[380px_1fr] font-sans selection:bg-[#F04D23] selection:text-white">
      <AuthBrandPanel variant="signup" />
      <div className="min-h-screen bg-[#EDECE6] flex flex-col">
        <MobileAuthBar />
        <div className="flex-1 flex items-center justify-center px-4 sm:px-8 py-8 sm:py-12 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );

  if (step === "otp") return <RightPanel><OtpStep email={form.email} onVerified={() => setStep("done")} /></RightPanel>;
  if (step === "done") return <RightPanel><VerifiedStep /></RightPanel>;

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[340px_1fr] xl:grid-cols-[380px_1fr] font-sans selection:bg-[#F04D23] selection:text-white">
      <AuthBrandPanel variant="signup" />
      <div className="min-h-screen bg-[#EDECE6] flex flex-col">
        <MobileAuthBar />

        <div className="flex-1 flex items-center justify-center px-4 sm:px-8 py-8 sm:py-12 overflow-y-auto">
          <div className="w-full max-w-[340px]">
            {/* Heading */}
            <div className="mb-5">
              <h1 className="text-[1.2rem] sm:text-[1.35rem] font-bold tracking-[-0.025em] text-[#141414] mb-1">
                Create account
              </h1>
              <p className="text-[12px] sm:text-[12.5px] text-[#7A7973] leading-relaxed">
                Student registration for SWEP and SIWES.
              </p>
            </div>

            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3">
              {/* Name row */}
              <div className="grid grid-cols-2 gap-2.5">
                <Field label="First name" id="first_name" error={fieldErrors.first_name}>
                  <input id="first_name" value={form.first_name} onChange={(e) => set("first_name")(e.target.value)}
                    autoComplete="given-name" placeholder="Ada" className={inputCls(!!fieldErrors.first_name)} />
                </Field>
                <Field label="Last name" id="last_name" error={fieldErrors.last_name}>
                  <input id="last_name" value={form.last_name} onChange={(e) => set("last_name")(e.target.value)}
                    autoComplete="family-name" placeholder="Okafor" className={inputCls(!!fieldErrors.last_name)} />
                </Field>
              </div>

              {/* Matric + Programme */}
              <div className="grid grid-cols-2 gap-2.5">
                <Field label="Matric number" id="matric_no" error={fieldErrors.matric_no}>
                  <input id="matric_no" value={form.matric_no} onChange={(e) => set("matric_no")(e.target.value)}
                    autoComplete="off" placeholder="ENG/2021/001" className={inputCls(!!fieldErrors.matric_no)} />
                </Field>
                <Field label="Programme" id="programme">
                  <select id="programme" value={form.programme} onChange={(e) => set("programme")(e.target.value)}
                    className={inputCls()}>
                    <option value="SWEP">SWEP</option>
                    <option value="SIWES">SIWES</option>
                  </select>
                </Field>
              </div>

              {/* Email */}
              <Field label="Student email" id="email" error={fieldErrors.email}>
                <input id="email" type="email" inputMode="email" value={form.email}
                  onChange={(e) => set("email")(e.target.value)} autoComplete="email"
                  placeholder="you@student.oauife.edu.ng" className={inputCls(!!fieldErrors.email)} />
              </Field>

              {/* Department */}
              <Field label="Department" id="department_id" error={fieldErrors.department_id}>
                <select id="department_id" value={form.department_id}
                  onChange={(e) => setForm((f) => ({ ...f, department_id: Number(e.target.value) || "" }))}
                  className={inputCls(!!fieldErrors.department_id)}>
                  <option value="">Select department…</option>
                  {depts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </Field>

              {/* Passwords with Eye Toggles */}
              <div className="grid grid-cols-2 gap-2.5">
                <Field label="Password" id="password" error={fieldErrors.password}>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={(e) => set("password")(e.target.value)}
                      autoComplete="new-password"
                      placeholder="••••••••"
                      className={`${inputCls(!!fieldErrors.password)} pr-8.5`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-[#9A9990] hover:text-[#141414] transition-colors"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                    </button>
                  </div>
                </Field>

                <Field label="Confirm" id="confirmPassword" error={fieldErrors.confirmPassword}>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={form.confirmPassword}
                      onChange={(e) => set("confirmPassword")(e.target.value)}
                      autoComplete="new-password"
                      placeholder="••••••••"
                      className={`${inputCls(!!fieldErrors.confirmPassword)} pr-8.5`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-[#9A9990] hover:text-[#141414] transition-colors"
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showConfirmPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                    </button>
                  </div>
                </Field>
              </div>

              {globalError && (
                <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-red-50 border border-red-200">
                  <span className="mt-1 size-1.5 rounded-full bg-red-400 shrink-0" />
                  <p className="text-[11.5px] text-red-600 leading-relaxed">{globalError}</p>
                </div>
              )}

              <button type="submit" disabled={isPending}
                className="w-full h-9.5 rounded-full bg-[#141414] text-white text-[12.5px] font-semibold hover:bg-[#282828] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-1 shadow-sm cursor-pointer">
                {isPending ? "Creating account…" : "Create account"}
              </button>
            </form>

            <div className="my-5 border-t border-[#D8D7CE]" />

            <div className="space-y-2.5 text-center">
              <p className="text-[12px] text-[#7A7973]">
                Already registered?{" "}
                <Link href="/login" className="font-semibold text-[#141414] hover:underline underline-offset-4">
                  Sign in
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

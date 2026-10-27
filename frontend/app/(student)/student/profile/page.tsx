"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Eye, EyeOff, LogOut, CheckCircle2,
  Building, KeyRound, AlertCircle
} from "lucide-react";
import { authApi } from "@/lib/api/auth";
import { studentApi } from "@/lib/api/student";

function passwordStrength(pw: string): { level: 0 | 1 | 2 | 3; label: string; cls: string } {
  if (!pw) return { level: 0, label: "", cls: "" };
  if (pw.length < 8) return { level: 1, label: "Too short", cls: "bg-red-400" };
  const hasUpper = /[A-Z]/.test(pw);
  const hasNumber = /[0-9]/.test(pw);
  const hasSymbol = /[^A-Za-z0-9]/.test(pw);
  const score = [hasUpper, hasNumber, hasSymbol].filter(Boolean).length;
  if (score <= 1) return { level: 2, label: "Medium", cls: "bg-amber-400" };
  return { level: 3, label: "Strong", cls: "bg-emerald-500" };
}

function StrengthBar({ pw }: { pw: string }) {
  const { level, label, cls } = passwordStrength(pw);
  if (!pw) return null;
  return (
    <div className="space-y-1 pt-0.5">
      <div className="flex gap-1">
        {[1, 2, 3].map((n) => (
          <div
            key={n}
            className={`flex-1 h-1 rounded-full transition-all ${
              n <= level ? cls : "bg-[#E8E7E1]"
            }`}
          />
        ))}
      </div>
      <p className={`text-[10px] font-mono ${
        level === 1 ? "text-red-500" : level === 2 ? "text-amber-600" : "text-emerald-600"
      }`}>
        {label}
      </p>
    </div>
  );
}

function ProfileRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2.5 border-b border-[#F0EFE9] last:border-0 gap-1">
      <span className="text-[10px] font-mono font-medium text-[#7A7973] uppercase tracking-wider">{label}</span>
      <span className={`text-[12px] text-[#141414] ${mono ? "font-mono" : "font-medium"}`}>
        {value}
      </span>
    </div>
  );
}

export default function StudentProfilePage() {
  const router = useRouter();
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showCur, setShowCur] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  // Student Profile Info
  const [profile, setProfile] = useState<{
    name: string;
    matricNo: string;
    programme: string;
    department: string;
    email: string;
    coordinator: string;
    session: string;
  }>({
    name: "Student",
    matricNo: "—",
    programme: "SWEP",
    department: "—",
    email: "—",
    coordinator: "Loading…",
    session: "Pending announcement",
  });

  useEffect(() => {
    async function fetchProfileData() {
      try {
        const [profRes, cohortRes] = await Promise.all([
          authApi.studentProfile(),
          studentApi.getCurrentCohort(),
        ]);

        if (profRes.ok && profRes.data?.profile) {
          const p = profRes.data.profile;
          const dept = typeof p.department === "string" ? p.department : p.department?.name || "Department pending";
          const cohort = cohortRes.ok ? cohortRes.data?.cohort : null;
          const coordinator = cohortRes.ok
            ? cohort?.coordinator_name
              ? cohort.coordinator_name
              : "Not yet assigned"
            : "Unable to load coordinator";
          const session = cohortRes.ok && cohortRes.data?.cohort?.session
            ? cohortRes.data.cohort.session
            : "Pending cohort launch";

          setProfile({
            name: `${p.account.first_name} ${p.account.last_name}`.trim(),
            matricNo: p.matric_no,
            programme: p.programme,
            department: dept,
            email: p.account.email,
            coordinator,
            session,
          });
        }
      } catch {
        // Retain fallback profile
      }
    }
    fetchProfileData();
  }, []);

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPwError(null);
    setPwSuccess(false);

    if (newPw.length < 8) {
      setPwError("New password must be at least 8 characters.");
      return;
    }
    if (newPw !== confirmPw) {
      setPwError("Passwords do not match.");
      return;
    }

    setSaving(true);
    const res = await authApi.changePassword({
      current_password: currentPw,
      new_password: newPw,
    });
    setSaving(false);

    if (res.ok) {
      setPwSuccess(true);
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
    } else {
      setPwError(
        res.message === "current_password_invalid"
          ? "The current password you entered is incorrect."
          : res.message || "Failed to update password. Please verify requirements."
      );
    }
  }

  async function handleSignOut() {
    await authApi.logout();
    router.replace("/login");
  }

  const inputCls = "w-full h-9.5 px-3 rounded-xl border border-[#D8D7CE] bg-white text-[12.5px] text-[#141414] placeholder:text-[#B0AFA9] outline-none transition-all focus:ring-2 focus:ring-[#F04D23]/15 focus:border-[#F04D23]";

  return (
    <div className="min-h-screen bg-[#F5F4EF] font-sans selection:bg-[#F04D23] selection:text-white text-[#141414] py-8 px-4 sm:px-6">
      <div className="max-w-[780px] mx-auto space-y-5">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/student"
            className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[#7A7973] hover:text-[#141414] transition-colors"
          >
            <ArrowLeft className="size-3.5" />
            <span>Dashboard</span>
          </Link>
        </div>

        {/* Profile Card Header */}
        <div className="bg-white rounded-2xl border border-[#E8E7E1] p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="size-12 rounded-full bg-[#141414] text-white flex items-center justify-center text-[14px] font-bold shrink-0">
              {profile.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "ST"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-[1.25rem] sm:text-[1.35rem] font-bold tracking-[-0.025em] text-[#141414]">
                  {profile.name}
                </h1>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {profile.programme} Enrolled
                </span>
              </div>
              <p className="text-[11.5px] text-[#7A7973] font-mono mt-0.5">
                {profile.matricNo} &middot; {profile.department}
              </p>
              <p className="text-[10.5px] text-[#9A9990]">Obafemi Awolowo University</p>
            </div>
          </div>

          <button
            onClick={handleSignOut}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-red-200 text-red-600 hover:bg-red-50 text-[11px] font-semibold transition-colors shrink-0 self-start sm:self-center cursor-pointer"
          >
            <LogOut className="size-3.5" />
            <span>Sign out</span>
          </button>
        </div>

        {/* Two Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          
          {/* Academic Info */}
          <div className="bg-white rounded-2xl border border-[#E8E7E1] p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-[#F0EFE9]">
              <Building className="size-4 text-[#141414]" />
              <h2 className="text-[13px] font-bold text-[#141414]">Academic Placement</h2>
            </div>

            <div className="space-y-0.5">
              <ProfileRow label="Matric Number" value={profile.matricNo} mono />
              <ProfileRow label="Programme" value={profile.programme} />
              <ProfileRow label="Academic Year" value={profile.session} />
              <ProfileRow label="Department" value={profile.department} />
              <ProfileRow label="Institutional Email" value={profile.email} mono />
              <ProfileRow label="Faculty Coordinator" value={profile.coordinator} />
            </div>
          </div>

          {/* Password Settings */}
          <div className="bg-white rounded-2xl border border-[#E8E7E1] p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-[#F0EFE9]">
              <KeyRound className="size-4 text-[#141414]" />
              <h2 className="text-[13px] font-bold text-[#141414]">Password Security</h2>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-3 pt-1">
              {pwSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] font-semibold text-emerald-800 flex items-center gap-1.5">
                  <CheckCircle2 className="size-3.5 shrink-0" />
                  <span>Password updated successfully.</span>
                </div>
              )}

              {pwError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-[11px] font-semibold text-red-600 flex items-center gap-1.5">
                  <AlertCircle className="size-3.5 shrink-0" />
                  <span>{pwError}</span>
                </div>
              )}

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-medium text-[#5A5954] uppercase tracking-wider">Current password</label>
                <div className="relative">
                  <input
                    type={showCur ? "text" : "password"}
                    required
                    value={currentPw}
                    onChange={(e) => setCurrentPw(e.target.value)}
                    placeholder="Enter current password"
                    className={inputCls}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCur(!showCur)}
                    className="absolute right-3 top-2.5 text-[#9A9990] hover:text-[#141414]"
                  >
                    {showCur ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-medium text-[#5A5954] uppercase tracking-wider">New password</label>
                <div className="relative">
                  <input
                    type={showNew ? "text" : "password"}
                    required
                    value={newPw}
                    onChange={(e) => setNewPw(e.target.value)}
                    placeholder="At least 8 characters"
                    className={inputCls}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-2.5 text-[#9A9990] hover:text-[#141414]"
                  >
                    {showNew ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                  </button>
                </div>
                <StrengthBar pw={newPw} />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-medium text-[#5A5954] uppercase tracking-wider">Confirm new password</label>
                <input
                  type="password"
                  required
                  value={confirmPw}
                  onChange={(e) => setConfirmPw(e.target.value)}
                  placeholder="Repeat new password"
                  className={inputCls}
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full mt-1 py-2 px-4 rounded-full bg-[#141414] text-white text-[12px] font-semibold hover:bg-[#282828] transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {saving ? "Updating…" : "Update password"}
              </button>
            </form>
          </div>

        </div>

      </div>
    </div>
  );
}

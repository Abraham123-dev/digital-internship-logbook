"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft, Calendar, CheckCircle2, X, AlertCircle,
  Clock, ShieldCheck, Check, Inbox
} from "lucide-react";
import { studentApi, type StudentAttendanceData } from "@/lib/api/student";

type AttendanceStatus = "present" | "absent" | "excused";

const STATUS_MAP: Record<AttendanceStatus, { label: string; cls: string; icon: React.ReactNode }> = {
  present: { label: "Present", cls: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: <CheckCircle2 className="size-3" /> },
  absent:  { label: "Absent",  cls: "bg-red-50 text-red-600 border-red-200",             icon: <X className="size-3" /> },
  excused: { label: "Excused", cls: "bg-blue-50 text-blue-700 border-blue-200",         icon: <AlertCircle className="size-3" /> },
};

function CodeDialog({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [verifying, setVerifying] = useState(false);

  function handleInput(index: number, val: string) {
    const char = val.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(-1);
    const next = [...digits];
    next[index] = char;
    setDigits(next);
    setError(null);
    if (char && index < 5) {
      document.getElementById(`code-box-${index + 1}`)?.focus();
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      document.getElementById(`code-box-${index - 1}`)?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    const pasted = e.clipboardData.getData("text").replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 6);
    const next = Array(6).fill("").map((_, i) => pasted[i] ?? "");
    setDigits(next);
    document.getElementById(`code-box-${Math.min(pasted.length, 5)}`)?.focus();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const code = digits.join("");
    if (code.length < 6) {
      setError("Enter the full 6-character code.");
      return;
    }
    setVerifying(true);
    const res = await studentApi.verifyAttendanceCode(code);
    setVerifying(false);

    if (res.ok) {
      setDone(true);
      onSuccess();
    } else {
      setError(res.message || "Invalid or expired attendance code.");
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-[#E8E7E1] max-w-[380px] w-full p-6 shadow-xl space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-[#F04D23]" />
            <h3 className="text-[14px] font-bold text-[#141414]">Enter Attendance Code</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#7A7973] hover:text-[#141414] transition-colors cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        {done ? (
          <div className="text-center py-5 space-y-3">
            <div className="size-10 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
              <Check className="size-5" />
            </div>
            <h4 className="text-[13px] font-bold text-[#141414]">Attendance Verified</h4>
            <p className="text-[12px] text-[#7A7973]">
              Your check-in has been authenticated and recorded for today&apos;s session.
            </p>
            <button
              onClick={onClose}
              className="mt-3 w-full py-2 rounded-full bg-[#141414] text-white text-[12px] font-semibold hover:bg-[#282828] transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <p className="text-[12px] text-[#5A5954] leading-relaxed">
              Enter the 6-character code announced by your coordinator for today&apos;s session.
            </p>

            <div className="flex justify-between gap-2" onPaste={handlePaste}>
              {digits.map((digit, i) => (
                <input
                  key={i}
                  id={`code-box-${i}`}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleInput(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  className="size-11 sm:size-12 rounded-xl border border-[#D8D7CE] text-center text-[16px] font-mono font-bold text-[#141414] uppercase focus:border-[#F04D23] focus:ring-2 focus:ring-[#F04D23]/15 focus:outline-none transition-all bg-white"
                />
              ))}
            </div>

            {error && (
              <p className="text-[11px] font-semibold text-red-500 flex items-center gap-1">
                <AlertCircle className="size-3.5 shrink-0" /> {error}
              </p>
            )}

            <div className="flex gap-2.5 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2 rounded-full border border-[#D8D7CE] text-[12px] font-semibold text-[#5A5954] hover:text-[#141414] hover:bg-[#FAF9F5] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={verifying}
                className="flex-1 py-2 rounded-full bg-[#141414] text-white text-[12px] font-semibold hover:bg-[#282828] transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {verifying ? "Checking…" : "Verify code"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function StudentAttendancePage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [attendance, setAttendance] = useState<StudentAttendanceData>({
    rate: 100,
    attended: 0,
    total: 0,
    activeSession: false,
    history: [],
  });

  async function loadAttendanceData() {
    setLoading(true);
    const res = await studentApi.getAttendance();
    if (res.ok && res.data) {
      setAttendance(res.data);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadAttendanceData();
  }, []);

  const presentCount = attendance.attended;
  const totalCoded = attendance.total;
  const pct = attendance.rate;

  return (
    <div className="min-h-screen bg-[#F5F4EF] font-sans selection:bg-[#F04D23] selection:text-white text-[#141414] py-8 px-4 sm:px-6">
      {dialogOpen && (
        <CodeDialog
          onClose={() => setDialogOpen(false)}
          onSuccess={() => loadAttendanceData()}
        />
      )}

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

          <button
            disabled={loading || attendance.checkedInToday}
            onClick={() => setDialogOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#141414] text-white text-[11px] font-semibold hover:bg-[#282828] transition-colors shadow-xs cursor-pointer"
          >
            <ShieldCheck className="size-3.5" />
            <span>{attendance.checkedInToday ? "Attendance verified" : "Enter code"}</span>
          </button>
        </div>

        {/* Hero Card */}
        <div className="bg-white rounded-2xl border border-[#E8E7E1] p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#7A7973]">
              SWEP Verification
            </span>
            <h1 className="text-[1.25rem] sm:text-[1.35rem] font-bold tracking-[-0.025em] text-[#141414] mt-0.5">
              Attendance Records
            </h1>
            <p className="text-[11.5px] text-[#7A7973] mt-0.5">
              Physical session presence authenticated with daily coordinator codes.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-[#FAF9F5] p-3 rounded-xl border border-[#E8E7E1]">
            <div className="text-right">
              <p className="text-[9.5px] font-mono text-[#7A7973] uppercase">Verification rate</p>
              <p className="text-[1.4rem] font-extrabold tracking-tight text-[#141414] leading-none">{pct}%</p>
              <p className="text-[10px] text-emerald-700 font-medium mt-0.5">{presentCount} of {totalCoded} sessions</p>
            </div>
            <div className="w-12 h-12 rounded-full border-2 border-emerald-500/20 border-t-emerald-600 flex items-center justify-center font-bold text-[11px] text-[#141414]">
              {pct}%
            </div>
          </div>
        </div>

        {/* Records List */}
        <div className="bg-white rounded-2xl border border-[#E8E7E1] shadow-xs overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[#F0EFE9] flex items-center justify-between">
            <h2 className="text-[13px] font-bold text-[#141414]">Session History</h2>
            <span className="text-[10.5px] text-[#7A7973]">Logged per coded class</span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-[12px] text-[#7A7973]">Loading session records…</div>
          ) : attendance.history.length === 0 ? (
            <div className="p-10 text-center space-y-2">
              <div className="size-10 rounded-full bg-[#F5F4EF] text-[#7A7973] mx-auto flex items-center justify-center">
                <Inbox className="size-5" />
              </div>
              <p className="text-[13px] font-semibold text-[#141414]">No attendance sessions recorded yet</p>
              <p className="text-[11.5px] text-[#7A7973] max-w-sm mx-auto">
                When your SWEP coordinator opens a daily check-in session, enter the 6-character code using the &ldquo;Enter code&rdquo; button above.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#F0EFE9]">
              {attendance.history.map((r) => {
                const { label, cls, icon } = STATUS_MAP[r.status] || STATUS_MAP.present;
                const d = new Date(r.date + "T00:00:00");
                const formattedDate = d.toLocaleDateString("en-NG", {
                  weekday: "long",
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  timeZone: "Africa/Lagos",
                });

                return (
                  <div key={r.date} className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-[#FAF9F5] transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-lg bg-[#F5F4EF] flex items-center justify-center text-[#7A7973] shrink-0">
                        <Calendar className="size-4" />
                      </div>
                      <div>
                        <p className="text-[12.5px] font-semibold text-[#141414]">{formattedDate}</p>
                        {r.time && <p className="text-[10.5px] text-[#7A7973] font-mono">Logged at {r.time}</p>}
                        {r.note && <p className="text-[10.5px] text-[#7A7973] italic">{r.note}</p>}
                      </div>
                    </div>

                    <div className="flex items-center self-start sm:self-center">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${cls}`}>
                        {icon}
                        <span>{label}</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft, Calendar, ShieldCheck, Clock, Users,
  CheckCircle2, XCircle, AlertCircle, RefreshCw, X
} from "lucide-react";
import { CoordinatorShell } from "@/components/coordinator/CoordinatorShell";
import { AttendanceSkeleton } from "@/components/coordinator/CoordinatorSkeletons";
import { coordinatorApi, type AttendanceSession } from "@/lib/api/coordinator";

export default function CoordinatorAttendancePage() {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<AttendanceSession | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(120); // seconds
  const [codeActive, setCodeActive] = useState(true);

  // Override modal
  const [overrideModal, setOverrideModal] = useState<{
    studentId: string;
    studentName: string;
  } | null>(null);
  const [overrideStatus, setOverrideStatus] = useState<"present" | "excused">("present");
  const [overrideReason, setOverrideReason] = useState("");

  useEffect(() => {
    let mounted = true;
    async function load() {
      const res = await coordinatorApi.getAttendanceSession();
      if (mounted && res.ok) {
        setSession(res.data);
        setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  // Timer countdown simulation
  useEffect(() => {
    if (!codeActive || timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setCodeActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [codeActive, timeLeft]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeFormatted = `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;

  async function handleGenerateNewCode(duration: number) {
    const res = await coordinatorApi.generateAttendanceCode(duration);
    if (res.ok && session) {
      setSession({
        ...session,
        code: res.data.code,
        active: true,
      });
      setTimeLeft(duration * 60);
      setCodeActive(true);
    }
  }

  async function handleConfirmOverride() {
    if (!overrideModal || !overrideReason.trim()) return;
    await coordinatorApi.overrideAttendance(overrideModal.studentId, overrideStatus, overrideReason);
    if (session) {
      setSession({
        ...session,
        records: session.records.map((r) =>
          r.studentId === overrideModal.studentId
            ? { ...r, status: overrideStatus, reason: overrideReason }
            : r
        ),
      });
    }
    setOverrideModal(null);
    setOverrideReason("");
  }

  return (
    <CoordinatorShell
      title="Daily Attendance"
      subtitle="Generate attendance codes and verify workshop presence"
    >
      <div className="space-y-6">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/coordinator"
            className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[#7A7973] hover:text-[#141414] transition-colors"
          >
            <ArrowLeft className="size-3.5" />
            <span>Overview</span>
          </Link>
        </div>

        {loading || !session ? (
          <AttendanceSkeleton />
        ) : (
          <div className="space-y-6">
            
            {/* Active Code Generation Hero Box */}
            <div className="bg-white rounded-2xl border border-[#E8E7E1] p-6 sm:p-8 shadow-xs flex flex-col items-center text-center space-y-4">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#7A7973]">
                Today&apos;s Attendance Code
              </span>

              {codeActive ? (
                <>
                  <div className="space-y-1">
                    <p className="text-[11px] text-[#7A7973]">Students enter this 6-character code in their attendance portal</p>
                    <div className="font-mono text-[2.5rem] sm:text-[3rem] font-black tracking-[0.25em] text-[#141414] bg-[#FAF9F5] border-2 border-dashed border-[#D8D7CE] px-8 py-3 rounded-2xl inline-block shadow-xs">
                      {session.code}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-[12px]">
                    <div className="flex items-center gap-1.5 text-amber-700 font-semibold bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                      <Clock className="size-3.5" />
                      <span>Expires in {timeFormatted}</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-emerald-700 font-semibold bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                      <Users className="size-3.5" />
                      <span>{session.presentCount} of {session.totalStudents} checked in</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setCodeActive(false)}
                    className="px-4 py-1.5 rounded-full border border-red-200 text-red-600 hover:bg-red-50 text-[11px] font-semibold transition-colors cursor-pointer"
                  >
                    End session
                  </button>
                </>
              ) : (
                <div className="space-y-3 py-2">
                  <div className="size-10 rounded-full bg-slate-100 text-[#7A7973] mx-auto flex items-center justify-center">
                    <Clock className="size-5" />
                  </div>
                  <h3 className="text-[14px] font-bold text-[#141414]">No active code</h3>
                  <p className="text-[12px] text-[#7A7973] max-w-sm">
                    Generate a new time-limited attendance code for today&apos;s session.
                  </p>
                  <div className="flex gap-2 justify-center pt-1">
                    <button
                      onClick={() => handleGenerateNewCode(1)}
                      className="px-3.5 py-1.5 rounded-full border border-[#D8D7CE] text-[11px] font-semibold text-[#141414] hover:bg-white cursor-pointer"
                    >
                      1-minute code
                    </button>
                    <button
                      onClick={() => handleGenerateNewCode(2)}
                      className="px-3.5 py-1.5 rounded-full border border-[#D8D7CE] text-[11px] font-semibold text-[#141414] hover:bg-white cursor-pointer"
                    >
                      2-minute code
                    </button>
                    <button
                      onClick={() => handleGenerateNewCode(3)}
                      className="px-4 py-1.5 rounded-full bg-[#141414] text-white text-[11px] font-semibold hover:bg-[#282828] shadow-xs cursor-pointer"
                    >
                      Generate 3-minute code
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Attendance Roster */}
            <div className="bg-white rounded-2xl border border-[#E8E7E1] shadow-xs overflow-hidden">
              <div className="px-5 py-3.5 border-b border-[#F0EFE9] flex items-center justify-between">
                <div>
                  <h2 className="text-[13px] font-bold text-[#141414]">Session Roster</h2>
                  <p className="text-[10.5px] text-[#7A7973]">Attendance records for today</p>
                </div>
                <span className="text-[11px] font-mono text-[#7A7973]">
                  {session.presentCount} present &middot; {session.totalStudents - session.presentCount} absent
                </span>
              </div>

              <div className="divide-y divide-[#F0EFE9]">
                {session.records.map((r) => (
                  <div
                    key={r.studentId}
                    className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-[#FAF9F5] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-full bg-[#141414] text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                        {r.studentName.split(" ").map((n) => n[0]).join("")}
                      </div>
                      <div>
                        <p className="text-[12.5px] font-semibold text-[#141414]">{r.studentName}</p>
                        <p className="text-[10.5px] text-[#7A7973] font-mono">{r.matricNo}</p>
                        {r.reason && (
                          <p className="text-[10.5px] text-blue-700 italic mt-0.5">Note: {r.reason}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-start sm:self-center">
                      {r.status === "present" ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="size-2.5" /> Present ({r.time || "Code verified"})
                        </span>
                      ) : r.status === "excused" ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                          <AlertCircle className="size-2.5" /> Excused
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200">
                          <XCircle className="size-2.5" /> Absent
                        </span>
                      )}

                      <button
                        onClick={() => setOverrideModal({ studentId: r.studentId, studentName: r.studentName })}
                        className="text-[10.5px] font-semibold text-[#7A7973] hover:text-[#141414] underline underline-offset-2 ml-1 cursor-pointer"
                      >
                        Override
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

      </div>

      {/* Manual Override Modal */}
      {overrideModal && (
        <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-[2px] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E8E7E1] max-w-[380px] w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#F0EFE9]">
              <h3 className="text-[13px] font-bold text-[#141414]">Attendance Override</h3>
              <button
                onClick={() => setOverrideModal(null)}
                className="p-1 text-[#7A7973] hover:text-[#141414] cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <p className="text-[12px] text-[#5A5954]">
              Change attendance status for <strong className="text-[#141414]">{overrideModal.studentName}</strong>.
            </p>

            <div className="space-y-1">
              <label className="text-[10px] font-medium text-[#5A5954] uppercase tracking-wider">Status</label>
              <select
                value={overrideStatus}
                onChange={(e) => setOverrideStatus(e.target.value as "present" | "excused")}
                className="w-full h-9 px-3 rounded-xl border border-[#D8D7CE] bg-white text-[12px] text-[#141414] font-medium outline-none cursor-pointer"
              >
                <option value="present">Present</option>
                <option value="excused">Excused</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-medium text-[#5A5954] uppercase tracking-wider">
                Reason *
              </label>
              <input
                type="text"
                required
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder="e.g. Approved medical excuse or department duty"
                className="w-full h-9 px-3 rounded-xl border border-[#D8D7CE] bg-white text-[12px] text-[#141414] outline-none"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setOverrideModal(null)}
                className="flex-1 py-2 rounded-full border border-[#D8D7CE] text-[12px] font-semibold text-[#5A5954] hover:bg-[#FAF9F5] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!overrideReason.trim()}
                onClick={handleConfirmOverride}
                className="flex-1 py-2 rounded-full bg-[#141414] text-white text-[12px] font-semibold hover:bg-[#282828] shadow-xs disabled:opacity-40 cursor-pointer"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </CoordinatorShell>
  );
}

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users, CheckSquare, Clock, Calendar, ArrowUpRight,
  CheckCircle2, RotateCcw, ChevronRight, AlertCircle,
  FileText, ShieldCheck, Star
} from "lucide-react";
import { CoordinatorShell } from "@/components/coordinator/CoordinatorShell";
import { DashboardSkeleton } from "@/components/coordinator/CoordinatorSkeletons";
import { coordinatorApi } from "@/lib/api/coordinator";

export default function CoordinatorDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    stats: {
      enrolledStudents: number;
      pendingReviews: number;
      pendingExtensions: number;
      overdueWeeks: number;
      averageAttendance: number;
    };
    recentSubmissions: Array<{
      id: string;
      studentName: string;
      matricNo: string;
      weekNumber: number;
      dates: string;
      tasksSummary: string;
      status: "PENDING_REVIEW" | "APPROVED" | "RETURNED";
      submittedAt: string;
    }>;
    cohortInfo: {
      programme: "SWEP" | "SIWES";
      cycle: string;
      weekNumber: number;
      totalWeeks: number;
      submissionDeadline: string;
    };
  } | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      const res = await coordinatorApi.getDashboardData();
      if (mounted && res.ok) {
        setData(res.data);
        setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <CoordinatorShell
      title="Coordinator Overview"
      subtitle="SWEP 2024/2025 &middot; Department of Computer Science & Engineering"
    >
      {loading || !data ? (
        <DashboardSkeleton />
      ) : (
        <div className="space-y-6">
          
          {/* Active Attendance Session Banner (SWEP) */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 p-4 rounded-2xl bg-white border border-[#E8E7E1] shadow-xs">
            <div className="flex items-center gap-3">
              <span className="size-2 rounded-full bg-[#F04D23] animate-pulse shrink-0" />
              <div>
                <p className="text-[13px] font-semibold text-[#141414]">Daily Attendance Session is Active</p>
                <p className="text-[11px] text-[#7A7973]">
                  Code <strong className="font-mono text-[#141414]">K9X2P4</strong> expires in 2 minutes &middot; 24 of 34 students checked in.
                </p>
              </div>
            </div>
            <Link
              href="/coordinator/attendance"
              className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#141414] text-white text-[11px] font-semibold hover:bg-[#282828] transition-colors"
            >
              <span>Manage session</span>
              <ChevronRight className="size-3.5" />
            </Link>
          </div>

          {/* 4 Balanced Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-[#E8E7E1] p-4 shadow-xs">
              <p className="text-[10px] font-mono font-medium text-[#7A7973] uppercase tracking-wider">Enrolled Students</p>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-[1.5rem] font-extrabold tracking-[-0.035em] text-[#141414]">{data.stats.enrolledStudents}</span>
                <span className="text-[11px] text-[#7A7973]">students</span>
              </div>
              <p className="text-[10.5px] text-[#7A7973] mt-0.5">SWEP 2024 cohort</p>
            </div>

            <div className="bg-white rounded-2xl border border-[#E8E7E1] p-4 shadow-xs">
              <p className="text-[10px] font-mono font-medium text-[#7A7973] uppercase tracking-wider">Awaiting Review</p>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-[1.5rem] font-extrabold tracking-[-0.035em] text-[#141414]">{data.stats.pendingReviews}</span>
                <span className="text-[11px] text-[#7A7973]">submissions</span>
              </div>
              <p className="text-[10.5px] text-amber-700 font-medium mt-0.5">Weekly logbooks to evaluate</p>
            </div>

            <div className="bg-white rounded-2xl border border-[#E8E7E1] p-4 shadow-xs">
              <p className="text-[10px] font-mono font-medium text-[#7A7973] uppercase tracking-wider">Extension Requests</p>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-[1.5rem] font-extrabold tracking-[-0.035em] text-[#141414]">{data.stats.pendingExtensions}</span>
                <span className="text-[11px] text-[#7A7973]">pending</span>
              </div>
              <p className="text-[10.5px] text-[#7A7973] mt-0.5">Deadline extension appeals</p>
            </div>

            <div className="bg-white rounded-2xl border border-[#E8E7E1] p-4 shadow-xs">
              <p className="text-[10px] font-mono font-medium text-[#7A7973] uppercase tracking-wider">Average Attendance</p>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-[1.5rem] font-extrabold tracking-[-0.035em] text-[#141414]">{data.stats.averageAttendance}%</span>
                <span className="text-[11px] text-[#7A7973]">cohort average</span>
              </div>
              <p className="text-[10.5px] text-emerald-700 font-medium mt-0.5">Meets 75% requirement</p>
            </div>
          </div>

          {/* Lower 12-Column Split: Submissions Queue & Current Cohort Details */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left 7 Cols: Weekly Submissions Waiting for Review */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-[#E8E7E1] shadow-xs overflow-hidden flex flex-col">
              <div className="px-5 py-4 border-b border-[#F0EFE9] flex items-center justify-between">
                <div>
                  <h3 className="text-[13px] font-bold text-[#141414]">Submissions Awaiting Review</h3>
                  <p className="text-[11px] text-[#7A7973]">Weekly logbooks submitted by students</p>
                </div>
                <Link
                  href="/coordinator/students"
                  className="text-[11px] font-semibold text-[#141414] hover:underline flex items-center gap-1"
                >
                  View all students <ArrowUpRight className="size-3.5" />
                </Link>
              </div>

              {data.recentSubmissions.length === 0 ? (
                <div className="p-8 text-center space-y-1">
                  <p className="text-[13px] font-bold text-[#141414]">No submissions to review</p>
                  <p className="text-[11.5px] text-[#7A7973]">All submitted weekly logbooks have been reviewed.</p>
                </div>
              ) : (
                <div className="divide-y divide-[#F0EFE9] flex-1">
                  {data.recentSubmissions.map((sub) => (
                    <div key={sub.id} className="p-4 sm:p-5 flex items-start gap-3.5 hover:bg-[#FAF9F5] transition-colors">
                      <div className="size-8 rounded-full bg-[#141414] text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                        {sub.studentName.split(" ").map((n) => n[0]).join("")}
                      </div>

                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <p className="text-[13px] font-bold text-[#141414] truncate">{sub.studentName}</p>
                            <p className="text-[10.5px] text-[#7A7973] font-mono">{sub.matricNo} &middot; Week {sub.weekNumber}</p>
                          </div>
                          <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                            sub.status === "PENDING_REVIEW"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-emerald-50 text-emerald-700 border-emerald-200"
                          }`}>
                            <Clock className="size-2.5" />
                            <span>{sub.status === "PENDING_REVIEW" ? "Awaiting review" : "Approved"}</span>
                          </span>
                        </div>

                        <p className="text-[12px] text-[#5A5954] line-clamp-2 leading-relaxed">
                          {sub.tasksSummary}
                        </p>

                        <div className="flex items-center justify-between pt-1 text-[10.5px]">
                          <span className="text-[#9A9990]">{sub.dates} &middot; Submitted {sub.submittedAt}</span>
                          <Link
                            href={`/coordinator/review/${sub.id}`}
                            className="inline-flex items-center gap-1 font-semibold text-[#141414] hover:underline"
                          >
                            Review submission <ChevronRight className="size-3" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right 5 Cols: Cohort Info & Quick Links */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Cohort Details Card */}
              <div className="bg-white rounded-2xl border border-[#E8E7E1] p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#F0EFE9]">
                  <h3 className="text-[13px] font-bold text-[#141414]">Current Cohort</h3>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Active
                  </span>
                </div>

                <div className="space-y-2 text-[12px]">
                  <div className="flex justify-between py-1 border-b border-[#F0EFE9]">
                    <span className="text-[#7A7973]">Programme</span>
                    <span className="font-semibold text-[#141414]">SWEP (On-Campus)</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#F0EFE9]">
                    <span className="text-[#7A7973]">Academic cycle</span>
                    <span className="font-semibold text-[#141414]">{data.cohortInfo.cycle}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#F0EFE9]">
                    <span className="text-[#7A7973]">Timeline</span>
                    <span className="font-semibold text-[#141414]">Week {data.cohortInfo.weekNumber} of {data.cohortInfo.totalWeeks}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-[#7A7973]">Next submission deadline</span>
                    <span className="font-semibold text-[#141414]">{data.cohortInfo.submissionDeadline}</span>
                  </div>
                </div>
              </div>

              {/* Action Quick Links */}
              <div className="bg-white rounded-2xl border border-[#E8E7E1] p-5 shadow-xs space-y-3">
                <h3 className="text-[13px] font-bold text-[#141414]">Actions</h3>
                <div className="space-y-2">
                  {[
                    { label: "Enrolled students", href: "/coordinator/students", icon: <Users className="size-3.5" /> },
                    { label: "Extension requests", href: "/coordinator/extensions", icon: <Clock className="size-3.5" /> },
                    { label: "Daily attendance codes", href: "/coordinator/attendance", icon: <Calendar className="size-3.5" /> },
                    { label: "Cohort schedule & deadlines", href: "/coordinator/cohort", icon: <CheckSquare className="size-3.5" /> },
                  ].map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="flex items-center justify-between p-3 rounded-xl border border-[#E8E7E1] hover:border-[#D8D7CE] hover:bg-[#FAF9F5] transition-colors group"
                    >
                      <div className="flex items-center gap-2.5 text-[12px] font-medium text-[#141414]">
                        <span className="text-[#7A7973] group-hover:text-[#141414] transition-colors">{link.icon}</span>
                        <span>{link.label}</span>
                      </div>
                      <ChevronRight className="size-3.5 text-[#9A9990] group-hover:text-[#141414] group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  ))}
                </div>
              </div>

            </div>

          </div>

        </div>
      )}
    </CoordinatorShell>
  );
}

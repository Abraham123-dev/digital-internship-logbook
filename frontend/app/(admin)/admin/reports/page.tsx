"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  FileSpreadsheet, Download, ArrowLeft,
  CheckCircle2, Award, Percent, Building
} from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminTableSkeleton } from "@/components/admin/AdminSkeletons";
import { adminApi, type DepartmentReportItem } from "@/lib/api/admin";

export default function AdminReportsPage() {
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<DepartmentReportItem[]>([]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      const res = await adminApi.getReports();
      if (!mounted) return;
      if (res.ok) setReports(res.data);
      setLoading(false);
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  function handleExportCSV() {
    if (!reports.length) return;
    const headers = [
      "Department",
      "Programme",
      "Enrolled Students",
      "Submission Rate (%)",
      "Missed Weeks",
      "Approved Extensions",
      "Average Score (%)",
      "Average Attendance (%)",
    ];

    const rows = reports.map((r) => [
      `"${r.department}"`,
      r.programme,
      r.enrolledStudents,
      r.submissionRate,
      r.missedWeeksCount,
      r.approvedExtensions,
      r.averageScore,
      r.averageAttendance ?? "N/A",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Logr_Reports_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <AdminShell
      title="Reports & Analytics"
      subtitle="Departmental submission rates, grading statistics, and attendance summaries"
      actions={
        <button
          onClick={handleExportCSV}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#141414] text-white text-[11px] font-semibold hover:bg-[#282828] transition-colors shadow-xs cursor-pointer"
        >
          <Download className="size-3.5" />
          <span>Export CSV</span>
        </button>
      }
    >
      <div className="space-y-6">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[#7A7973] hover:text-[#141414] transition-colors"
          >
            <ArrowLeft className="size-3.5" />
            <span>Overview</span>
          </Link>
        </div>

        {loading ? (
          <AdminTableSkeleton rows={4} />
        ) : (
          <div className="bg-white rounded-2xl border border-[#E8E7E1] shadow-xs overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[#F0EFE9] flex items-center justify-between">
              <div>
                <h2 className="text-[13px] font-bold text-[#141414]">Department Summary</h2>
                <p className="text-[11px] text-[#7A7973]">Current academic session</p>
              </div>
              <button
                onClick={handleExportCSV}
                className="text-[11px] font-semibold text-[#141414] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Download className="size-3" /> Export CSV
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-[12px]">
                <thead className="bg-[#FAF9F5] border-b border-[#F0EFE9] text-[#7A7973] text-[10px] font-mono uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3">Department</th>
                    <th className="px-4 py-3">Programme</th>
                    <th className="px-4 py-3">Enrolled</th>
                    <th className="px-4 py-3">Submission Rate</th>
                    <th className="px-4 py-3">Missed Weeks</th>
                    <th className="px-4 py-3">Approved Ext</th>
                    <th className="px-4 py-3">Avg Score</th>
                    <th className="px-5 py-3 text-right">Attendance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0EFE9]">
                  {reports.map((r, i) => (
                    <tr key={i} className="hover:bg-[#FAF9F5] transition-colors">
                      <td className="px-5 py-3.5 font-semibold text-[#141414]">
                        {r.department}
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="inline-block text-[9.5px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {r.programme}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-[#3A3934]">
                        {r.enrolledStudents} students
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="font-semibold text-emerald-700">{r.submissionRate}%</span>
                      </td>

                      <td className="px-4 py-3.5 text-[#7A7973]">
                        {r.missedWeeksCount}
                      </td>

                      <td className="px-4 py-3.5 text-[#7A7973]">
                        {r.approvedExtensions}
                      </td>

                      <td className="px-4 py-3.5 font-bold text-[#141414]">
                        {r.averageScore}%
                      </td>

                      <td className="px-5 py-3.5 text-right font-medium text-[#141414]">
                        {r.averageAttendance ? `${r.averageAttendance}%` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </AdminShell>
  );
}

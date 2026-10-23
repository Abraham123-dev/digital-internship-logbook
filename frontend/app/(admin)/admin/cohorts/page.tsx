"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Settings, Clock, Calendar, CheckCircle2,
  Users, Building, Plus, ArrowLeft
} from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminTableSkeleton } from "@/components/admin/AdminSkeletons";
import { adminApi, type AdminCohortItem } from "@/lib/api/admin";

export default function AdminCohortsPage() {
  const [loading, setLoading] = useState(true);
  const [cohorts, setCohorts] = useState<AdminCohortItem[]>([]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      const res = await adminApi.getCohorts();
      if (!mounted) return;
      if (res.ok) setCohorts(res.data);
      setLoading(false);
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <AdminShell
      title="Cohorts"
      subtitle="Active SWEP and SIWES programme cycles"
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
          <AdminTableSkeleton rows={2} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {cohorts.map((cohort) => (
              <div
                key={cohort.id}
                className="bg-white rounded-2xl border border-[#E8E7E1] p-5 sm:p-6 shadow-xs space-y-4 hover:border-[#D8D7CE] transition-all"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#7A7973]">
                      Academic Session {cohort.academicYear}
                    </span>
                    <h3 className="text-[14px] font-bold text-[#141414] mt-0.5">{cohort.name}</h3>
                  </div>

                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    <CheckCircle2 className="size-2.5" /> {cohort.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-[#FAF9F5] border border-[#E8E7E1] text-[11.5px]">
                  <div>
                    <span className="text-[#7A7973] block text-[10px] uppercase">Programme</span>
                    <span className="font-semibold text-[#141414]">{cohort.programme}</span>
                  </div>
                  <div>
                    <span className="text-[#7A7973] block text-[10px] uppercase">Departments</span>
                    <span className="font-semibold text-[#141414]">{cohort.departmentsCount} active</span>
                  </div>
                  <div>
                    <span className="text-[#7A7973] block text-[10px] uppercase">Enrolled Students</span>
                    <span className="font-semibold text-[#141414]">{cohort.studentsCount} students</span>
                  </div>
                  <div>
                    <span className="text-[#7A7973] block text-[10px] uppercase">Duration</span>
                    <span className="font-semibold text-[#141414]">{cohort.startDate} – {cohort.endDate}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] pt-1">
                  <span className="text-[#7A7973]">Submission deadline: Saturday 11:59 PM</span>
                  <span className="font-semibold text-[#141414]">Active</span>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </AdminShell>
  );
}

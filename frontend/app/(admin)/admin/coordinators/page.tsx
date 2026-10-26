"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Shield, Mail, Plus, CheckCircle2, ChevronRight,
  Search, Users, Building
} from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminTableSkeleton } from "@/components/admin/AdminSkeletons";
import { Pagination } from "@/components/ui/Pagination";
import { adminApi, type AdminCoordinatorItem } from "@/lib/api/admin";

export default function AdminCoordinatorsPage() {
  const [loading, setLoading] = useState(true);
  const [coordinators, setCoordinators] = useState<AdminCoordinatorItem[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(5);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      const res = await adminApi.getCoordinators({ page, pageSize });
      if (!mounted) return;
      if (res.ok) {
        setCoordinators(res.data.results);
        setTotalPages(res.data.totalPages);
        setTotalItems(res.data.total);
      }
      setLoading(false);
    }
    load();
    return () => {
      mounted = false;
    };
  }, [page, pageSize]);

  return (
    <AdminShell
      title="Coordinators"
      subtitle="Department coordinators managing SWEP and SIWES programmes"
      actions={
        <Link
          href="/admin/invitations"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-[#141414] text-white text-[12px] font-medium hover:bg-[#282828] transition-colors shadow-xs"
        >
          <Plus className="size-3.5" />
          <span>Invite Coordinator</span>
        </Link>
      }
    >
      <div className="space-y-5">
        
        {loading ? (
          <AdminTableSkeleton rows={4} />
        ) : (
          <div className="bg-white rounded-lg border border-[#E2E1DA] shadow-2xs overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[#F0EFE9] flex items-center justify-between">
              <h2 className="text-[13px] font-bold text-[#141414]">Department Coordinators</h2>
              <span className="text-[11px] font-mono text-[#7A7973]">{totalItems} active coordinators</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-[12px]">
                <thead className="bg-[#FAF9F5] border-b border-[#F0EFE9] text-[#7A7973] text-[10px] font-mono uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3">Coordinator</th>
                    <th className="px-4 py-3">Department</th>
                    <th className="px-4 py-3">Programme</th>
                    <th className="px-4 py-3">Assigned Students</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0EFE9]">
                  {coordinators.map((c) => (
                    <tr key={c.id} className="hover:bg-[#FAF9F5] transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-[#141414]">{c.name}</div>
                        <div className="text-[10.5px] text-[#7A7973] font-mono">{c.email} &middot; {c.staffId}</div>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="text-[#3A3934]">{c.department}</div>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="inline-block text-[9.5px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {c.programme}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="text-[#141414] font-medium">{c.enrolledStudentsCount} students</div>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center gap-1 text-[9.5px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="size-2.5" /> {c.status}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        <span className="text-[11px] text-[#7A7973] font-mono">
                          {c.joinedAt}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setPage}
        />

      </div>
    </AdminShell>
  );
}

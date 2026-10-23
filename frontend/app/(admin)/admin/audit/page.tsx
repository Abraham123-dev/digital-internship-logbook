"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  History, ArrowLeft, Filter, CheckCircle2,
  Shield, Clock, Search
} from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminTableSkeleton } from "@/components/admin/AdminSkeletons";
import { Pagination } from "@/components/ui/Pagination";
import { adminApi, type AdminAuditEntry } from "@/lib/api/admin";

export default function AdminAuditPage() {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<AdminAuditEntry[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(5);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [roleFilter, setRoleFilter] = useState("ALL");

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      const res = await adminApi.getAuditLog({
        page,
        pageSize,
        actorRole: roleFilter,
      });
      if (!mounted) return;
      if (res.ok) {
        setLogs(res.data.results);
        setTotalPages(res.data.totalPages);
        setTotalItems(res.data.total);
      }
      setLoading(false);
    }
    load();
    return () => {
      mounted = false;
    };
  }, [page, pageSize, roleFilter]);

  return (
    <AdminShell
      title="Audit Log"
      subtitle="Record of administrative, coordinator, and student operations"
    >
      <div className="space-y-5">
        
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

        {/* Filter Strip */}
        <div className="bg-white rounded-2xl border border-[#E8E7E1] p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-[12px] text-[#5A5954]">
            <History className="size-4 text-[#7A7973]" />
            <span>Filter by role:</span>
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            {["ALL", "ADMIN", "COORDINATOR", "STUDENT", "SYSTEM"].map((r) => (
              <button
                key={r}
                onClick={() => {
                  setRoleFilter(r);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-full text-[11px] font-semibold transition-colors cursor-pointer ${
                  roleFilter === r
                    ? "bg-[#141414] text-white"
                    : "border border-[#D8D7CE] text-[#5A5954] hover:bg-[#FAF9F5]"
                }`}
              >
                {r === "ALL" ? "All" : r.charAt(0) + r.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Table / List */}
        {loading ? (
          <AdminTableSkeleton rows={5} />
        ) : logs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E8E7E1] p-12 text-center space-y-2">
            <Shield className="size-8 text-[#9A9990] mx-auto" />
            <h3 className="text-[14px] font-bold text-[#141414]">No audit records found</h3>
            <p className="text-[12px] text-[#7A7973]">No events match this filter.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-[#E8E7E1] shadow-xs overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[#F0EFE9] flex items-center justify-between">
              <h2 className="text-[13px] font-bold text-[#141414]">System Events</h2>
              <span className="text-[11px] font-mono text-[#7A7973]">{totalItems} recorded events</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-[12px]">
                <thead className="bg-[#FAF9F5] border-b border-[#F0EFE9] text-[#7A7973] text-[10px] font-mono uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3">Timestamp</th>
                    <th className="px-4 py-3">User & Role</th>
                    <th className="px-4 py-3">Action</th>
                    <th className="px-4 py-3">Target</th>
                    <th className="px-4 py-3">IP Address</th>
                    <th className="px-5 py-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0EFE9]">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-[#FAF9F5] transition-colors">
                      <td className="px-5 py-3.5 font-mono text-[11px] text-[#7A7973]">
                        {log.timestamp}
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-[#141414]">{log.actor}</div>
                        <span className="inline-block text-[9.5px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 mt-0.5">
                          {log.role}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 font-mono text-[11.5px] font-bold text-[#141414]">
                        {log.action}
                      </td>

                      <td className="px-4 py-3.5 text-[#3A3934]">
                        {log.target}
                      </td>

                      <td className="px-4 py-3.5 font-mono text-[11px] text-[#7A7973]">
                        {log.ipAddress}
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        <span className="inline-flex items-center gap-1 text-[9.5px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="size-2.5" /> {log.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagination */}
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

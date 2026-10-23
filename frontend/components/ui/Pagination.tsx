"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems?: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize = 10,
  onPageChange,
  className = "",
}: PaginationProps) {
  if (totalPages <= 1 && (!totalItems || totalItems <= pageSize)) return null;

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = totalItems ? Math.min(currentPage * pageSize, totalItems) : currentPage * pageSize;

  // Generate page numbers with ellipsis
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("...");
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-white border border-[#E8E7E1] rounded-2xl shadow-xs text-[11.5px] ${className}`}
    >
      {/* Items count summary */}
      <div className="text-[#7A7973]">
        {totalItems != null ? (
          <span>
            Showing <strong className="text-[#141414]">{startItem}</strong> to{" "}
            <strong className="text-[#141414]">{endItem}</strong> of{" "}
            <strong className="text-[#141414]">{totalItems}</strong> entries
          </span>
        ) : (
          <span>
            Page <strong className="text-[#141414]">{currentPage}</strong> of{" "}
            <strong className="text-[#141414]">{totalPages}</strong>
          </span>
        )}
      </div>

      {/* Page controls */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-[#D8D7CE] text-[#5A5954] hover:text-[#141414] hover:bg-[#FAF9F5] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Previous page"
        >
          <ChevronLeft className="size-3.5" />
          <span>Previous</span>
        </button>

        <div className="flex items-center gap-1">
          {getPageNumbers().map((p, idx) => {
            if (p === "...") {
              return (
                <span key={`ellipsis-${idx}`} className="px-1 text-[#9A9990]">
                  &hellip;
                </span>
              );
            }
            const pageNum = p as number;
            const active = pageNum === currentPage;
            return (
              <button
                key={pageNum}
                type="button"
                onClick={() => onPageChange(pageNum)}
                className={`size-7 rounded-full text-[11px] font-semibold transition-colors flex items-center justify-center ${
                  active
                    ? "bg-[#141414] text-white"
                    : "text-[#5A5954] hover:bg-[#FAF9F5] hover:text-[#141414]"
                }`}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-[#D8D7CE] text-[#5A5954] hover:text-[#141414] hover:bg-[#FAF9F5] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Next page"
        >
          <span>Next</span>
          <ChevronRight className="size-3.5" />
        </button>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";

export function ReportFilterSheet({
  open,
  onClose,
  showCategories = true,
  showStatus = true,
  categories = [],
  statuses = [
    { id: "all", label: "All Status" },
    { id: "SUCCESS", label: "SUCCESS" },
    { id: "FAILED", label: "FAILED" },
    { id: "REFUND", label: "REFUND" },
  ],
  monthsFilter = [],
  selectedMonth,
  onMonthChange,
  selectedCategory,
  onCategoryChange,
  selectedStatus,
  onStatusChange,
  customFrom,
  onCustomFromChange,
  customTo,
  onCustomToChange,
  onReset,
  onApply,
}) {
  const [activeTab, setActiveTab] = useState("month");

  if (!open) return null;

  const hasCategories = showCategories && Array.isArray(categories) && categories.length > 0;
  const hasStatus = showStatus && Array.isArray(statuses) && statuses.length > 0;
  const hasSidebarTabs = hasCategories || hasStatus;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/50 backdrop-blur-xs justify-end sm:justify-center items-center">
      <div className="w-full max-w-app bg-surface rounded-t-3xl sm:rounded-2xl shadow-xl flex flex-col max-h-[85vh] overflow-hidden animate-in slide-in-from-bottom duration-300">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3.5">
          <h2 className="font-display text-[16px] font-bold text-text-1">Filter Options</h2>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-full border border-border flex items-center justify-center text-text-3 active:scale-95"
          >
            ✕
          </button>
        </div>

        
        <div className="flex flex-1 overflow-hidden min-h-[320px]">
         
          {hasSidebarTabs && (
            <div className="w-[125px] flex-none border-r border-border bg-[#f8f9fc] flex flex-col">
              <button
                type="button"
                onClick={() => setActiveTab("month")}
                className={`px-3 py-3.5 text-left text-[13px] font-bold transition border-b border-border/40 ${
                  activeTab === "month"
                    ? "bg-surface text-primary border-l-4 border-l-primary"
                    : "text-text-2 hover:bg-page"
                }`}
              >
                Month
              </button>
              {hasCategories && (
                <button
                  type="button"
                  onClick={() => setActiveTab("categories")}
                  className={`px-3 py-3.5 text-left text-[13px] font-bold transition border-b border-border/40 ${
                    activeTab === "categories"
                      ? "bg-surface text-primary border-l-4 border-l-primary"
                      : "text-text-2 hover:bg-page"
                  }`}
                >
                  Categories
                </button>
              )}
              {hasStatus && (
                <button
                  type="button"
                  onClick={() => setActiveTab("status")}
                  className={`px-3 py-3.5 text-left text-[13px] font-bold transition border-b border-border/40 ${
                    activeTab === "status"
                      ? "bg-surface text-primary border-l-4 border-l-primary"
                      : "text-text-2 hover:bg-page"
                  }`}
                >
                  Payment status
                </button>
              )}
            </div>
          )}

         
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            
            {(!hasSidebarTabs || activeTab === "month") && (
              <div className="space-y-3">
                {/* Custom Date Option */}
                <label className="flex items-center justify-between border-b border-border/50 pb-2.5 cursor-pointer">
                  <span className="text-[13.5px] font-medium text-text-1">Custom date</span>
                  <input
                    type="radio"
                    name="monthFilter"
                    checked={selectedMonth === "custom"}
                    onChange={() => onMonthChange("custom")}
                    className="h-4 w-4 accent-primary"
                  />
                </label>

                {selectedMonth === "custom" && (
                  <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl border border-border bg-page">
                    <div>
                      <label className="block text-[11px] font-bold text-text-3 mb-1">From</label>
                      <input
                        type="date"
                        value={customFrom}
                        onChange={(e) => onCustomFromChange(e.target.value)}
                        className="w-full text-[12px] p-1.5 rounded-lg border border-border bg-surface outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-text-3 mb-1">To</label>
                      <input
                        type="date"
                        value={customTo}
                        onChange={(e) => onCustomToChange(e.target.value)}
                        className="w-full text-[12px] p-1.5 rounded-lg border border-border bg-surface outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* All Time Option */}
                <label className="flex items-center justify-between border-b border-border/50 pb-2.5 cursor-pointer">
                  <span className="text-[13.5px] font-medium text-text-1">All Time</span>
                  <input
                    type="radio"
                    name="monthFilter"
                    checked={selectedMonth === "all"}
                    onChange={() => onMonthChange("all")}
                    className="h-4 w-4 accent-primary"
                  />
                </label>

                {/* Dynamic Previous Months */}
                {monthsFilter.map((mObj, idx) => {
                  const label =
                    typeof mObj === "string"
                      ? mObj
                      : mObj.month_year || mObj.label || `Month ${idx + 1}`;
                  const isSelected =
                    typeof selectedMonth === "object" && selectedMonth?.month_year === label;

                  return (
                    <label
                      key={idx}
                      className="flex items-center justify-between border-b border-border/50 pb-2.5 cursor-pointer"
                    >
                      <span className="text-[13.5px] font-medium text-text-1">{label}</span>
                      <input
                        type="radio"
                        name="monthFilter"
                        checked={isSelected}
                        onChange={() => onMonthChange(mObj)}
                        className="h-4 w-4 accent-primary"
                      />
                    </label>
                  );
                })}
              </div>
            )}

            {/* 2. CATEGORIES TAB */}
            {hasSidebarTabs && activeTab === "categories" && hasCategories && (
              <div className="space-y-3">
                <label className="flex items-center justify-between border-b border-border/50 pb-2.5 cursor-pointer">
                  <span className="text-[13.5px] font-medium text-text-1">All Categories</span>
                  <input
                    type="radio"
                    name="categoryFilter"
                    checked={selectedCategory === "all"}
                    onChange={() => onCategoryChange("all")}
                    className="h-4 w-4 accent-primary"
                  />
                </label>

                {categories.map((catName, idx) => (
                  <label
                    key={idx}
                    className="flex items-center justify-between border-b border-border/50 pb-2.5 cursor-pointer"
                  >
                    <span className="text-[13.5px] font-medium text-text-1">{catName}</span>
                    <input
                      type="radio"
                      name="categoryFilter"
                      checked={selectedCategory === catName}
                      onChange={() => onCategoryChange(catName)}
                      className="h-4 w-4 accent-primary"
                    />
                  </label>
                ))}
              </div>
            )}

            {/* 3. PAYMENT STATUS TAB */}
            {hasSidebarTabs && activeTab === "status" && hasStatus && (
              <div className="space-y-3">
                {statuses.map((st) => {
                  const stId = typeof st === "object" ? st.id : st;
                  const stLabel = typeof st === "object" ? st.label : st;

                  return (
                    <label
                      key={stId}
                      className="flex items-center justify-between border-b border-border/50 pb-2.5 cursor-pointer"
                    >
                      <span className="text-[13.5px] font-medium text-text-1">{stLabel}</span>
                      <input
                        type="radio"
                        name="statusFilter"
                        checked={selectedStatus === stId}
                        onChange={() => onStatusChange(stId)}
                        className="h-4 w-4 accent-primary"
                      />
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center gap-3 border-t border-border bg-surface p-3.5">
          <button
            type="button"
            onClick={onReset}
            className="flex-1 rounded-xl border border-border bg-page py-3 text-[13.5px] font-bold text-text-2 active:scale-98 transition"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={onApply}
            className="flex-1 rounded-xl bg-primary py-3 text-[13.5px] font-bold text-white shadow-xs active:scale-98 transition"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
}

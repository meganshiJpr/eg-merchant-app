"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { SubHeader } from "@/components/ui/SubHeader";
import { fetchRefundReport } from "@/features/reports/api";
import { ReportHeaderFilterBar } from "@/features/reports/components/ReportHeaderFilterBar";
import { ReportFilterSheet } from "@/features/reports/components/ReportFilterSheet";
import { useToast } from "@/components/ui/Toast";
import { inr } from "@/utils/format";
import { useTranslation } from "react-i18next";
import { formatRequestTime, generateMonthsList, getDateRange } from "@/utils/transaction";

export default function RefundReportPage() {
  const toast = useToast((t) => t.show);

  const { t } = useTranslation("errors")
  const [historyData, setHistoryData] = useState([]);
  const [refundMessage, setRefundMessage] = useState(
    "You refund is in progress, you may receive the refund within 3 business days."
  );
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  const [previousMonthsFilter, setPreviousMonthsFilter] = useState([]);
  const [dateTab, setDateTab] = useState("all");
  const [keyword, setKeyword] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);

  const [selectedMonth, setSelectedMonth] = useState("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");

  const [appliedFilters, setAppliedFilters] = useState({
    from: "",
    to: "",
    paymentStatus: "all",
    keyword: "",
  });

  const loadingRef = useRef(false);

  const loadRefundReport = useCallback(async (pageNum, filters, isAppend = false) => {
    if (isAppend && loadingRef.current) return;
    loadingRef.current = true;

    if (isAppend) {
      setLoadingMore(true);
    } else {
      setLoading(true);
      setError(null);
    }

    const payload = {
      page: pageNum,
      from: filters.from || "",
      to: filters.to || "",
      paymentStatus: filters.paymentStatus === "all" ? "" : (filters.paymentStatus || ""),
      keyword: filters.keyword || "",
    };

    console.log("Loading refund report with payload:", payload);

    try {
      const res = await fetchRefundReport(payload);

      if (res?.refund_message) {
        setRefundMessage(res.refund_message);
      }

      const rawItems = res?.history_data || res?.data?.history_data || res?.data || [];
      const items = Array.isArray(rawItems) ? rawItems : [];

      if (isAppend) {
        setHistoryData((prev) => [...prev, ...items]);
      } else {
        setHistoryData(items);
      }

      if (Array.isArray(res?.previousMonthsFilter) && res.previousMonthsFilter.length > 0) {
        setPreviousMonthsFilter(res.previousMonthsFilter);
      } else if (typeof res?.previousMonthsFilter === "number" && res.previousMonthsFilter > 0) {
        setPreviousMonthsFilter(generateMonthsList(res.previousMonthsFilter));
      } else {
        setPreviousMonthsFilter((prev) => (prev.length === 0 ? generateMonthsList(12) : prev));
      }

      const remainingNum = res?.remaining_pages !== undefined ? Number(res.remaining_pages) : null;
      if (remainingNum !== null && !isNaN(remainingNum)) {
        setHasMore(remainingNum > 0);
      } else {
        setHasMore(items.length > 0);
      }

      setPage(pageNum);
    } catch (err) {
      console.error("Error loading refund report:", err);
      if (!isAppend) setError("Failed to load refund report.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
      loadingRef.current = false;
    }
  }, []);

  useEffect(() => {
    loadRefundReport(1, appliedFilters, false);
  }, [appliedFilters, loadRefundReport]);

  useEffect(() => {
    const handleScroll = () => {
      if (loading || loadingMore || !hasMore || loadingRef.current) return;

      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      const fullHeight = document.documentElement.scrollHeight;

      if (scrollTop + windowHeight >= fullHeight - 120) {
        loadRefundReport(page + 1, appliedFilters, true);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [loading, loadingMore, hasMore, page, appliedFilters, loadRefundReport]);

  const handleSearch = (val) => {
    setKeyword(val);
    const newFilters = { ...appliedFilters, keyword: val.trim() };
    setAppliedFilters(newFilters);
  };

  const handleApplyFilters = () => {
    let fromDate = "";
    let toDate = "";

    if (selectedMonth === "custom") {
      fromDate = customFrom;
      toDate = customTo;
    } else if (typeof selectedMonth === "object" && selectedMonth !== null) {
      fromDate = selectedMonth.from || "";
      toDate = selectedMonth.to || "";
    }

    const newFilters = {
      from: fromDate,
      to: toDate,
      paymentStatus: selectedStatus,
      keyword: keyword.trim(),
    };

    setAppliedFilters(newFilters);
    setFilterOpen(false);
  };

  const handleResetFilters = () => {
    setSelectedMonth("all");
    setCustomFrom("");
    setCustomTo("");
    setSelectedStatus("all");
    const newFilters = {
      from: "",
      to: "",
      paymentStatus: "all",
      keyword: keyword.trim(),
    };
    setAppliedFilters(newFilters);
    setFilterOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#f4f5fa] pb-24 max-w-app mx-auto text-text-1">
      <SubHeader title="Refund Report" backHref="/reports" showImg={false} />

      <div className="p-4 space-y-4">
        <ReportHeaderFilterBar
          keyword={keyword}
          onKeywordChange={handleSearch}
          placeholder="Search Order ID or Refund ID"
          onFilterClick={() => setFilterOpen(true)}
          activeDateTab={dateTab}
          onDateTabChange={(tabId) => {
            setDateTab(tabId);
            setAppliedFilters((prev) => ({
              ...prev,
              ...getDateRange(tabId),
            }));
          }}
        />

        {loading && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <span className="h-8 w-8 animate-spin rounded-full border-3 border-border border-t-primary" />
            <span className="mt-3 text-[13px] font-medium text-text-2">Loading refund report...</span>
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
            <p className="text-[13px] font-medium text-rose-600">{error}</p>
            <button
              type="button"
              onClick={() => loadRefundReport(1, appliedFilters, false)}
              className="rounded-xl bg-primary px-4 py-2 text-[13px] font-bold text-white shadow-xs"
            >
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && historyData.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-surface shadow-xs text-text-3">
              <svg viewBox="0 0 24 24" className="h-7 w-7 fill-none stroke-current" strokeWidth="2">
                <path d="M3 10h10a5 5 0 0 1 5 5v2M3 10l6-6M3 10l6 6" />
              </svg>
            </div>
            <h3 className="mt-3 text-[15px] font-bold text-text-1">{t("REFUND_REQUESTS")}</h3>
            <p className="mt-1 text-[12.5px] text-text-3">{t("Filter_Query")}</p>
          </div>
        )}

        {!loading && !error && historyData.length > 0 && (
          <div className="space-y-3">
            {historyData.map((item, idx) => {
              const statusStr = String(item.refund_status || item.status || "Pending").trim();
              const statusLower = statusStr.toLowerCase();
              const isPending = statusLower === "pending" || statusLower === "open" || statusLower === "in progress";
              const isSuccess = statusLower === "success" || statusLower === "approved" || statusLower === "resolved";
              const isFailed = statusLower === "failed" || statusLower === "rejected";
              const rawAmt = Number(item.amount || 0);
              const dateStr = formatRequestTime(item.refund_time || item.updation_time || item.request_time);
              const cardMessage = item.message || refundMessage || "You refund is in progress, you may receive the refund within 3 business days.";

              return (
                <div
                  key={item.refund_id || item.order_id || idx}
                  className="rounded-3xl border border-border/80 bg-surface p-4 shadow-2xs space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 font-display text-[13.5px] font-bold text-text-1">
                      <span>Order Id : {item.order_id || "-"}</span>
                      {item.order_id && (
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(String(item.order_id));
                            toast("Order ID copied to clipboard");
                          }}
                          title="Copy Order ID"
                          className="text-text-3 hover:text-text-1 transition p-0.5 active:scale-95"
                        >
                          <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current" strokeWidth="2">
                            <rect x="9" y="9" width="11" height="11" rx="2" />
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                          </svg>
                        </button>
                      )}
                    </div>

                    <span
                      className={`rounded-lg border px-2.5 py-0.5 text-[12px] font-medium tracking-tight ${
                        isSuccess
                          ? "border-emerald-500/50 bg-emerald-50/50 text-emerald-600"
                          : isFailed
                          ? "border-rose-500/50 bg-rose-50/50 text-rose-600"
                          : "border-amber-400 bg-amber-50/40 text-amber-600"
                      }`}
                    >
                      {statusStr}
                    </span>
                  </div>

                  <div className="mono text-[24px] font-extrabold text-text-1 tracking-tight">
                    ₹{inr(rawAmt)}
                  </div>

                  <div className="text-[13px] font-normal text-text-2">
                    Refund Id : <span className="mono">{item.refund_id || "-"}</span>
                  </div>

                  <div className="text-[13px] font-normal text-text-2">
                    Refund reason : <span>{item.refund_reason || "-"}</span>
                  </div>

                  <div className="border-t border-border/50 my-1" />

                  <div className="flex items-center gap-2 text-[12px] font-medium text-text-2">
                    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current" strokeWidth="2">
                      <circle cx="12" cy="12" r="9" />
                      <polyline points="12 7 12 12 15 15" />
                    </svg>
                    <span>{dateStr}</span>
                  </div>

                  <div className="border-t border-border/50 my-1" />

                  <div className="text-[12.5px] font-normal text-text-2 leading-relaxed">
                    {cardMessage}
                  </div>
                </div>
              );
            })}

            {loadingMore && (
              <div className="flex items-center justify-center py-4 gap-2 text-text-3">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-border border-t-primary" />
                <span className="text-[12.5px] font-medium">Loading more refund records...</span>
              </div>
            )}
          </div>
        )}
      </div>

      <ReportFilterSheet
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        showCategories={false}
        showStatus={true}
        statuses={[
          { id: "all", label: "All Status" },
          { id: "pending", label: "Pending" },
          { id: "success", label: "Success" },
          { id: "failed", label: "Failed" },
        ]}
        monthsFilter={previousMonthsFilter}
        selectedMonth={selectedMonth}
        onMonthChange={setSelectedMonth}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        customFrom={customFrom}
        onCustomFromChange={setCustomFrom}
        customTo={customTo}
        onCustomToChange={setCustomTo}
        onReset={handleResetFilters}
        onApply={handleApplyFilters}
      />
    </div>
  );
}

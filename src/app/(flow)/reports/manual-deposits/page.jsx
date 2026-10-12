"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { SubHeader } from "@/components/ui/SubHeader";
import { fetchManualDepositRequests } from "@/features/reports/api";
import { ReportHeaderFilterBar } from "@/features/reports/components/ReportHeaderFilterBar";
import { ReportFilterSheet } from "@/features/reports/components/ReportFilterSheet";
import { inr } from "@/utils/format";
import { useTranslation } from "react-i18next";
import { formatRequestTime, generateMonthsList, getDateRange } from "@/utils/transaction";

export default function ManualDepositsPage() {

  const { t } = useTranslation("errors")
  const [historyData, setHistoryData] = useState([]);
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

  const loadManualDeposits = useCallback(async (pageNum, filters, isAppend = false) => {
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

    console.log("Loading manual deposit requests with payload:", payload);

    try {
      const res = await fetchManualDepositRequests(payload);

      const rawItems = res?.history_data || [];
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
      console.error("Error loading manual deposit requests:", err);
      if (!isAppend) setError("Failed to load manual deposit requests.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
      loadingRef.current = false;
    }
  }, []);

  useEffect(() => {
    loadManualDeposits(1, appliedFilters, false);
  }, [appliedFilters, loadManualDeposits]);

  useEffect(() => {
    const handleScroll = () => {
      if (loading || loadingMore || !hasMore || loadingRef.current) return;

      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      const fullHeight = document.documentElement.scrollHeight;

      if (scrollTop + windowHeight >= fullHeight - 120) {
        loadManualDeposits(page + 1, appliedFilters, true);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [loading, loadingMore, hasMore, page, appliedFilters, loadManualDeposits]);

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
      <SubHeader title="Manual Deposit Requests" backHref="/reports" showImg={false} />

      <div className="p-4 space-y-4">
        <ReportHeaderFilterBar
          keyword={keyword}
          onKeywordChange={handleSearch}
          placeholder="Search Request ID, UTR or Bank"
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
            <span className="mt-3 text-[13px] font-medium text-text-2">Loading manual deposit requests...</span>
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
            <p className="text-[13px] font-medium text-rose-600">{error}</p>
            <button
              type="button"
              onClick={() => loadManualDeposits(1, appliedFilters, false)}
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
                <path d="M12 2 3 7v2h18V7Zm-7 9h3v7H5Zm5.5 0h3v7h-3ZM16 11h3v7h-3ZM3 20h18v2H3Z" />
              </svg>
            </div>
            <h3 className="mt-3 text-[15px] font-bold text-text-1">{t("MANUAL_DEPOSITS")}</h3>
            <p className="mt-1 text-[12.5px] text-text-3">{t("Filter_Query")}</p>
          </div>
        )}

        {!loading && !error && historyData.length > 0 && (
          <div className="space-y-3">
            {historyData.map((item, idx) => {
              const statusStr = String(item.status || "PENDING").toUpperCase();
              const isApproved = statusStr === "APPROVED" || statusStr === "SUCCESS";
              const isRejected = statusStr === "REJECTED" || statusStr === "FAILED";
              const rawAmt = Number(item.amount || 0);
              const dateStr = formatRequestTime(item.request_time);

              return (
                <div
                  key={item.ref_no || item.id || idx}
                  className="rounded-2xl border border-border bg-surface p-3.5 shadow-2xs space-y-2 relative"
                >
                  {/* top row */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-primary-soft">
                        <svg viewBox="0 0 24 24" className="h-5 w-5 fill-primary">
                          <path d="M12 2 3 7v2h18V7Zm-7 9h3v7H5Zm5.5 0h3v7h-3ZM16 11h3v7h-3ZM3 20h18v2H3Z" />
                        </svg>
                      </span>

                      <div>
                        <div className="font-display text-[13px] font-bold text-text-1">
                          {item.mode ? `${item.mode} · ` : ""}{item.bank || "Bank Transfer"}
                        </div>
                        {item.ref_no && (
                          <div className="mono text-[11px] font-semibold text-text-3 mt-0.5">
                            Ref No: {item.ref_no}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="mono text-[15px] font-extrabold text-text-1">
                        ₹{inr(rawAmt)}
                      </div>
                      <span
                        className={`inline-block rounded-md border px-2 py-0.5 text-[9.5px] font-extrabold uppercase tracking-wide mt-1 ${
                          isApproved
                            ? "border-emerald-500/40 bg-emerald-50 text-emerald-600"
                            : isRejected
                            ? "border-rose-500/40 bg-rose-50 text-rose-600"
                            : "border-amber-500/40 bg-amber-50 text-amber-600"
                        }`}
                      >
                        {statusStr}
                      </span>
                    </div>
                  </div>

                  {/* bottom row*/}
                  <div className="space-y-1 text-[11.5px] pt-1 ">
                    <div className="text-text-3 font-medium">
                      {dateStr}
                    </div>

                    {item.comment && (
                      <div className="font-medium text-text-2">
                        Comment: <span className="font-semibold text-text-1">{item.comment}</span>
                      </div>
                    )}

                    {isRejected && item.reason && (
                      <div className="font-semibold text-rose-600">
                        Reason: {item.reason}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

      
            {loadingMore && (
              <div className="flex items-center justify-center py-4 gap-2 text-text-3">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-border border-t-primary" />
                <span className="text-[12.5px] font-medium">Loading more requests...</span>
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
          { id: "approved", label: "Approved" },
          { id: "pending", label: "Pending" },
          { id: "rejected", label: "Rejected" },
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

"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { SubHeader } from "@/components/ui/SubHeader";
import { Sheet } from "@/components/ui/Sheet";
import { useToast } from "@/components/ui/Toast";
import { fetchDepositHistory, fetchRequestBalance } from "@/features/reports/api";
import { ReportHeaderFilterBar } from "@/features/reports/components/ReportHeaderFilterBar";
import { ReportFilterSheet } from "@/features/reports/components/ReportFilterSheet";
import { inr } from "@/utils/format";
import { useTranslation } from "react-i18next";
import { formatRequestTime, generateMonthsList, getDateRange } from "@/utils/transaction";
 
const DEPOSIT_STATUSES = [
  { id: "all", label: "All Status" },
  { id: "success", label: "Success" },
  { id: "failed", label: "Failed" },
  { id: "pending", label: "Pending" },
];

export default function DepositsPage() {
  const toast = useToast((t) => t.show);

  const { t } = useTranslation("errors")
  const [historyData, setHistoryData] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  const [checkBackupData, setCheckBackupData] = useState(null);
  const [partialRefundAllowed, setPartialRefundAllowed] = useState(true);
  const [minRefundAmount, setMinRefundAmount] = useState(1);
  const [refundAllowedDays, setRefundAllowedDays] = useState(30);

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

  const [refundItem, setRefundItem] = useState(null);
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [refundSheetOpen, setRefundSheetOpen] = useState(false);
  const [isSubmittingRefund, setIsSubmittingRefund] = useState(false);

  const loadingRef = useRef(false);
  const checkBackupRef = useRef(null);

  const loadDeposits = useCallback(async (pageNum, filters, isAppend = false) => {
    if (loadingRef.current) return;
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
      checkBackup: checkBackupRef.current || checkBackupData || null,
    };

    console.log("Loading online deposit history with payload:", payload);

    try {
      const res = await fetchDepositHistory(payload);

      
      if (res?.checkBackup) {
        setCheckBackupData(res.checkBackup);
        checkBackupRef.current = res.checkBackup;
      }

      if (res?.partial_refund !== undefined) {
        setPartialRefundAllowed(Boolean(res.partial_refund));
      }
      if (res?.min_refund_amount !== undefined) {
        setMinRefundAmount(Number(res.min_refund_amount) || 1);
      }
      if (res?.refund_allowed_days !== undefined) {
        setRefundAllowedDays(Number(res.refund_allowed_days) || 30);
      }

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
      console.error("Error loading deposit history:", err);
      if (!isAppend) setError("Failed to load deposit history.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
      loadingRef.current = false;
    }
  }, [checkBackupData]);

  useEffect(() => {
    loadDeposits(1, appliedFilters, false);
  }, [appliedFilters, loadDeposits]);

  useEffect(() => {
    const handleScroll = () => {
      if (loading || loadingMore || !hasMore || loadingRef.current) return;

      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      const fullHeight = document.documentElement.scrollHeight;

      if (scrollTop + windowHeight >= fullHeight - 120) {
        loadDeposits(page + 1, appliedFilters, true);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [loading, loadingMore, hasMore, page, appliedFilters, loadDeposits]);

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

  const isRefundEligible = (item) => {
    if (!partialRefundAllowed) return false;
    const statusStr = String(item.payment_status || item.status || "").toLowerCase();
    if (statusStr !== "success") return false;

    const rawTime = item.order_time || item.request_time || item.date_time || item.t;
    if (!rawTime) return false;

    let dateObj;
    if (typeof rawTime === "number" || !isNaN(Number(rawTime))) {
      const num = Number(rawTime);
      dateObj = new Date(num > 1e11 ? num : num * 1000);
    } else {
      dateObj = new Date(rawTime);
    }

    if (isNaN(dateObj.getTime())) return false;

    const now = new Date();
    const diffTime = Math.abs(now - dateObj);
    const diffDays = diffTime / (1000 * 60 * 60 * 24);

    const allowedDays = Number(refundAllowedDays) || 30;
    return diffDays <= allowedDays;
  };

  const handleOpenRefundModal = (item) => {
    setRefundItem(item);
    const defaultAmt = item.final_amount || item.total_amount || item.amount || "";
    setRefundAmount(String(defaultAmt));
    setRefundReason("");
    setRefundSheetOpen(true);
  };

  const getRefundMaxAmount = () => {
    if (!refundItem) return 0;
    return Number(refundItem.final_amount || refundItem.total_amount || refundItem.amount || 0);
  };

  const getAmountValidationError = () => {
    if (!refundAmount) return "Please enter a refund amount.";
    const num = Number(refundAmount);
    if (isNaN(num) || num <= 0) return "Please enter a valid positive amount.";
    if (num < minRefundAmount) return `Minimum refund amount allowed is ₹${minRefundAmount}.`;
    const maxAmt = getRefundMaxAmount();
    if (num > maxAmt) return `Refund amount cannot exceed final amount ₹${inr(maxAmt)}.`;
    return null;
  };

  const handleSubmitRefund = async () => {
    const err = getAmountValidationError();
    if (err) return;

    if (!refundReason || !refundReason.trim()) {
      toast("Please enter a reason for the refund.");
      return;
    }

    setIsSubmittingRefund(true);
    try {
      const orderId = refundItem?.order_id || refundItem?.txid || refundItem?.id;
      const res = await fetchRequestBalance({
        order_id: orderId,
        amount: refundAmount,
        reason: refundReason.trim(),
      });

      const msg = res?.message || res?.msg|| "Refund request submitted successfully!";

      if (res?.success === 1) {
        toast.success(msg);
      } else {
        toast.error(msg);
      } 
      toast(msg);
      setRefundSheetOpen(false);
      loadDeposits(1, appliedFilters, false);
    } catch (error) {
      console.error("fetchRequestBalance Error:", error);

      const errMsg =
        error?.data?.message ||
        error?.message ||
        "Failed to submit refund request.";

      toast.error(errMsg);
    } finally {
      setIsSubmittingRefund(false);
    }
  };

  const amountError = refundSheetOpen ? getAmountValidationError() : null;

  return (
    <div className="min-h-screen bg-[#f4f5fa] pb-24 max-w-app mx-auto text-text-1">
      <SubHeader title="Deposit Reports" backHref="/reports" showImg={false} />

      <div className="p-4 space-y-4">
        <ReportHeaderFilterBar
          keyword={keyword}
          onKeywordChange={handleSearch}
          placeholder="Search Order ID / UTR / Amount"
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
            <span className="mt-3 text-[13px] font-medium text-text-2">Loading deposit history...</span>
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
            <p className="text-[13px] font-medium text-rose-600">{error}</p>
            <button
              type="button"
              onClick={() => loadDeposits(1, appliedFilters, false)}
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
                <path d="M12 21 12 11 M8.5 14.5 12 11 15.5 14.5" stroke="var(--teal)" strokeWidth="2.2" strokeLinecap="round" />
                <rect x="3" y="3" width="18" height="7" rx="2" fill="var(--teal)" />
              </svg>
            </div>
            <h3 className="mt-3 text-[15px] font-bold text-text-1">{t("No Deposits Found")}</h3>
            <p className="mt-1 text-[12.5px] text-text-3">{t("Filter_Query")}</p>
          </div>
        )}

        {!loading && !error && historyData.length > 0 && (
          <div className="space-y-3">
            {historyData.map((item, idx) => {
              const statusStr = String(item.payment_status || item.status || "SUCCESS").toUpperCase();
              const isSuccess = statusStr === "SUCCESS";
              const isFailed = statusStr === "FAILED" || statusStr === "FAILURE";

              const totalAmt = Number(item.total_amount || item.amount || 0);
              const chargeAmt = Number(item.charge || 0);
              const finalAmt = Number(item.final_amount || (totalAmt - chargeAmt));
              const dateStr = formatRequestTime(item.order_time || item.request_time || item.date_time || item.t);
              const eligibleForRefund = isRefundEligible(item);

              return (
                <div
                  key={item.order_id || item.txid || item.id || idx}
                  className="rounded-2xl border border-border bg-surface p-3.5 shadow-2xs space-y-2 relative"
                >
                  {/* TOP ROW */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-display text-[12.5px] font-bold text-text-1">
                        Order Id: {item.order_id || item.txid || item.id || "-"}
                      </div>
                      <div className="flex text-[11px] text-text-3 items-center">
                        <span className="font-medium">UTR:</span>
                        <span className="mono font-semibold ml-1">{item?.utr || "N/A"}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="mono text-[15px] font-extrabold text-text-1">
                        ₹{inr(finalAmt)}
                      </div>
                      <span
                        className={`inline-block rounded-md border px-2 py-0.5 text-[9.5px] font-extrabold uppercase tracking-wide mt-2 ${isSuccess
                            ? "border-emerald-500/40 bg-emerald-50 text-emerald-600"
                            : isFailed
                              ? "border-rose-500/40 bg-rose-50 text-rose-600"
                              : "border-amber-500/40 bg-amber-50 text-amber-600"
                          }`}
                      >
                        {statusStr}
                      </span>
                    </div>
                  </div>

                  {/* MIDDLE ROW */}
                  <div className="space-y-1 text-[11.5px]">
                    <div className="text-[11px] font-medium text-text-3 mt-0.5">
                      {dateStr}
                    </div>
                    {chargeAmt > 0 && (
                      <div className="flex items-center text-rose-600">
                        <span className="font-medium">Gateway Charge:</span>
                        <span className="mono font-semibold ml-1">- ₹{inr(chargeAmt)}</span>
                      </div>
                    )}
                    {(item.gateway_name || item.payment_method || item.mode) && (
                      <div className="flex items-center">
                        <span className="text-text-3 font-medium">Payment Mode:</span>
                        <span className="font-semibold text-text-2 ml-1">{item.gateway_name || item.payment_method || item.mode}</span>
                      </div>
                    )}
                  </div>

                  {/* ACTION ROW */}
                  {eligibleForRefund && (
                    <div className="flex items-center justify-end pt-1">
                      <button
                        type="button"
                        onClick={() => handleOpenRefundModal(item)}
                        className="flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-50 px-3 py-1.5 text-[11.5px] font-bold text-amber-700 hover:bg-amber-100 active:scale-95 transition shadow-2xs"
                      >
                        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-none stroke-current" strokeWidth="2">
                          <path d="M3 10h10a5 5 0 0 1 5 5v2M3 10l6-6M3 10l6 6" />
                        </svg>
                        Refund Request
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            {loadingMore && (
              <div className="flex items-center justify-center py-4 gap-2 text-text-3">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-border border-t-primary" />
                <span className="text-[12.5px] font-medium">Loading more deposits...</span>
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
        statuses={DEPOSIT_STATUSES}
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

      <Sheet id="refund-deposit-sheet" open={refundSheetOpen} onClose={() => setRefundSheetOpen(false)}>
        <div className="space-y-4 pb-2">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="font-display text-[15px] font-bold text-text-1 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600 border border-amber-200">
                <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current" strokeWidth="2">
                  <path d="M3 10h10a5 5 0 0 1 5 5v2M3 10l6-6M3 10l6 6" />
                </svg>
              </span>
              Refund Request
            </h3>
          </div>

          {/* refund amount and refund reason */}
          <div className="space-y-3">
            <div>
              <label className="block text-[12px] font-semibold text-text-2 mb-1.5">
                Enter Refund Amount
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[15px] font-bold text-text-3">₹</span>
                <input
                  type="number"
                  step="any"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  placeholder={`Min ₹${minRefundAmount}`}
                  className="w-full rounded-xl border-[1.5px] border-border bg-surface pl-8 pr-3.5 py-3 text-[15px] font-bold outline-none focus:border-primary"
                />
                {/* <p>{` min amount is : ₹${minRefundAmount} to ₹${items?.final_amount}`}</p> */}
              </div>
              {amountError && (
                <div className="mt-1.5 text-[11.5px] font-semibold text-rose-600">
                  {amountError}
                </div>
              )}
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-text-2 mb-1.5">
                Refund Reason
              </label>
              <input
                type="text"
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="Enter reason for refund"
                className="w-full rounded-xl border-[1.5px] border-border bg-surface px-3.5 py-3 text-[13.5px] font-medium outline-none focus:border-primary"
              />
            </div>
          </div>

          <button
            type="button"
            disabled={Boolean(amountError) || !refundAmount || !refundReason.trim() || isSubmittingRefund}
            onClick={handleSubmitRefund}
            className="w-full rounded-xl bg-primary px-4 py-3.5 font-display text-[13.5px] font-bold text-white shadow-md active:scale-98 transition disabled:opacity-50"
          >
            {isSubmittingRefund ? "Submitting..." : `Submit Refund`}
          </button>
        </div>
      </Sheet>
    </div>
  );
}

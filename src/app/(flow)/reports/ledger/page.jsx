"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { SubHeader } from "@/components/ui/SubHeader";
import { fetchWalletHistory, fetchTransactionHistorySuccessDetails } from "@/features/reports/api";
import { PaymentSuccessful } from "@/components/ui/PaymentSuccessful";
import { ReportHeaderFilterBar } from "@/features/reports/components/ReportHeaderFilterBar";
import { ReportFilterSheet } from "@/features/reports/components/ReportFilterSheet";
import { inr } from "@/utils/format";
import { formatRequestTime, generateMonthsList, getDateRange } from "@/utils/transaction";

export default function LedgerPage() {
  const [activeReceiptData, setActiveReceiptData] = useState(null);
  const [fetchingDetailsId, setFetchingDetailsId] = useState(null);

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

  const [appliedFilters, setAppliedFilters] = useState({
    from: "",
    to: "",
    keyword: "",
  });

  const loadingRef = useRef(false);

  const loadWalletHistory = useCallback(async (pageNum, filters, isAppend = false) => {
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
      keyword: filters.keyword || "",
    };

    console.log("Loading wallet history with payload:", payload);

    try {
      const res = await fetchWalletHistory(payload);

      const rawItems = res?.history_data || res?.data || [];
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
      console.error("Error loading wallet history:", err);
      if (!isAppend) setError("Failed to load wallet history.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
      loadingRef.current = false;
    }
  }, []);

  useEffect(() => {
    loadWalletHistory(1, appliedFilters, false);
  }, [appliedFilters, loadWalletHistory]);

  useEffect(() => {
    const handleScroll = () => {
      if (loading || loadingMore || !hasMore || loadingRef.current) return;

      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      const fullHeight = document.documentElement.scrollHeight;

      if (scrollTop + windowHeight >= fullHeight - 120) {
        loadWalletHistory(page + 1, appliedFilters, true);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [loading, loadingMore, hasMore, page, appliedFilters, loadWalletHistory]);

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
      keyword: keyword.trim(),
    };

    setAppliedFilters(newFilters);
    setFilterOpen(false);
  };

  const handleResetFilters = () => {
    setSelectedMonth("all");
    setCustomFrom("");
    setCustomTo("");
    const newFilters = {
      from: "",
      to: "",
      keyword: keyword.trim(),
    };
    setAppliedFilters(newFilters);
    setFilterOpen(false);
  };

  const isReceiptEligible = (item) => {
    const rawType = String(item.txn_type || "").trim().toLowerCase();
    const allowed = ["txn", "txnfailed", "txnrefund", "txnreversed"];
    return allowed.includes(rawType);
  };

  const handleCardClick = async (item) => {
    if (!isReceiptEligible(item)) return;

    const orderId = item?.txid;
    if (!orderId) return;

    try {
      setFetchingDetailsId(orderId);
      const res = await fetchTransactionHistorySuccessDetails({ order_id: orderId });
      if (res && typeof res === "object") {
        setActiveReceiptData(res);
      } else {
        setActiveReceiptData(item);
      }
    } catch (err) {
      console.warn("fetchTransactionHistorySuccessDetails error, falling back to item:", err);
      setActiveReceiptData(item);
    } finally {
      setFetchingDetailsId(null);
    }
  };

  if (activeReceiptData) {
    return (
      <PaymentSuccessful
        receiptData={activeReceiptData}
        onClose={() => setActiveReceiptData(null)}
        playSound={false}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f5fa] pb-24 max-w-app mx-auto text-text-1">
      <SubHeader title="Wallet Ledger" backHref="/reports" showImg={false} />

      <div className="p-4 space-y-4">
        {/* Common Search Bar & Date Quick Tabs */}
        <ReportHeaderFilterBar
          keyword={keyword}
          onKeywordChange={handleSearch}
          placeholder="Order ID / Transaction ID"
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
            <span className="mt-3 text-[13px] font-medium text-text-2">Loading wallet ledger...</span>
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
            <p className="text-[13px] font-medium text-rose-600">{error}</p>
            <button
              type="button"
              onClick={() => loadWalletHistory(1, appliedFilters, false)}
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
                <path d="M17 9V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2m2 4h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2zm7-5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z" />
              </svg>
            </div>
            <h3 className="mt-3 text-[15px] font-bold text-text-1">No Ledger Entries Found</h3>
            <p className="mt-1 text-[12.5px] text-text-3">Try adjusting your search query or date filters.</p>
          </div>
        )}

        {/* WALLET LEDGER CARDS LIST (Matching media_1788861646613.png) */}
        {!loading && !error && historyData.length > 0 && (
          <div className="space-y-3">
            {historyData.map((item, idx) => {
              const isDebit = String(item.type || "Dr").toUpperCase() === "DR";
              const amountVal = Number(item.amount || 0);
              const txnAmountVal = Number(item.txn_amount || item.amount || 0);
              const remainingVal = Number(item.remaining || 0);
              const dateStr = formatRequestTime(item.date_time);

              const eligible = isReceiptEligible(item);
              const isFetching = fetchingDetailsId === (item.txid || item.order_id || item.id);

              return (
                <div
                  key={`${item.txid || "txn"}-${idx}`}
                  onClick={() => eligible && handleCardClick(item)}
                  className={`rounded-2xl border border-border bg-surface p-3.5 shadow-2xs space-y-2 relative transition ${
                    eligible
                      ? "cursor-pointer hover:border-primary/40 active:scale-[0.99]"
                      : ""
                  } ${isFetching ? "opacity-60 pointer-events-none" : ""}`}
                >
                  {isFetching && (
                    <div className="absolute inset-0 flex items-center justify-center bg-surface/80 rounded-2xl z-10">
                      <span className="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-primary" />
                    </div>
                  )}

                  {/* LINE 1: ORDER ID & TOP RIGHT AMOUNT */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span
                        className={`flex h-10 w-10 flex-none items-center justify-center rounded-full border shadow-2xs ${
                          isDebit
                            ? "bg-rose-50 border-rose-200/80 text-rose-600"
                            : "bg-emerald-50 border-emerald-200/80 text-emerald-600"
                        }`}
                      >
                        <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          {isDebit ? (
                            <path d="M7 17L17 7M17 7H7M17 7V17" />
                          ) : (
                            <path d="M7 7L17 17M17 17H7M17 17V7" />
                          )}
                        </svg>
                      </span>

                      <div>
                        <div className="font-display text-[13px] font-bold text-text-1 flex items-center gap-1.5">
                          Order Id :{item.txid || "-"}
                          {/* {eligible && (
                            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-none stroke-primary" strokeWidth="2">
                              <path d="M9 18l6-6-6-6" />
                            </svg>
                          )} */}
                        </div>
                        <div className="text-[12.5px] font-medium text-text-2 mt-0.5">
                          Amount <span className="font-bold text-text-1">₹{inr(txnAmountVal)}</span>
                        </div>
                      </div>
                    </div>

                    <div
                      className={`mono text-[15px] font-extrabold text-right whitespace-nowrap ${
                        isDebit ? "text-rose-600" : "text-emerald-600"
                      }`}
                    >
                      {isDebit ? `- ₹${inr(amountVal)}` : `+ ₹${inr(amountVal)}`}
                    </div>
                  </div>

                  {/* LINE 3: DATE & CLOSING BALANCE */}
                  <div className="flex items-center justify-between text-[11.5px] text-text-3 font-medium pt-1">
                    <div>{dateStr}</div>
                    <div>
                      Closing Balance <span className="mono font-semibold text-text-2">₹{inr(remainingVal)}</span>
                    </div>
                  </div>

                  {/* LINE 4: COMMENT DESCRIPTION */}
                  {item.comment && (
                    <div className="pt-2 text-[12px] font-semibold text-text-1 leading-snug">
                      {item.comment}
                    </div>
                  )}
                </div>
              );
            })}

            {/* SCROLL LOADING MORE INDICATOR */}
            {loadingMore && (
              <div className="flex items-center justify-center py-4 gap-2 text-text-3">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-border border-t-primary" />
                <span className="text-[12.5px] font-medium">Loading more ledger records...</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* COMMON FILTER MODAL SHEET (Date Only Mode) */}
      <ReportFilterSheet
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        showCategories={false}
        showStatus={false}
        monthsFilter={previousMonthsFilter}
        selectedMonth={selectedMonth}
        onMonthChange={setSelectedMonth}
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

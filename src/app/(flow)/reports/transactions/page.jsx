"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { SubHeader } from "@/components/ui/SubHeader";
import { fetchTransactionHistory, fetchTransactionHistorySuccessDetails } from "@/features/reports/api";
import { PaymentSuccessful } from "@/components/ui/PaymentSuccessful";
import { inr } from "@/utils/format";
import { formatRequestTime, getCategoriesFromSession, generateMonthsList, getDateRange } from "@/utils/transaction";
import { ReportHeaderFilterBar } from "@/features/reports/components/ReportHeaderFilterBar";
import { ReportFilterSheet } from "@/features/reports/components/ReportFilterSheet";
import { useTranslation } from "react-i18next";


export default function TransactionsPage() {

  const { t } = useTranslation("errors")
  const [activeReceiptData, setActiveReceiptData] = useState(null);
  const [fetchingDetailsId, setFetchingDetailsId] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  const [operatorImgBase, setOperatorImgBase] = useState("https://staging.paybyapis.com/images/operators/");
  const [dummyImg, setDummyImg] = useState("dummy.png");

  const [previousMonthsFilter, setPreviousMonthsFilter] = useState([]);
  const [dynamicCategories, setDynamicCategories] = useState([]);

  const [dateTab, setDateTab] = useState("all");
  const [keyword, setKeyword] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);

  const [selectedMonth, setSelectedMonth] = useState("all"); 
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  const [appliedFilters, setAppliedFilters] = useState({
    from: "",
    to: "",
    paymentStatus: "",
    serviceType: "",
    keyword: "",
  });

  const loadingRef = useRef(false);

  useEffect(() => {
    const cats = getCategoriesFromSession();
    setDynamicCategories(cats);
  }, []);

  const loadTransactions = useCallback(async (pageNum, filters, isAppend = false) => {
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
  paymentStatus: filters.paymentStatus || "",
  serviceType: filters.serviceType || "",
  keyword: filters.keyword || "",
};

console.log("Loading transactions with payload:", payload);

    try {
      const res = await fetchTransactionHistory(payload);

      if (res?.operator_img) setOperatorImgBase(res.operator_img);
      if (res?.operator_dunmy_img) setDummyImg(res.operator_dunmy_img);

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
      const totalPages = res?.total_pages ? Number(res.total_pages) : null;

      if (remainingNum !== null && !isNaN(remainingNum)) {
        setHasMore(remainingNum > 0);
      } else if (totalPages) {
        setHasMore(pageNum < totalPages);
      } else {
        setHasMore(items.length > 0);
      }

      setPage(pageNum);
    } catch (err) {
      console.error("Error loading transaction history:", err);
      if (!isAppend) setError("Failed to load transaction history.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
      loadingRef.current = false;
    }
  }, []);

  useEffect(() => {
    loadTransactions(1, appliedFilters, false);
  }, [appliedFilters, loadTransactions]);

  useEffect(() => {
    const handleScroll = () => {
      if (loading || loadingMore || !hasMore || loadingRef.current) return;

      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      const fullHeight = document.documentElement.scrollHeight;

      if (scrollTop + windowHeight >= fullHeight - 120) {
        loadTransactions(page + 1, appliedFilters, true);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [loading, loadingMore, hasMore, page, appliedFilters, loadTransactions]);

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
      paymentStatus: selectedStatus === "all" ? "" : selectedStatus,
      serviceType: selectedCategory === "all" ? "" : selectedCategory,
      keyword: keyword.trim(),
    };

    setAppliedFilters(newFilters);
    setFilterOpen(false);
  };

  const handleResetFilters = () => {
    setSelectedMonth("all");
    setCustomFrom("");
    setCustomTo("");
    setSelectedCategory("all");
    setSelectedStatus("all");
    const newFilters = {
      from: "",
      to: "",
      paymentStatus: "",
      serviceType: "",
      keyword: keyword.trim(),
    };
    setAppliedFilters(newFilters);
    setFilterOpen(false);
  };



  const getLogoUrl = (item) => {
    const logoFile = item.logo || item.operator_logo;
    if (!logoFile) return `${operatorImgBase}${dummyImg}`;
    if (logoFile.startsWith("http")) return logoFile;
    return `${operatorImgBase}${logoFile}`;
  };

  async function openReceipt(item) {
    const orderId = item.order_id || item.id;
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
  }

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
      {/* HEADER */}
      <SubHeader title="Transactions History" backHref="/reports" />

      <div className="p-4 space-y-4">
        {/* Common Search Bar & Date Quick Tabs */}
        <ReportHeaderFilterBar
          keyword={keyword}
          onKeywordChange={handleSearch}
          placeholder="Mobile no./Order Id"
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
            <span className="mt-3 text-[13px] font-medium text-text-2">Loading transactions...</span>
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
            <p className="text-[13px] font-medium text-rose-600">{error}</p>
            <button
              onClick={() => loadTransactions(1, appliedFilters, false)}
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
                <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="mt-3 text-[15px] font-bold text-text-1">{t("TRANSACTION_NOT_FOUND")}</h3>
            <p className="mt-1 text-[12.5px] text-text-3">{t("Filter_Query")}</p>
          </div>
        )}

        {!loading && !error && historyData.length > 0 && (
          <div className="space-y-3">
            {historyData.map((item, idx) => {
              const statusStr = String(item.status || "SUCCESS").toUpperCase();
              const isSuccess = statusStr === "SUCCESS" || statusStr === "SUCCESSFUL";
              const isFailed = statusStr === "FAILED" || statusStr === "FAILURE";
              const rawAmt = Number(item.amount || 0);
              const opName = item.operator_name || item.operator || item.service_name || "Transaction";

              const isItemFetching = fetchingDetailsId === (item.order_id || item.id);

              return (
                <div
                  key={item.order_id || item.id || idx}
                  onClick={() => openReceipt(item)}
                  className={`rounded-2xl border border-border bg-surface p-3 shadow-2xs space-y-1 cursor-pointer active:scale-[0.99] transition relative ${
                    isItemFetching ? "opacity-70 pointer-events-none" : ""
                  }`}
                >
                  {isItemFetching && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-surface/80 rounded-2xl">
                      <span className="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-primary" />
                    </div>
                  )}
                  {/*top row*/}
                  <div className="flex items-center justify-between ">
                    <div>
                      <span className="font-display text-[12px] font-bold text-text-1">
                        Order Id :{item.order_id || item.id || "-"}
                      </span>
                      <div className="text-[11px] font-medium text-text-3 mt-0.5">
                        {formatRequestTime(item.request_time)}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="mono text-[15px] font-extrabold text-text-1">
                        ₹{inr(rawAmt)}
                      </span>
                      <div className="mt-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openReceipt(item);
                          }}
                          className="inline-flex items-center gap-1 rounded-lg border border-border px-1 py-1 text-[10px] font-semibold text-text-2 hover:bg-page active:scale-95 transition"
                        >
                          {isSuccess ? "Repay" : "Retry"}
                          <svg viewBox="0 0 24 24" className="h-2 w-2 fill-none stroke-current" strokeWidth="2.5">
                            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* middle row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={getLogoUrl(item)}
                        alt={opName}
                        className="h-10 w-10 flex-none  object-contain p-1"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = `${operatorImgBase}${dummyImg}`;
                        }}
                      />

                      <div>
                        <div className="font-display text-[12px] font-bold text-text-1 truncate max-w-[180px]">
                          {item.operator_name || "-"}
                        </div>
                        <div className="mono text-[11px] font-medium text-text-2">
                          {item.number|| "-"}
                        </div>
                      </div>
                    </div>

                    <span
                      className={`rounded-md border px-1 py-1 text-[9px] font-extrabold uppercase tracking-wide ${
                        isSuccess
                          ? "border-emerald-500/40 bg-emerald-50 text-emerald-600"
                          : isFailed
                          ? "border-rose-500/40 bg-rose-50 text-rose-600"
                          : "border-amber-500/40 bg-amber-50 text-amber-600"
                      }`}
                    >
                      {statusStr}
                    </span>
                  </div>

                  {/* bottom row */}
                  <div className=" text-[11px] font-medium text-text-2">
                    Operator Ref: <span className="mono font-semibold">{item.operator_ref || "No records found"}</span>
                  </div>
                </div>
              );
            })}

            {loadingMore && (
              <div className="flex items-center justify-center py-4 gap-2 text-text-3">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-border border-t-primary" />
                <span className="text-[12.5px] font-medium">Loading more transactions...</span>
              </div>
            )}

            {/* NO MORE PAGES INDICATOR
            {!hasMore && historyData.length > 0 && (
              <div className="py-4 text-center text-[12px] font-medium text-text-3">
                You've reached the end of the transactions list.
              </div>
            )} */}
          </div>
        )}
      </div>

      <ReportFilterSheet
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        categories={dynamicCategories}
        monthsFilter={previousMonthsFilter}
        selectedMonth={selectedMonth}
        onMonthChange={setSelectedMonth}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
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

"use client";

export function ReportHeaderFilterBar({
  keyword,
  onKeywordChange,
  placeholder = "Mobile no./Order Id",
  onFilterClick,
  activeDateTab,
  onDateTabChange,
  dateTabs = [
    { id: "all", label: "All" },
    { id: "today", label: "Today" },
    { id: "7days", label: "Last 7 Days" },
    { id: "30days", label: "Last 30 Days" },
  
  ],
}) {
  return (
    <div className="space-y-3">
      {/* Search Input Box + Filter Button */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={keyword}
            onChange={(e) => onKeywordChange(e.target.value)}
            placeholder={placeholder}
            className="w-full h-11 rounded-xl border border-border bg-surface pl-4 pr-10 text-[13.5px] outline-none focus:border-primary shadow-2xs"
          />
          <svg
            className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-3"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </div>

        {/* Filter Trigger Button */}
        {onFilterClick && (
          <button
            type="button"
            onClick={onFilterClick}
            className="flex h-11 w-11 flex-none items-center justify-center rounded-xl border border-border bg-surface shadow-2xs active:scale-95 transition"
            aria-label="Open Filters"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-text-2">
              <path d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z" />
            </svg>
          </button>
        )}
      </div>

      {/* Date Quick Tabs */}
      {dateTabs && dateTabs.length > 0 && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {dateTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onDateTabChange(tab.id)}
              className={`whitespace-nowrap rounded-2xl px-3 py-1 text-[12px] font-semibold transition ${
                activeDateTab === tab.id
                  ? "bg-primary-soft text-primary border-primary border"
                  : "border border-text-3 bg-surface text-text-2"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

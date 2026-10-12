"use client";

export function KycDocCard({
  title,
  subtitle,
  status,
  icon,
  onVerify,
  isAlreadySigned = false,
  isDownloading = false,
  onDownload,
  disabled,
}) {
  const normalizeStatus = (statusStr) => {
    const s = String(statusStr || "").trim().toLowerCase();
    if (["approved", "verified", "1", "success"].includes(s)) return "Approved";
    if (["pending", "failed", "2"].includes(s)) return "Pending";
    if (["processing", "in_progress", "under_review", "review"].includes(s)) return "Processing";
    if (["rejected", "failed", "declined", "2"].includes(s)) return "Rejected";
    return "not_uploaded";
  };

  const normStatus = normalizeStatus(status);

  const renderBadge = () => {
    if (isAlreadySigned && onDownload) {
      return (
        <button
          type="button"
          onClick={onDownload}
          disabled={isDownloading}
          className="flex items-center gap-1.5 rounded-xl bg-teal-soft px-2 py-1 font-display text-[10px] font-bold text-teal shadow-xs active:scale-95 transition disabled:opacity-60 cursor-pointer"
        >
          {isDownloading ? (
            <>
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
              <span>Downloading...</span>
            </>
          ) : (
            <>
              <span>Download Agreement</span>
            </>
          )}
        </button>
      );
    }

    if (normStatus === "Approved") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-teal-soft px-2.5 py-1 text-[12px] font-bold text-teal">
          Approved
        </span>
      );
    }

    if (normStatus === "Processing") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-orange-soft px-2.5 py-1 text-[12px] font-semibold text-orange">
          Processing
        </span>
      );
    }

    if (normStatus === "Pending") {
      return (
        <button
          type="button"
          onClick={onVerify}
          // disabled={disabled}
          className={`rounded-xl bg-primary px-2 py-1 font-display text-[11px] font-bold text-white transition ${disabled
            ? "cursor-not-allowed opacity-50"
            : "cursor-pointer hover:opacity-95 active:scale-95"
            }`}>
          Verify Now
        </button>
      );
    }

    if (normStatus === "Rejected") {
      return (
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2.5 py-1 text-[11px] font-bold text-accent">
            Rejected
          </span>
          <button
            type="button"
            onClick={onVerify}
            className="rounded-xl bg-accent px-3 py-1.5 font-display text-[11px] font-bold text-white shadow-xs hover:opacity-95 active:scale-95 transition cursor-pointer"
          >
            Retry
          </button>
        </div>
      );
    }

    return (
      <button
        type="button"
        onClick={onVerify}
        // disabled={disabled}
        className={`rounded-xl bg-primary px-2 py-1 font-display text-[11px] font-bold text-white transition ${disabled
            ? "cursor-not-allowed opacity-50"
            : "cursor-pointer hover:opacity-95 active:scale-95"
          }`}>
        Verify Now
      </button>
    );
  };

  return (
    <div className="flex items-center justify-between rounded-2xl border border-border bg-surface p-4 shadow-2xs">
      <div className="flex items-center gap-3">
        {icon}
        <div>
          <h4 className="font-display text-[12px] lg:text-[13px] font-bold text-text">{title}</h4>
          <p className="text-[10px] text-green-700">{subtitle}</p>
        </div>
      </div>
      {renderBadge()}
    </div>
  );
}

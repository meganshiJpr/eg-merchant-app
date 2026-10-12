"use client";

import React, { forwardRef, useMemo } from "react";

const parseHtmlForPreview = (htmlStr) => {
  if (!htmlStr || typeof window === "undefined") {
    return { styles: "", bodyHtml: htmlStr || "" };
  }
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlStr, "text/html");

    const styles = Array.from(doc.querySelectorAll("style"))
      .map((style) => style.textContent)
      .join("\n");

    const bodyHtml = doc.body?.innerHTML || "";

    return { styles, bodyHtml };
  } catch (e) {
    console.error("[KYC Preview] HTML parse error:", e);
    return { styles: "", bodyHtml: htmlStr };
  }
};

export const KycAgreementPreview = forwardRef(function KycAgreementPreview(
  { html = "" },
  ref
) {
  const { styles, bodyHtml } = useMemo(() => parseHtmlForPreview(html), [html]);

  if (!html) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl bg-white p-6 text-xs font-semibold text-slate-400">
        No document template available.
      </div>
    );
  }

  return (
    <div
      ref={ref}
      id="kyc-agreement-document"
      style={{
        width: "210mm",
        background: "#fff",
      }}
    >
      <style>{styles}</style>
      <div
        dangerouslySetInnerHTML={{
          __html: bodyHtml,
        }}
      />
    </div>
  );
});

"use client";

import html2canvas from "html2canvas";
import jsPDF from "jspdf";


async function convertImageUrlToBase64(url) {
  if (!url || typeof url !== "string") return url;
  if (url.startsWith("data:") || url.startsWith("blob:")) return url;

  try {
    const res = await fetch(url, { mode: "cors" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    // Fallback: in-memory Image element + Canvas
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = img.naturalWidth || img.width;
          canvas.height = img.naturalHeight || img.height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL("image/jpeg", 0.95));
        } catch (e) {
          resolve(url);
        }
      };
      img.onerror = () => resolve(url);
      img.src = url;
    });
  }
}


async function preloadAndInlineImages(container) {
  if (!container || typeof window === "undefined") return;

  const images = Array.from(container.querySelectorAll("img"));
  if (images.length > 0) {
    console.log(`[KYC PDF] Preloading and inlining ${images.length} images...`);
    await Promise.all(
      images.map(async (img) => {
        try {
          const src = img.currentSrc || img.src;
          if (src && !src.startsWith("data:") && !src.startsWith("blob:")) {
            const base64 = await convertImageUrlToBase64(src);
            if (base64 && base64.startsWith("data:")) {
              img.src = base64;
            }
          }
          img.crossOrigin = "anonymous";
          if (!img.complete) {
            await new Promise((res) => {
              img.onload = res;
              img.onerror = res;
            });
          }
          if (img.decode) {
            await img.decode().catch(() => {});
          }
        } catch (e) {
          console.warn("[KYC PDF] Error inlining image:", e);
        }
      })
    );
  }

  // Pre-process any inline CSS background-image with remote URL
  const elementsWithBg = Array.from(container.querySelectorAll("[style*='background']"));
  for (const el of elementsWithBg) {
    const bg = el.style.backgroundImage || "";
    if (bg && bg.includes("http") && !bg.includes("data:")) {
      const match = bg.match(/url\(["']?(http[^"']+)["']?\)/i);
      if (match && match[1]) {
        try {
          const base64 = await convertImageUrlToBase64(match[1]);
          if (base64 && base64.startsWith("data:")) {
            el.style.backgroundImage = `url("${base64}")`;
          }
        } catch (e) {}
      }
    }
  }
}

/**
 * Generates an A4 PDF from a rendered KYC agreement DOM element or HTML string page-by-page.
 * Each .kyc-page element inside targetElement represents exactly one PDF page.
 *
 * @param {Object} options
 * @param {HTMLElement} [options.element] - The root DOM element containing .kyc-page elements.
 * @param {string} [options.html] - Raw HTML string to generate PDF from if no DOM element is passed.
 * @param {string} [options.fileName] - Name of the generated PDF file.
 * @returns {Promise<{ blob: Blob, fileName: string, size: string, type: string }>}
 */
export async function generateAgreementPdf({
  element = null,
  html = "",
  fileName = "KYC_Agreement.pdf",
}) {
  if (typeof window === "undefined") {
    throw new Error("PDF generation requires browser environment.");
  }

  let targetElement = element;
  let tempContainer = null;

  if (!targetElement && html) {
    tempContainer = document.createElement("div");
    tempContainer.style.position = "fixed";
    tempContainer.style.top = "0";
    tempContainer.style.left = "0";
    tempContainer.style.zIndex = "-99999";
    tempContainer.style.width = "794px";
    tempContainer.style.opacity = "1";
    tempContainer.style.pointerEvents = "none";
    tempContainer.innerHTML = html;
    document.body.appendChild(tempContainer);
    targetElement = tempContainer;
  }

  if (!targetElement) {
    throw new Error("No DOM element or HTML string provided for PDF generation.");
  }

  try {
    // Inlines remote images to Base64 to bypass CORS and prevent blank photo captures
    await preloadAndInlineImages(targetElement);

    const pages = Array.from(targetElement.querySelectorAll(".kyc-page"));

    if (!pages || pages.length === 0) {
      throw new Error("No .kyc-page elements found in document for PDF generation.");
    }

    for (let index = 0; index < pages.length; index++) {
      const page = pages[index];
      const rect = page.getBoundingClientRect();
      console.log(`[KYC PDF] Page ${index + 1} dimensions:`, {
        width: rect.width,
        height: rect.height,
        scrollWidth: page.scrollWidth,
        scrollHeight: page.scrollHeight,
      });

      if (page.scrollWidth === 0 || page.scrollHeight === 0) {
        throw new Error(`Page ${index + 1} has zero layout dimensions.`);
      }
    }

    // Create standard portrait A4 PDF document (210mm x 297mm)
    const pdf = new jsPDF({
      unit: "mm",
      format: "a4",
      orientation: "portrait",
      compress: true,
    });

    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];

      const canvas = await html2canvas(page, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: "#ffffff",
        logging: false,
        imageTimeout: 15000,
        scrollX: 0,
        scrollY: 0,
        width: page.scrollWidth,
        height: page.scrollHeight,
        windowWidth: page.scrollWidth,
        windowHeight: page.scrollHeight,
      });

      const imageData = canvas.toDataURL("image/jpeg", 0.98);

      if (i > 0) {
        pdf.addPage();
      }

      pdf.addImage(imageData, "JPEG", 0, 0, 210, 297);
    }

    const pdfBlob = pdf.output("blob");
    const sizeKb = (pdfBlob.size / 1024).toFixed(2);
    const sizeStr = `${sizeKb} KB`;

    return {
      blob: pdfBlob,
      fileName,
      size: sizeStr,
      type: "application/pdf",
    };
  } finally {
    if (tempContainer && document.body.contains(tempContainer)) {
      document.body.removeChild(tempContainer);
    }
  }
}

export function downloadPdfBlob(blob, fileName = "KYC_Agreement.pdf") {
  if (typeof window === "undefined" || !blob) return;

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;

  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);

  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
}
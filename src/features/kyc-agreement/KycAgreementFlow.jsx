"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useLayoutEffect,
  useMemo,
} from "react";

import { SubHeader } from "@/components/ui/SubHeader";
import { useRouter } from "next/navigation";
import { KycAgreementPreview } from "./components/KycAgreementPreview";
import { SignatureModal } from "./components/SignatureModal";
import { generateAgreementPdf } from "./utils/pdfGenerator";
import { prepareKycAgreementHtml } from "./utils/prepareKycAgreementHtml";
import { getKycTermsAndConditions, submitKycTermsAndConditions } from "@/features/profile/api";

const A4_WIDTH = 794;
const A4_HEIGHT = 1123;
const PAGE_COUNT = 2;

export function KycAgreementFlow() {
  const router = useRouter();
  const [kycData, setKycData] = useState(null);
  const [loadingKyc, setLoadingKyc] = useState(true);
  const [apiError, setApiError] = useState("");

  const [termsHtml, setTermsHtml] = useState("");
  const [termsMeta, setTermsMeta] = useState({
    signatureId: "signature-placeholder",
    dateId: "kyc-date",
    locationId: "kyc-location",
    templateId: null,
    templateVersion: null,
  });

  const [locationCoords, setLocationCoords] = useState({
    latitude: null,
    longitude: null,
    status: "requesting",
    error: null,
  });

  const [ipAddress, setIpAddress] = useState("");

  const [termsAccepted, setTermsAccepted] = useState(false);
  const [signature, setSignature] = useState(null);
  const [signedAt, setSignedAt] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionComplete, setSubmissionComplete] = useState(false);
  // const [lastPdfResult, setLastPdfResult] = useState(null);

  const documentRef = useRef(null);
  const previewContainerRef = useRef(null);
  const [previewScale, setPreviewScale] = useState(1);


  const requestLocation = () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setLocationCoords({ latitude: null, longitude: null, status: "unsupported", error: "Geolocation unsupported" });
      return;
    }

    setLocationCoords((prev) => ({ ...prev, status: "requesting" }));

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude.toFixed(4);
        const long = pos.coords.longitude.toFixed(4);
        console.log("[KYC Audit] Geolocation obtained:", { lat, long });
        setLocationCoords({ latitude: lat, longitude: long, status: "granted", error: null });
      },
      (err) => {
        console.warn("[KYC Audit] Geolocation permission error:", err.message);
        setLocationCoords({ latitude: null, longitude: null, status: "denied", error: err.message });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    requestLocation();
  }, []);

  const loadKycTerms = async () => {
    setLoadingKyc(true);
    setApiError("");
    try {
      console.log("[KYC API] Fetching merchant/getKycTermsAndConditions...");
      const res = await getKycTermsAndConditions();
      console.log("[KYC API] Raw API Response:", res);

      if (!res || (res.status !== true && res.success !== 1 && res.success !== true)) {
        throw new Error(res?.message || "Failed to fetch KYC details.");
      }

      const user = res?.data?.user || {};
      const kycDetails = res?.data?.kyc_details || {};

      const aadhaarVal = kycDetails?.id_number || user?.aadhaar_last4 || user?.aadhaar;
      const currentDateFormatted = res?.date || new Date().toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });

      const termsContent = res?.data?.terms_content || "";
      let extractedIp =
        res?.data?.ip ||
        res?.ip ||
        res?.data?.user?.ip ||
        res?.data?.ip_address ||
        "";

      // If IP is not in root JSON, extract from backend HTML template
      if (!extractedIp && typeof window !== "undefined" && termsContent) {
        try {
          const parser = new DOMParser();
          const doc = parser.parseFromString(termsContent, "text/html");
          extractedIp =
            doc.querySelector('[data-field="ip"], #kyc-ip, .kyc-ip')?.textContent?.trim() || "";
        } catch (e) {
          console.warn("Could not extract IP from terms_content:", e);
        }
      }

      console.log("[KYC API] Resolved backend IP address:", extractedIp);
      setIpAddress(extractedIp);

      setTermsHtml(termsContent);
      setTermsMeta({
        signatureId: res?.data?.signature_id || "signature-placeholder",
        dateId: res?.data?.date_id || "kyc-date",
        locationId: res?.data?.location_id || "kyc-location",
        templateId: res?.data?.template_id || null,
        templateVersion: res?.data?.template_version || null,
      });

      const userPhoto =
        user?.photo ||
        user?.selfie ||
        user?.profile_photo ||
        kycDetails?.selfie ||
        kycDetails?.selfie_path ||
        kycDetails?.photo ||
        res?.data?.photo ||
        res?.data?.selfie ||
        "";

      const updatedData = {
        documentId: res?.data?.document_id || res?.document_id || "DOC-KYC-001",
        name: user?.name || "",
        mobile: user?.mobile || "",
        pan: kycDetails?.pan_number || user?.pan || "",
        aadhaarLast4: aadhaarVal || "",
        address: user?.address || "",
        date: currentDateFormatted,
        isAlreadySigned: Boolean(res?.is_already_signed),
        ipAddress: extractedIp,
        photo: userPhoto,
        rawApiResponse: res,
      };

      setKycData(updatedData);
      console.log("[KYC API] Parsed kycData object:", updatedData);
    } catch (err) {
      console.error("[KYC API] Error loading terms:", err);
      setApiError(err?.message || "Failed to fetch KYC Terms & Conditions from server.");
    } finally {
      setLoadingKyc(false);
    }
  };

  useEffect(() => {
    loadKycTerms();
  }, []);


  const previewHtml = useMemo(() => {
    if (!termsHtml) return "";

    return prepareKycAgreementHtml({
      html: termsHtml,
      userData: {
        documentId: kycData?.documentId,
        name: kycData?.name,
        mobile: kycData?.mobile,
        pan: kycData?.pan,
        aadhaarLast4: kycData?.aadhaarLast4,
        address: kycData?.address,
        date: kycData?.date,
        ip: ipAddress,
        photo: kycData?.photo,
      },
      signature,
      signedAt,
      latitude: locationCoords.latitude,
      longitude: locationCoords.longitude,
      signatureId: termsMeta.signatureId,
      dateId: termsMeta.dateId,
      locationId: termsMeta.locationId,
    });
  }, [
    termsHtml,
    kycData,
    ipAddress,
    signature,
    signedAt,
    locationCoords.latitude,
    locationCoords.longitude,
    termsMeta,
  ]);

  useLayoutEffect(() => {
    const updateScale = () => {
      if (!previewContainerRef.current) return;

      const containerWidth = previewContainerRef.current.clientWidth;
      const horizontalPadding = 32;
      const availableWidth = containerWidth - horizontalPadding;
      const calculatedScale = availableWidth / A4_WIDTH;
      const finalScale = Math.min(1, calculatedScale);

      setPreviewScale(Math.max(finalScale, 0.1));
    };

    updateScale();

    const resizeObserver = new ResizeObserver(updateScale);

    if (previewContainerRef.current) {
      resizeObserver.observe(previewContainerRef.current);
    }

    window.addEventListener("resize", updateScale);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateScale);
    };
  }, []);

  const handleTermsToggle = (e) => {
    const checked = e.target.checked;
    setTermsAccepted(checked);
    console.log(`[KYC] Terms accepted: ${checked}`);
  };

  const handleOpenSignatureModal = () => {
    console.log("[KYC] Signature modal opened");
    setIsModalOpen(true);
  };


  const handleSignatureApplied = (signatureObj) => {
    const now = new Date();
    const timestampStr = now.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    const fullSignature = {
      ...signatureObj,
      signedAt: timestampStr,
      latitude: locationCoords.latitude,
      longitude: locationCoords.longitude,
    };

    console.log("[KYC] Signature applied at exact timestamp:", fullSignature);

    setSignature(fullSignature);
    setSignedAt(timestampStr);
    setIsModalOpen(false);
  };
  

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!termsAccepted) {
      alert("Please accept the Terms & Conditions.");
      return;
    }

    if (!signature) {
      alert("Please provide your signature.");
      return;
    }

    setIsSubmitting(true);
    const originalScale = previewScale;

    try {
      const fileName = `KYC_Agreement_${(kycData?.name || "User").replace(
        /\s+/g,
        "_"
      )}.pdf`;

      // Reset scale to 1:1 temporarily to ensure unscaled element layout during capture
      setPreviewScale(1);
      await new Promise((resolve) => setTimeout(resolve, 150));

      const pdfResult = await generateAgreementPdf({
        element: documentRef.current,
        fileName,
      });

      // setLastPdfResult(pdfResult);

      const pdfFile = new File([pdfResult.blob], pdfResult.fileName, {
        type: "application/pdf",
      });

      const latVal = locationCoords.latitude || "";
      const longVal = locationCoords.longitude || "";

      console.log("[KYC API] Submitting merchant/submitKycTermsAndConditions...", {
        fileName: pdfFile.name,
        fileSize: pdfFile.size,
        termsAccepted,
        lat: latVal,
        long: longVal,
      });

      const submitRes = await submitKycTermsAndConditions({
        kyc_terms_pdf: pdfFile,
        terms_accepted: termsAccepted,
        lat: latVal,
        long: longVal,
      });

      console.log("[KYC API] Submit API Response:", submitRes);

      if (
        submitRes?.status === true ||
        submitRes?.success === true ||
        submitRes?.success === 1
      ) {
        setSubmissionComplete(true);

        router.push("/profile/kyc-docs");
      } else {
        alert(submitRes?.message || "Failed to submit KYC Agreement to backend.");
      }
    } catch (error) {
      console.error("[KYC] Agreement submission failed:", error);
      alert(error?.message || "Failed to generate agreement PDF.");
    } finally {
      setPreviewScale(originalScale);
      setIsSubmitting(false);
    }
  };

  const scaledDocumentWidth = A4_WIDTH * previewScale;
  const scaledDocumentHeight = A4_HEIGHT * PAGE_COUNT * previewScale;

  return (
    <div className="min-h-screen bg-slate-100 pb-12">
      <SubHeader
        title="KYC Agreement & E-Signature"
        backHref="/profile"
        showImg={false}
      />

      <div className="mx-auto w-full max-w-6xl px-4 pt-4">
        {/* PREVIEW CONTAINER */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 py-3 sm:px-5">
            <div>
              <h2 className="text-sm font-bold text-slate-900 sm:text-[13px]">
                Merchant Agreement Preview
              </h2>
              <p className="mt-0.5 text-slate-500 sm:text-[9px] text-xs">
                Review the complete agreement before signing.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="rounded-md bg-slate-100 px-1 py-1 text-xs sm:text-xs font-semibold text-slate-500">
                2 Pages
              </span>

              {previewScale < 1 && (
                <span className="hidden rounded-md bg-blue-50 px-2.5 py-1 text-[10px] font-semibold text-blue-600 sm:inline-flex">
                  {Math.round(previewScale * 100)}%
                </span>
              )}
            </div>
          </div>

          <div
            ref={previewContainerRef}
            className="no-scrollbar h-[70vh] min-h-[500px] overflow-auto bg-slate-100 p-4 sm:h-[75vh] sm:p-2"
          >
            {loadingKyc ? (
              <div className="flex h-full w-full flex-col items-center justify-center gap-3 py-20 text-slate-500">
                <span className="h-8 w-8 animate-spin rounded-full border-3 border-primary border-t-transparent" />
                <p className="text-xs font-semibold">Loading KYC Terms & Details...</p>
              </div>
            ) : apiError ? (
              <div className="flex h-full w-full flex-col items-center justify-center gap-3 py-20 text-center text-slate-600">
                <p className="text-xs font-semibold text-rose-600">{apiError}</p>
                <button
                  type="button"
                  onClick={loadKycTerms}
                  className="rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:opacity-90 cursor-pointer"
                >
                  Retry Loading
                </button>
              </div>
            ) : (
              <div
                className="mx-auto"
                style={{
                  width: `${scaledDocumentWidth}px`,
                  height: `${scaledDocumentHeight}px`,
                }}
              >
                <div
                  style={{
                    width: `${A4_WIDTH}px`,
                    transform: `scale(${previewScale})`,
                    transformOrigin: "top left",
                  }}
                >
                  <KycAgreementPreview ref={documentRef} html={previewHtml} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ACTION / CONTROL CARD */}
        <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-col lg:items-center lg:justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Agreement Actions
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Accept the terms, apply your signature, and submit the agreement.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleOpenSignatureModal}
                className="flex items-center gap-1.5 rounded-xl bg-teal px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:opacity-95 cursor-pointer"
              >
                <span>
                  {signature ? "Change Signature" : "Add E-Signature"}
                </span>
              </button>

              <button
                type="button"
                disabled={!termsAccepted || !signature || isSubmitting}
                onClick={handleSubmit}
                className="flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-xs font-bold text-white shadow-md transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Generating PDF...</span>
                  </>
                ) : (
                  <>
                    <span>Submit Document</span>
                    <span>→</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="mt-4 flex flex-col items-center gap-3 border-t border-slate-100 pt-3 text-xs sm:flex-col sm:items-center sm:justify-between">
            <label className="flex cursor-pointer items-start gap-2 font-bold text-slate-800">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={handleTermsToggle}
                className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-slate-300 text-primary focus:ring-primary"
              />
              <span>I have read and agree to the Terms & Conditions</span>
            </label>

            {/* STATUS ROW: Displays Terms & Conditions Status + E-Signature Status ONLY */}
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-bold ${
                  termsAccepted
                    ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {termsAccepted ? "✓ T&C Accepted" : "○ T&C Pending"}
              </span>

              <span
                className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-bold ${
                  signature
                    ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {signature
                  ? "✓ E-Signature Completed"
                  : "○ E-Signature Pending"}
              </span>
            </div>
          </div>

          {submissionComplete && (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-bold text-emerald-800">
              <span className="flex-1">
                Agreement submitted successfully!
              </span>

              <button
                type="button"
                onClick={() => setSubmissionComplete(false)}
                className="ml-2 text-[11px] font-semibold text-emerald-900 underline cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}
        </div>
      </div>

      <SignatureModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onApply={handleSignatureApplied}
        initialName={kycData?.name || ""}
      />
    </div>
  );
}
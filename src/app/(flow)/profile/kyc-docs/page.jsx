"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SubHeader } from "@/components/ui/SubHeader";
import { useAuthStore } from "@/lib/auth/store";
import { getUserKyc, getKycTermsAndConditions } from "@/features/profile/api";

import { KycDocCard } from "@/features/profile/components/kyc/KycDocCard";
import { AadhaarKycModal } from "@/features/profile/components/kyc/AadhaarKycModal";
import { PanKycModal } from "@/features/profile/components/kyc/PanKycModal";
import { SelfieKycModal } from "@/features/profile/components/kyc/SelfieKycModal";
import { VideoKycModal } from "@/features/profile/components/kyc/VideoKycModal";

export default function KycDocsPage() {
  const router = useRouter();
  const updateKycCompleted = useAuthStore((s) => s.updateKycCompleted);

  const [loading, setLoading] = useState(true);
  const [aadhaarStatus, setAadhaarStatus] = useState("pending");
  const [panStatus, setPanStatus] = useState("pending");
  const [selfieStatus, setSelfieStatus] = useState("pending");
  const [videoStatus, setVideoStatus] = useState("pending");

  const [isAgreementSigned, setIsAgreementSigned] = useState(false);
  const [agreementPdfUrl, setAgreementPdfUrl] = useState("");
  const [isDownloadingAgreement, setIsDownloadingAgreement] = useState(false);

  const [adharMessg, setAdharMessg] = useState("");
  const [panMessg, setPanMessg] = useState("");
  const [selfieMessg, setSelfieMessg] = useState("");
  const [videoMessg, setVideoMessg] = useState("");

  const [flowStep, setFlowStep] = useState("none");

  const normalizeStatus = (statusStr) => {
    const s = String(statusStr || "").trim().toLowerCase();
    if (["approved", "verified", "1", "success"].includes(s)) return "Approved";
    if (["pending", "failed", "2"].includes(s)) return "Pending";
    if (["processing", "in_progress", "under_review", "review"].includes(s)) return "Processing";
    if (["rejected", "failed", "declined", "2"].includes(s)) return "Rejected";
    return "not_uploaded";
  };

  const fetchKycStatus = async () => {
    setLoading(true);
    try {
      const res = await getUserKyc();
      const statusData = res?.data || res || {};
      const history = statusData?.history_data || statusData || {};
      const rawAadhaar = history?.id_status || statusData?.aadhaar_status || "pending";
      const rawPan = history?.pan_status || statusData?.pan_status || "pending";
      const rawSelfie = history?.selfie_status;
      const rawVideo = history?.video_status;
      const adharmessg = history?.id_message;
      const panmesg = history?.pan_message;
      const selfiemesg = history?.selfie_message;
      const videoMessag = history?.video_message;

      setAadhaarStatus(rawAadhaar);
      setPanStatus(rawPan);
      setSelfieStatus(rawSelfie);
      setVideoStatus(rawVideo);

      setAdharMessg(adharmessg);
      setPanMessg(panmesg);
      setSelfieMessg(selfiemesg);
      setVideoMessg(videoMessag);

      // Check KYC Terms & Conditions signed status and PDF upload path
      try {
        const termsRes = await getKycTermsAndConditions();
        const signedState = Boolean(
          termsRes?.is_already_signed || termsRes?.data?.is_already_signed
        );
        // const signedState = false;
        setIsAgreementSigned(signedState);

        const pdfPath = termsRes?.file_upload_path || termsRes?.data?.pdf_url ||  "";
        setAgreementPdfUrl(pdfPath);
      } catch (e) {
        console.warn("Error checking agreement signed status:", e);
      }

      if (
        normalizeStatus(rawAadhaar) === "Approved" &&
        normalizeStatus(rawPan) === "processing" &&
        normalizeStatus(rawSelfie) === "Approved" &&
        normalizeStatus(rawVideo) === "Approved"
      ) {
        updateKycCompleted(true);
      }
    } catch (err) {
      console.error("fetchKycStatus error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKycStatus();
  }, []);


  const handleDownloadAgreement = async () => {
    setIsDownloadingAgreement(true);
    try {
      let targetUrl = agreementPdfUrl;

      if (!targetUrl) {
        const res = await getKycTermsAndConditions();
        targetUrl =
          res?.data?.file_upload_path ||
          res?.file_upload_path ||
          res?.data?.pdf_url ||
          "";
      }

      if (!targetUrl) {
        throw new Error("Signed agreement PDF file URL unavailable.");
      }

      const response = await fetch(targetUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch file from server (Status: ${response.status})`);
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      const anchor = document.createElement("a");
      anchor.href = blobUrl;
      anchor.download = "Agreement.pdf";

      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);

      setTimeout(() => {
        URL.revokeObjectURL(blobUrl);
      }, 1000);
    } catch (err) {
      console.error("[KYC Download] Direct download failed:", err);
      alert(err?.message || "Failed to download KYC Agreement PDF.");
    } finally {
      setIsDownloadingAgreement(false);
    }
  };

  // const isAadhaarAndPanApproved =
  // normalizeStatus(aadhaarStatus) === "Approved" &&
  // normalizeStatus(panStatus) === "Approved";

  return (
    <>
      <SubHeader title="KYC documents" backHref="/profile" showImg={false} />

      <div className="flex flex-col gap-4 p-4">
        {loading ? (
          <div className="flex h-32 items-center justify-center rounded-2xl bg-surface">
            <span className="text-sm font-semibold text-text-2">Loading document status...</span>
          </div>
        ) : (
          <>
            {/* Card 1: Aadhaar Card */}
            <KycDocCard
              title="Aadhaar card"
              subtitle={adharMessg}
              status={aadhaarStatus}
              icon={
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-soft">
                  <svg viewBox="0 0 24 24" className="h-6 w-6 fill-violet">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zm0 4v10h16V8H4zm2 2h4v2H6v-2zm0 4h7v2H6v-2z" />
                  </svg>
                </div>
              }
              onVerify={() => setFlowStep("aadhaar")}
            />

            {/* Card 2: PAN Card */}
            <KycDocCard
              title="PAN card"
              subtitle={panMessg}
              status={panStatus}
              icon={
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-soft">
                  <svg viewBox="0 0 24 24" className="h-6 w-6 fill-orange">
                    <path d="M19 3H5c-1.11 0-2 .89-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.11-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
                  </svg>
                </div>
              }
              onVerify={() => setFlowStep("pan")}
            />

            {/* Card 3: Selfie Verification */}
            <KycDocCard
              title="Selfie verification"
              subtitle={selfieMessg}
              status={selfieStatus}
              // disabled={!isAadhaarAndPanApproved}
              icon={
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-soft">
                  <svg viewBox="0 0 24 24" className="h-6 w-6 fill-teal">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                </div>
              }
              onVerify={() => setFlowStep("selfie")}
            />

            {/* Card 4: Video KYC */}
            <KycDocCard
              title="Video KYC"
              subtitle={videoMessg}
              status={videoStatus}
              // disabled={!isAadhaarAndPanApproved}
              icon={
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-soft">
                  <svg viewBox="0 0 24 24" className="h-6 w-6 fill-accent">
                    <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" />
                  </svg>
                </div>
              }
              onVerify={() => setFlowStep("video")}
            />

            {/* Card 5: KYC Agreement & E-Signature */}
            <KycDocCard
              title="Agreement & E-Signature"
              status={isAgreementSigned ? "Approved" : "pending"}
              isAlreadySigned={isAgreementSigned}
              isDownloading={isDownloadingAgreement}
              onVerify={() => router.push("/kyc-agreement")}
              // disabled={!isAadhaarAndPanApproved}
              onDownload={handleDownloadAgreement}
              icon={
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft">
                  <svg viewBox="0 0 24 24" className="h-6 w-6 fill-primary">
                    <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
                  </svg>
                </div>
              }
            />

            {/* Note Box */}
            {normalizeStatus(panStatus) !== "Approved" && (
              <div className="flex items-start gap-3 rounded-2xl border border-border bg-surface-2 p-4 text-[12px] text-text-2">
                <svg viewBox="0 0 24 24" className="h-5 w-5 flex-none fill-text-3 mt-0.5">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
                </svg>
                <p className="leading-relaxed">
                  Banking services (AEPS, Money Transfer, Aadhaar Pay) stay locked until PAN is verified. Verification takes about 10 minutes after upload.
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      <AadhaarKycModal
        isOpen={flowStep === "aadhaar"}
        onClose={() => setFlowStep("none")}
        onSuccess={(num) => {
          setAadhaarStatus("Approved");
          if (normalizeStatus(panStatus) !== "Approved") {
            setFlowStep("pan");
          } else {
            setFlowStep("none");
          }
        }}
      />

      <PanKycModal
        isOpen={flowStep === "pan"}
        onClose={() => setFlowStep("none")}
        onSuccess={(panNum) => {
          setPanStatus("processing");
          setFlowStep("none");
        }}
      />

      <SelfieKycModal
        isOpen={flowStep === "selfie"}
        onClose={() => setFlowStep("none")}
        onSuccess={() => {
          setSelfieStatus("Processing");
          setFlowStep("none");
        }}
      />

      <VideoKycModal
        isOpen={flowStep === "video"}
        onClose={() => setFlowStep("none")}
        onSuccess={() => {
          setVideoStatus("Processing");
          setFlowStep("none");
        }}
      />
    </>
  );
}

"use client";

import { useState, useEffect, useRef } from "react";
import { submitSelfieVerification } from "@/features/profile/api";

export function SelfieKycModal({ isOpen, onClose, onSuccess }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [capturedSelfie, setCapturedSelfie] = useState(null);
  const [selfiePreview, setSelfiePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Location States
  const [selfieLocation, setSelfieLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState("");

  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const fetchUserLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator?.geolocation) {
        const msg = "Location is not supported by your browser.";
        setLocationError(msg);
        reject(new Error(msg));
        return;
      }

      setLocationLoading(true);
      setLocationError("");

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude, accuracy } = position.coords;

          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000);

            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`,
              { signal: controller.signal }
            );
            clearTimeout(timeoutId);

            let address = "Address unavailable";
            let cityState = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;

            if (response.ok) {
              const data = await response.json();
              address = data.display_name || address;
              const addrObj = data.address || {};
              const city = addrObj.city || addrObj.town || addrObj.village || addrObj.suburb || "";
              const state = addrObj.state || "";
              const country = addrObj.country || "";
              const parts = [city, state, country].filter(Boolean);
              if (parts.length > 0) cityState = parts.join(", ");
            }

            const locData = {
              latitude,
              longitude,
              accuracy,
              address,
              cityState,
            };

            setSelfieLocation(locData);
            setLocationError("");
            resolve(locData);
          } catch (err) {
            console.error("Reverse geocoding error:", err);
            const fallbackLoc = {
              latitude,
              longitude,
              accuracy,
              address: `Lat: ${latitude.toFixed(6)}, Long: ${longitude.toFixed(6)}`,
              cityState: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
            };
            setSelfieLocation(fallbackLoc);
            setLocationError("");
            resolve(fallbackLoc);
          } finally {
            setLocationLoading(false);
          }
        },
        (err) => {
          setLocationLoading(false);
          const msg =
            err.code === 1
              ? "Please allow location access to capture selfie."
              : "Unable to fetch location. Please check GPS settings.";
          setLocationError(msg);
          reject(new Error(msg));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  };

  const startCamera = async () => {
    setErrorMsg("");
    setLocationError("");
    setSelfieLocation(null);
    setCapturedSelfie(null);
    if (selfiePreview) {
      URL.revokeObjectURL(selfiePreview);
      setSelfiePreview(null);
    }

    try {
      stopCameraStream();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // Fetch user location simultaneously
      fetchUserLocation().catch((err) => {
        console.error("Location init error:", err);
      });
    } catch (err) {
      console.error("Camera access error:", err);
      setErrorMsg("Unable to access camera. Please grant camera permission.");
    }
  };

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCameraStream();
    }
    return () => {
      stopCameraStream();
    };
  }, [isOpen]);

  if (!isOpen) return null;



const handleCapturePhoto = async () => {
  const video = videoRef.current;

  if (!video) {
    setErrorMsg("Camera is not ready. Please try again.");
    return;
  }

  if (
    video.readyState < 2 ||
    !video.videoWidth ||
    !video.videoHeight
  ) {
    setErrorMsg(
      "Camera is still loading. Please wait a moment and try again."
    );
    return;
  }

  if (!selfieLocation) {
    setErrorMsg(
      "Location access is required to capture selfie."
    );
    return;
  }

  try {

    const previewContainer = video.parentElement;

    if (!previewContainer) {
      setErrorMsg("Unable to determine camera preview size.");
      return;
    }

    const containerWidth = previewContainer.clientWidth;
    const containerHeight = previewContainer.clientHeight;


    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;

    const containerRatio =
      containerWidth / containerHeight;

    const videoRatio =
      videoWidth / videoHeight;

    let sourceX = 0;
    let sourceY = 0;
    let sourceWidth = videoWidth;
    let sourceHeight = videoHeight;

    if (videoRatio > containerRatio) {
  
      sourceWidth =
        videoHeight * containerRatio;

      sourceX =
        (videoWidth - sourceWidth) / 2;

    } else {
   
      sourceHeight =
        videoWidth / containerRatio;

      sourceY =
        (videoHeight - sourceHeight) / 2;
    }

    console.log("Camera:", videoWidth, videoHeight);

    console.log("Preview:", {
      width: containerWidth,
      height: containerHeight,
    });

    console.log("Crop:", {
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
    });


    const canvas = document.createElement("canvas");


    canvas.width = Math.round(containerWidth * 2);
    canvas.height = Math.round(containerHeight * 2);

    const ctx = canvas.getContext("2d");

    if (!ctx) {
      setErrorMsg("Unable to capture photo.");
      return;
    }

    ctx.drawImage(
      video,

      // SOURCE
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,

      // DESTINATION
      0,
      0,
      canvas.width,
      canvas.height
    );

    const width = canvas.width;
    const height = canvas.height;

    const cardWidth =
      width * 0.62;

    // Right margin = 2.5%
    const marginRight =
      width * 0.025;

    // Bottom margin = 2.5%
    const marginBottom =
      height * 0.025;


    const cardX =
      width -
      cardWidth -
      marginRight;

    const titleFontSize =
      Math.max(18, width * 0.028);

    const bodyFontSize =
      Math.max(13, width * 0.018);

    const footerFontSize =
      Math.max(11, width * 0.015);

    const cardPadding =
      Math.max(14, width * 0.018);

    const lineHeight =
      bodyFontSize * 1.4;

    const textWidth =
      cardWidth -
      cardPadding * 2;

    const wrapText = (text, maxWidth) => {
      const words =
        String(text || "").split(/\s+/);

      const lines = [];

      let currentLine = "";

      for (const word of words) {
        const testLine = currentLine
          ? `${currentLine} ${word}`
          : word;

        if (
          ctx.measureText(testLine).width >
            maxWidth &&
          currentLine
        ) {
          lines.push(currentLine);

          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }

      if (currentLine) {
        lines.push(currentLine);
      }

      return lines;
    };

    ctx.font =
      `${bodyFontSize}px Arial, sans-serif`;

    const addressLines =
      wrapText(
        selfieLocation.address,
        textWidth
      );

    const latLongAccLine =
      `Lat ${selfieLocation.latitude.toFixed(6)}, ` +
      `Long ${selfieLocation.longitude.toFixed(6)} | ` +
      `Acc: ${Math.round(
        selfieLocation.accuracy
      )}m`;

    const nowStr =
      new Date().toLocaleString(
        "en-IN",
        {
          dateStyle: "medium",
          timeStyle: "short",
        }
      );

    const middleLines = [
      ...addressLines,
      latLongAccLine,
    ];

    const titleHeight =
      titleFontSize * 1.25;

    const footerHeight =
      footerFontSize * 1.4;

    const cardHeight =
      cardPadding * 2 +
      titleHeight +
      middleLines.length *
        lineHeight +
      footerHeight;

    const cardY =
      height -
      cardHeight -
      marginBottom;


    const radius =
      Math.max(
        10,
        width * 0.015
      );

    ctx.beginPath();

    ctx.moveTo(
      cardX + radius,
      cardY
    );

    ctx.lineTo(
      cardX +
        cardWidth -
        radius,
      cardY
    );

    ctx.quadraticCurveTo(
      cardX + cardWidth,
      cardY,
      cardX + cardWidth,
      cardY + radius
    );

    ctx.lineTo(
      cardX + cardWidth,
      cardY +
        cardHeight -
        radius
    );

    ctx.quadraticCurveTo(
      cardX + cardWidth,
      cardY + cardHeight,
      cardX +
        cardWidth -
        radius,
      cardY + cardHeight
    );

    ctx.lineTo(
      cardX + radius,
      cardY + cardHeight
    );

    ctx.quadraticCurveTo(
      cardX,
      cardY + cardHeight,
      cardX,
      cardY +
        cardHeight -
        radius
    );

    ctx.lineTo(
      cardX,
      cardY + radius
    );

    ctx.quadraticCurveTo(
      cardX,
      cardY,
      cardX + radius,
      cardY
    );

    ctx.closePath();

    ctx.fillStyle =
      "rgba(0, 0, 0, 0.65)";

    ctx.fill();


    ctx.textAlign = "left";
    ctx.textBaseline = "top";

    const textLeftX =
      cardX + cardPadding;

    let currentY =
      cardY + cardPadding;

    ctx.font =
      `600 ${titleFontSize}px Arial, sans-serif`;

    ctx.fillStyle = "#ffffff";

    ctx.fillText(
      selfieLocation.cityState ||
        "Location Stamped",
      textLeftX,
      currentY,
      textWidth
    );

    currentY += titleHeight;

    ctx.font =
      `${bodyFontSize}px Arial, sans-serif`;

    ctx.fillStyle = "#e5e7eb";

    middleLines.forEach((line) => {
      ctx.fillText(
        line,
        textLeftX,
        currentY,
        textWidth
      );

      currentY += lineHeight;
    });


    currentY += Math.max(
      4,
      width * 0.004
    );

    ctx.font =
      `${footerFontSize}px Arial, sans-serif`;

    ctx.fillStyle = "#a3a3a3";

    // LEFT
    ctx.textAlign = "left";

    ctx.fillText(
      nowStr,
      cardX + cardPadding,
      currentY
    );

    // RIGHT
    ctx.textAlign = "right";

    ctx.fillText(
      "EG Merchant Camera",
      cardX +
        cardWidth -
        cardPadding,
      currentY
    );

    const blob = await new Promise(
      (resolve) => {
        canvas.toBlob(
          resolve,
          "image/jpeg",
          0.9
        );
      }
    );

    if (!blob) {
      setErrorMsg(
        "Failed to generate stamped selfie image."
      );
      return;
    }


    const selfieFile =
      new File(
        [blob],
        "selfie.jpg",
        {
          type: "image/jpeg",
        }
      );

    const previewUrl =
      URL.createObjectURL(
        selfieFile
      );

    if (selfiePreview) {
      URL.revokeObjectURL(
        selfiePreview
      );
    }

    setCapturedSelfie(
      selfieFile
    );

    setSelfiePreview(
      previewUrl
    );

    setErrorMsg("");

    stopCameraStream();

  } catch (error) {
    console.error(
      "Selfie capture error:",
      error
    );

    setErrorMsg(
      "Unable to capture selfie. Please try again."
    );
  }
};

  const handleSubmit = async () => {
    if (!capturedSelfie) {
      setErrorMsg("Please capture or upload a selfie first.");
      return;
    }

    setErrorMsg("");
    setSubmitting(true);
    try {
      const latVal = selfieLocation?.latitude ? String(selfieLocation.latitude) : "";
      const longVal = selfieLocation?.longitude ? String(selfieLocation.longitude) : "";
      const address = selfieLocation?.address ?  String(selfieLocation.address) : "";
      const res = await submitSelfieVerification({
        selfie: capturedSelfie,
        lat: latVal,
        long: longVal,
        address: address
      });
      if (res?.success === 1 || res?.status === true) {
        onSuccess();
        onClose();
      } else {
        setErrorMsg(res?.message || "Selfie submission failed. Please try again.");
      }
    } catch (err) {
      setErrorMsg(err?.message || "Selfie submission failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg rounded-3xl bg-surface p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-[17px] font-bold text-text">Selfie Verification</h3>
          <button onClick={onClose} className="text-text-3 hover:text-text">✕</button>
        </div>
        <p className="mt-1 text-[13px] text-text-2">Capture a clear photo with automatic GPS location stamping</p>

        {errorMsg && (
          <div className="mt-3 rounded-xl bg-accent-soft p-3 text-[12px] font-semibold text-accent">
            {errorMsg}
          </div>
        )}

        <div className="mt-4 flex flex-col items-center gap-3">
          <div className="relative h-80 w-full overflow-hidden rounded-2xl border-2 border-border bg-black">
            {capturedSelfie ? (
              <img src={selfiePreview} alt="Selfie preview" className="h-full w-full object-cover" />
            ) : (
              <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
            )}
          </div>

          {/* Location status badge */}
          {!capturedSelfie && (
            <div className="w-full">
              {locationLoading && (
                <div className="flex items-center justify-center gap-2 rounded-xl bg-surface-2 p-2 text-[12px] font-semibold text-text-2">
                  <span className="h-3 w-3 rounded-full bg-primary animate-ping" />
                  Fetching GPS location & address...
                </div>
              )}

              {selfieLocation && !locationLoading && (
                <div className="flex items-center justify-between rounded-xl bg-teal-soft/60 px-3 py-2 text-[11.5px] font-semibold text-teal">
                  <div className="w-3/4">📍 {selfieLocation.address}</div>
                  <div className="text-[10px] font-bold uppercase bg-teal/10 px-1.5 py-0.5 rounded">GPS Ready</div>
                </div>
              )}

              {locationError && !locationLoading && (
                <div className="flex items-center justify-between rounded-xl bg-accent-soft px-3 py-2 text-[11.5px] font-semibold text-accent">
                  <span>⚠️ {locationError}</span>
                  <button
                    onClick={() => fetchUserLocation().catch(() => {})}
                    className="text-[11px] underline font-bold hover:opacity-80"
                  >
                    Retry
                  </button>
                </div>
              )}
            </div>
          )}

          {!capturedSelfie ? (
            <div className="flex w-full gap-2">
              <button
                disabled={locationLoading || !selfieLocation}
                onClick={handleCapturePhoto}
                className="flex-1 rounded-xl bg-teal py-3 font-display text-[14px] font-bold text-white shadow-sm hover:opacity-95 disabled:opacity-50 transition"
              >
                 Capture Photo
              </button>
            </div>
          ) : (
            <div className="flex w-full gap-2">
              <button
                onClick={startCamera}
                className="flex-1 rounded-xl border border-border bg-surface-2 py-3 font-display text-[14px] font-bold text-text hover:bg-surface transition"
              >
                ↻ Retake Photo
              </button>
              <button
                disabled={submitting}
                onClick={handleSubmit}
                className="flex-1 rounded-xl bg-primary py-3 font-display text-[14px] font-bold text-white shadow-sm hover:opacity-95 disabled:opacity-50 transition"
              >
                {submitting ? "Uploading..." : "Submit Selfie"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

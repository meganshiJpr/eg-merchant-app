"use client";

import { useState, useEffect, useRef } from "react";
import { videoKycScript, uploadVideoKyc } from "@/features/profile/api";

export function VideoKycModal({ isOpen, onClose, onSuccess }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const recordingIntervalRef = useRef(null);
  const animFrameRef = useRef(null);

  const [recordedVideo, setRecordedVideo] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [videoScriptData, setVideoScriptData] = useState(null);
  const [loadingScript, setLoadingScript] = useState(false);
  const [selectedLang, setSelectedLang] = useState("en");

  // Location States
  const [videoLocation, setVideoLocation] = useState(null);
  const videoLocationRef = useRef(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState("");

  const minTime = Number(videoScriptData?.min_time) || 10;
  const maxTime = Number(videoScriptData?.max_time || videoScriptData?.video_time) || 60;

  const stopCameraStream = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
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

            videoLocationRef.current = locData;
            setVideoLocation(locData);
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
            videoLocationRef.current = fallbackLoc;
            setVideoLocation(fallbackLoc);
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
              ? "Please allow location access to record Video KYC."
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

  // Render loop to paint camera frame + GPS Location overlay on Canvas
 const renderCanvasLoop = () => {
  const video = videoRef.current;
  const canvas = canvasRef.current;

  if (
    video &&
    canvas &&
    video.readyState >= 2 &&
    video.videoWidth > 0 &&
    video.videoHeight > 0
  ) {
    // =====================================================
    // 1. PREVIEW CONTAINER SIZE
    // =====================================================

    const previewContainer = canvas.parentElement;

    if (!previewContainer) {
      animFrameRef.current =
        requestAnimationFrame(renderCanvasLoop);
      return;
    }

    const containerWidth =
      previewContainer.clientWidth;

    const containerHeight =
      previewContainer.clientHeight;

    if (!containerWidth || !containerHeight) {
      animFrameRef.current =
        requestAnimationFrame(renderCanvasLoop);
      return;
    }

    // =====================================================
    // 2. ACTUAL CAMERA SIZE
    // =====================================================

    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;

    // =====================================================
    // 3. OBJECT-COVER CROP
    // =====================================================

    const containerRatio =
      containerWidth / containerHeight;

    const videoRatio =
      videoWidth / videoHeight;

    let sourceX = 0;
    let sourceY = 0;
    let sourceWidth = videoWidth;
    let sourceHeight = videoHeight;

    if (videoRatio > containerRatio) {
      // Camera frame is wider
      // Crop left + right

      sourceWidth =
        videoHeight * containerRatio;

      sourceX =
        (videoWidth - sourceWidth) / 2;
    } else {
      // Camera frame is taller
      // Crop top + bottom

      sourceHeight =
        videoWidth / containerRatio;

      sourceY =
        (videoHeight - sourceHeight) / 2;
    }

    // =====================================================
    // 4. CANVAS SIZE
    // =====================================================

    /*
      Keep a higher resolution than the UI preview.

      2x preview dimensions gives better
      recording quality while maintaining
      the same aspect ratio.
    */

    const targetWidth =
      Math.round(containerWidth * 2);

    const targetHeight =
      Math.round(containerHeight * 2);

    if (
      canvas.width !== targetWidth ||
      canvas.height !== targetHeight
    ) {
      canvas.width = targetWidth;
      canvas.height = targetHeight;
    }

    const ctx =
      canvas.getContext("2d");

    if (ctx) {
      // ===================================================
      // 5. DRAW EXACT SAME CROP AS object-cover
      // ===================================================

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

      // ===================================================
      // 6. LOCATION OVERLAY
      // ===================================================

      const currentLoc =
        videoLocationRef.current;

      if (currentLoc) {
        const width = canvas.width;
        const height = canvas.height;

        // =================================================
        // RESPONSIVE CARD SIZE
        // =================================================

        const cardWidth =
          width * 0.62;

        // Bottom-right positioning
        const marginRight =
          width * 0.025;

        const marginBottom =
          height * 0.025;

        const cardX =
          width -
          cardWidth -
          marginRight;

        // =================================================
        // RESPONSIVE FONT
        // =================================================

        const titleFontSize =
          Math.max(
            18,
            width * 0.028
          );

        const bodyFontSize =
          Math.max(
            13,
            width * 0.018
          );

        const footerFontSize =
          Math.max(
            11,
            width * 0.015
          );

        const cardPadding =
          Math.max(
            14,
            width * 0.018
          );

        const lineHeight =
          bodyFontSize * 1.4;

        const textWidth =
          cardWidth -
          cardPadding * 2;

        // =================================================
        // TEXT WRAP
        // =================================================

        const wrapText = (
          text,
          maxWidth
        ) => {
          const words =
            String(text || "")
              .split(/\s+/);

          const lines = [];

          let currentLine = "";

          for (const word of words) {
            const testLine =
              currentLine
                ? `${currentLine} ${word}`
                : word;

            if (
              ctx.measureText(testLine)
                .width > maxWidth &&
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
        // LOCATION TEXT
        ctx.font =
          `${bodyFontSize}px Arial, sans-serif`;

        const addressLines =
          wrapText(
            currentLoc.address,
            textWidth
          );

        const latLongAccLine =
          `Lat ${currentLoc.latitude.toFixed(6)}, ` +
          `Long ${currentLoc.longitude.toFixed(6)} | ` +
          `Acc: ${Math.round(
            currentLoc.accuracy
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
          currentLoc.cityState ||
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

        // Date/time - left
        ctx.textAlign = "left";

        ctx.fillText(
          nowStr,
          cardX + cardPadding,
          currentY
        );

        // EG Merchant - right
        ctx.textAlign = "right";

        ctx.fillText(
          "EG Merchant Video KYC",
          cardX +
            cardWidth -
            cardPadding,
          currentY
        );
      }
    }
  }

  animFrameRef.current =
    requestAnimationFrame(
      renderCanvasLoop
    );
};

  const startCamera = async () => {
    setErrorMsg("");
    setRecordedVideo(null);
    setVideoLocation(null);
    videoLocationRef.current = null;
    if (videoPreview) {
      URL.revokeObjectURL(videoPreview);
      setVideoPreview(null);
    }
    setIsRecording(false);
    setRecordingSeconds(0);
    setLoadingScript(true);

    try {
      stopCameraStream();

      const [scriptRes, streamResult] = await Promise.allSettled([
        videoKycScript(),
        navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: true,
        }),
      ]);

      if (scriptRes.status === "fulfilled") {
        const dataObj = scriptRes.value?.data || scriptRes.value || {};
        setVideoScriptData(dataObj);
      }

      if (streamResult.status === "fulfilled") {
        streamRef.current = streamResult.value;
        if (videoRef.current) {
          videoRef.current.srcObject = streamResult.value;
        }

        // Start continuous canvas rendering loop
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = requestAnimationFrame(renderCanvasLoop);
      } else {
        console.error("Video camera access error:", streamResult.reason);
        setErrorMsg("Unable to access camera and microphone. Please allow permissions.");
      }

      // Fetch user location
      fetchUserLocation().catch((err) => {
        console.error("Location init error:", err);
      });
    } catch (err) {
      console.error("Video camera error:", err);
      setErrorMsg("Unable to access camera and microphone.");
    } finally {
      setLoadingScript(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
      stopCameraStream();
    }
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      stopCameraStream();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const getScriptText = () => {
    if (!videoScriptData) return "";
    if (typeof videoScriptData === "string") return videoScriptData;
    if (selectedLang === "hi") {
      return videoScriptData.hindi_script || videoScriptData.script_hi || videoScriptData.hi_script || "";
    }
    return videoScriptData.english_script || videoScriptData.script_en || videoScriptData.en_script || "";
  };

  const getGuideText = () => {
    if (!videoScriptData || typeof videoScriptData !== "object") return "";
    if (selectedLang === "hi") {
      return videoScriptData.hindi_guide || videoScriptData.guide_hi || "";
    }
    return videoScriptData.english_guide || videoScriptData.guide_en || "";
  };

  const getDemoVideoUrl = () => {
    if (!videoScriptData || typeof videoScriptData !== "object") return "";
    if (selectedLang === "hi") {
      return videoScriptData.hindi_demo_video || videoScriptData.english_demo_video || "";
    }
    return videoScriptData.english_demo_video || videoScriptData.hindi_demo_video || "";
  };

  const startVideoRecording = () => {
    if (!streamRef.current) {
      setErrorMsg("Camera is not ready. Please start the camera first.");
      return;
    }

    if (!videoLocation) {
      setErrorMsg("Location access is required before recording video.");
      return;
    }

    if (typeof MediaRecorder === "undefined") {
      setErrorMsg("Video recording is not supported in this browser.");
      return;
    }

    chunksRef.current = [];
    setErrorMsg("");
    setRecordingSeconds(0);

    if (videoPreview) {
      URL.revokeObjectURL(videoPreview);
      setVideoPreview(null);
    }
    setRecordedVideo(null);

    try {
      // 1. Capture 30 FPS video stream from Canvas (with location overlay painted)
      const canvas = canvasRef.current;
      let recordStream = streamRef.current;

      if (canvas && canvas.captureStream) {
        const canvasStream = canvas.captureStream(30);
        // Attach audio track from microphone stream
        const audioTrack = streamRef.current.getAudioTracks()[0];
        if (audioTrack) {
          canvasStream.addTrack(audioTrack);
        }
        recordStream = canvasStream;
      }

      const mimeType = [
        "video/webm;codecs=vp9,opus",
        "video/webm;codecs=vp8,opus",
        "video/webm",
        "video/mp4",
      ].find((type) => MediaRecorder.isTypeSupported(type));

      const mediaRecorder = new MediaRecorder(
        recordStream,
        mimeType ? { mimeType } : undefined
      );

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: mediaRecorder.mimeType || "video/webm",
        });

        if (!blob.size) {
          setErrorMsg("Video recording failed. Please try again.");
          stopCameraStream();
          return;
        }

        const extension = blob.type.includes("mp4") ? "mp4" : "webm";
        const videoFile = new File([blob], `video.${extension}`, { type: blob.type });

        setRecordedVideo(videoFile);
        setVideoPreview(URL.createObjectURL(videoFile));
        chunksRef.current = [];
        stopCameraStream();
      };

      mediaRecorder.onerror = (event) => {
        console.error("MediaRecorder error:", event);
        setErrorMsg("Video recording failed. Please try again.");
        setIsRecording(false);
        stopCameraStream();
      };

      mediaRecorder.start();
      setIsRecording(true);

      let seconds = 0;
      const maxSeconds = maxTime;

      recordingIntervalRef.current = setInterval(() => {
        seconds += 1;
        setRecordingSeconds(seconds);

        if (seconds >= maxSeconds) {
          stopVideoRecording(true);
        }
      }, 1000);
    } catch (err) {
      console.error("Video recording error:", err);
      setErrorMsg("Video recording failed to start.");
      setIsRecording(false);
      stopCameraStream();
    }
  };

  const stopVideoRecording = (force = false) => {
    // Cannot stop before minTime unless force=true (auto-stop)
    if (!force && recordingSeconds < minTime) {
      return;
    }

    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    } 

    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    } else {
      setIsRecording(false);
      stopCameraStream();
    }
    setIsRecording(false);
  };

  const handleSubmit = async () => {
    if (!(recordedVideo instanceof File)) {
      setErrorMsg("Please record or select a video first.");
      return;
    }

    setErrorMsg("");
    setSubmitting(true);
    try {
      const loc = videoLocationRef.current || videoLocation;
      const latVal = loc?.latitude ? String(loc.latitude) : "";
      const longVal = loc?.longitude ? String(loc.longitude) : "";
      const address = loc?.address ? String(loc.address) : "";
      const res = await uploadVideoKyc({
        video: recordedVideo,
        lat: latVal,
        long: longVal,
        address: address,
      });
      if (res?.success === 1 || res?.status === true) {
        onSuccess();
        onClose();
      } else {
        setErrorMsg(res?.message || "Video KYC upload failed. Please try again.");
      }
    } catch (err) {
      console.error("Video KYC upload error:", err);
      setErrorMsg("Video KYC upload failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg rounded-3xl bg-surface p-5 shadow-2xl overflow-y-auto max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <h3 className="font-display text-[18px] font-bold text-text">Video KYC</h3>
            <p className="text-[12px] font-semibold text-text-2">Record your live Video with GPS location</p>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-2 text-text-3 hover:text-text">
            ✕
          </button>
        </div>

        {errorMsg && (
          <div className="mt-3 rounded-xl bg-accent-soft p-3 text-[12px] font-semibold text-accent">
            {errorMsg}
          </div>
        )}

        {/* Language & Demo bar */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-surface-2 p-2.5 text-[12px]">
          <div className="flex items-center gap-1.5 font-bold">
            <span className="text-text-3">Script Language:</span>
            <button
              onClick={() => setSelectedLang("en")}
              className={`rounded-lg px-2.5 py-1 transition ${
                selectedLang === "en" ? "bg-primary text-white shadow-xs" : "bg-surface text-text-2 hover:text-text"
              }`}
            >
              English
            </button>
            <button
              onClick={() => setSelectedLang("hi")}
              className={`rounded-lg px-2.5 py-1 transition ${
                selectedLang === "hi" ? "bg-primary text-white shadow-xs" : "bg-surface text-text-2 hover:text-text"
              }`}
            >
              हिंदी
            </button>
          </div>

          {getDemoVideoUrl() && (
            <a
              href={getDemoVideoUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 font-semibold text-primary hover:underline text-[11px] bg-primary/10 px-2.5 py-1 rounded-full transition"
            >
              ▶ Watch Demo Video
            </a>
          )}
        </div>

        {/* Instruction Guide Banner */}
        {getGuideText() && (
          <div className="mt-2.5 rounded-xl border border-amber-200 bg-amber-50 p-2.5 text-[11.5px] font-semibold text-amber-900 flex items-start gap-2">
            <span className="text-amber-600 font-bold mt-0.5">ℹ️</span>
            <p className="leading-snug flex-1">{getGuideText()}</p>
          </div>
        )}

        {/* Script Display Card */}
        <div className="mt-3 rounded-2xl bg-blue-600 text-white p-4 shadow-md">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-blue-200">
            <span>Read Aloud Script</span>
            {loadingScript ? (
              <span>Loading script...</span>
            ) : (
              <span>Min: {minTime}s | Max: {maxTime}s</span>
            )}
          </div>
          <p className="mt-2 text-[14px] font-medium leading-relaxed">
            {loadingScript
              ? "Fetching script instructions..."
              : getScriptText() || "Please read the text displayed here clearly while looking into the camera."}
          </p>
        </div>

        {/* Terms link */}
        <div className="mt-2 text-right">
          <a
            href={videoScriptData?.terms_link || "https://paybyapis.com/mobile/staticPages?page=terms"}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] font-semibold text-text-3 hover:text-primary underline"
          >
            Terms & Conditions
          </a>
        </div>

        {/* Hidden Camera Element & Canvas Display Container */}
        <div className="mt-3 flex flex-col items-center gap-3">
          <div className="relative h-80 w-full overflow-hidden rounded-2xl border-2 border-border bg-black shadow-inner">
            <video ref={videoRef} autoPlay playsInline muted className="hidden" />
            
            {recordedVideo ? (
              <video src={videoPreview} controls autoPlay className="h-full w-full object-cover" />
            ) : (
              <>
                <canvas ref={canvasRef} className="h-full w-full object-cover" />
                {isRecording && (
                  <div className="absolute top-3 right-3 flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-[12px] font-bold text-white shadow-md animate-pulse">
                    <span className="h-2 w-2 rounded-full bg-white" />
                    Recording ({recordingSeconds}s / {maxTime}s)
                  </div>
                )}
              </>
            )}
          </div>

          {/* Location status badge */}
          {!recordedVideo && (
            <div className="w-full">
              {locationLoading && (
                <div className="flex items-center justify-center gap-2 rounded-xl bg-surface-2 p-2 text-[12px] font-semibold text-text-2">
                  <span className="h-3 w-3 rounded-full bg-primary animate-ping" />
                  Fetching GPS location & address...
                </div>
              )}

              {videoLocation && !locationLoading && (
                <div className="flex items-center justify-between rounded-xl bg-teal-soft/60 px-3 py-2 text-[11.5px] font-semibold text-teal">
                  <div className="w-3/4">📍 {videoLocation.address}</div>
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

          {/* Action Buttons */}
          {!recordedVideo ? (
            <div className="flex w-full gap-2">
              {!isRecording ? (
                <button
                  disabled={locationLoading || !videoLocation}
                  onClick={startVideoRecording}
                  className="flex-1 rounded-xl bg-teal py-3 font-display text-[14px] font-bold text-white shadow-sm hover:opacity-95 disabled:opacity-50 transition flex items-center justify-center gap-2"
                >
                  <span className="h-3 w-3 rounded-full bg-white animate-ping" />
                  Start Video Recording
                </button>
              ) : (
                <button
                  disabled={recordingSeconds < minTime}
                  onClick={() => stopVideoRecording(false)}
                  className="flex-1 rounded-xl bg-accent py-3 font-display text-[14px] font-bold text-white shadow-sm hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
                >
                  {recordingSeconds < minTime
                    ? `Record at least ${minTime}s (${recordingSeconds}s / ${minTime}s)`
                    : `Stop Recording (${recordingSeconds}s / ${maxTime}s)`}
                </button>
              )}
            </div>
          ) : (
            <div className="flex w-full gap-2">
              <button
                onClick={startCamera}
                className="flex-1 rounded-xl border border-border bg-surface-2 py-3 font-display text-[14px] font-bold text-text hover:bg-surface transition"
              >
                ↻ Re-record Video
              </button>
              <button
                disabled={submitting}
                onClick={handleSubmit}
                className="flex-1 rounded-xl bg-primary py-3 font-display text-[14px] font-bold text-white shadow-sm hover:opacity-95 disabled:opacity-50 transition"
              >
                {submitting ? "Uploading..." : "Upload Video KYC"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

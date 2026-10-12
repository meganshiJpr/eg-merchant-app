"use client";

import React, { useState, useRef } from "react";

export function UploadSignature({ onSignatureChange }) {
  const [previewUrl, setPreviewUrl] = useState(null);
  const [fileName, setFileName] = useState("");
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file.");
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Clear previous draw
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw image keeping containment aspect ratio
        const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
        const x = (canvas.width - img.width * scale) / 2;
        const y = (canvas.height - img.height * scale) / 2;

        ctx.drawImage(img, x, y, img.width * scale, img.height * scale);

        // Export normalized PNG Data URL
        const pngDataUrl = canvas.toDataURL("image/png");
        setPreviewUrl(pngDataUrl);
        onSignatureChange(pngDataUrl);
      };
      img.src = event.target?.result;
    };

    reader.readAsDataURL(file);
  };

  const handleClear = () => {
    setPreviewUrl(null);
    setFileName("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onSignatureChange(null);
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Hidden normalization canvas */}
      <canvas ref={canvasRef} width={400} height={160} className="hidden" />

      <label className="block text-[12.5px] font-bold text-slate-700">
        Upload Signature Image <span className="text-red-500">*</span>
      </label>

      {/* Upload Box */}
      <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-5 text-center">
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        {previewUrl ? (
          <div className="flex flex-col items-center gap-3 w-full">
            <div className="h-28 w-full flex items-center justify-center p-2 bg-white rounded-xl border border-slate-200">
              <img src={previewUrl} alt="Uploaded signature" className="max-h-full object-contain" />
            </div>
            <div className="flex items-center justify-between w-full text-xs px-1">
              <span className="font-semibold text-slate-700 truncate max-w-[200px]">{fileName}</span>
              <button
                type="button"
                onClick={handleClear}
                className="font-bold text-accent hover:underline cursor-pointer"
              >
                Remove File
              </button>
            </div>
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center cursor-pointer hover:opacity-80 transition"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-2">
              <svg viewBox="0 0 24 24" className="h-6 w-6 fill-none stroke-current" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
              </svg>
            </div>
            <span className="text-xs font-bold text-slate-800">
              Click to select signature image
            </span>
            <span className="text-[11px] text-slate-400 mt-0.5">
              Supports PNG, JPG, JPEG, WEBP
            </span>
          </div>
        )}
      </div>

      <p className="text-[11px] text-slate-500 italic">
        Note: Uploaded image will be automatically converted & normalized into a transparent PNG signature format.
      </p>
    </div>
  );
}

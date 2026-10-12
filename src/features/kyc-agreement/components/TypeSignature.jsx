"use client";

import React, { useEffect, useRef, useState } from "react";

// Single fixed font
const SIGNATURE_FONT =
  "'Brittany Signature', 'Brush Script MT', cursive, sans-serif";

export function TypeSignature({
  onSignatureChange,
  initialName = "",
}) {
  // User edit kar sakta hai
  const [typedName, setTypedName] = useState(initialName);

  const canvasRef = useRef(null);

  const renderTypedSignatureToPng = () => {
    const canvas = canvasRef.current;

    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    // Clear previous
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const value = typedName.trim();

    if (!value) {
      onSignatureChange(null);
      return;
    }

    const fontSize = 60;

    // Font
    ctx.font = `italic ${fontSize}px ${SIGNATURE_FONT}`;

    ctx.fillStyle = "#0f172a";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Draw text
    ctx.fillText(
      value,
      canvas.width / 2,
      canvas.height / 2
    );

    // PNG Export
    const pngDataUrl = canvas.toDataURL("image/png");

    onSignatureChange(pngDataUrl);
  };

  useEffect(() => {
    renderTypedSignatureToPng();
  }, [typedName]);

  return (
    <div className="flex flex-col gap-4">
      {/* Hidden canvas */}
      <canvas
        ref={canvasRef}
        width={500}
        height={150}
        className="hidden"
      />

      {/* Input */}
      <div>
        <label className="block text-[12px] font-bold text-slate-700 mb-1">
          Type Your Signature
          <span className="text-red-500"> *</span>
        </label>

        <input
          type="text"
          value={typedName}
          onChange={(e) => setTypedName(e.target.value)}
          placeholder="Type your full name"
          className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-[14px] font-medium text-slate-900 outline-none focus:border-primary focus:bg-white"
        />
      </div>

      {/* Preview */}
      <div>
        <label className="block text-[12px] font-bold text-slate-600 mb-2">
          Signature Preview
        </label>

        <div className="flex items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 h-32 overflow-hidden">
          {typedName.trim() ? (
            <span
              style={{
                fontFamily: SIGNATURE_FONT,
                fontSize: "42px",
                fontStyle: "italic",
                color: "#0f172a",
                whiteSpace: "nowrap",
              }}
              className="select-none"
            >
              {typedName}
            </span>
          ) : (
            <span className="text-sm text-slate-400 italic">
              Type your name above
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
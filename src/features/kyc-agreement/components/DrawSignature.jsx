"use client";

import React, { useRef, useState, useEffect } from "react";

export function DrawSignature({ onSignatureChange }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.lineWidth = 2.5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "#0f172a"; // Slate 900
    }
  }, []);

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    if (e.touches && e.touches[0]) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startDrawing = (e) => {
    e.preventDefault();
    const { x, y } = getCoordinates(e);
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();

    const { x, y } = getCoordinates(e);
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;

    ctx.lineTo(x, y);
    ctx.stroke();
    setHasDrawn(true);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    exportSignaturePng();
  };

  const exportSignaturePng = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (!hasDrawn) {
      onSignatureChange(null);
      return;
    }

    const pngDataUrl = canvas.toDataURL("image/png");
    onSignatureChange(pngDataUrl);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setHasDrawn(false);
    onSignatureChange(null);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <label className="text-[12.5px] font-bold text-slate-700">
          Draw Signature on Canvas <span className="text-red-500">*</span>
        </label>
        <button
          type="button"
          onClick={handleClear}
          className="text-[11.5px] font-semibold text-accent hover:underline cursor-pointer"
        >
          ✕ Clear Canvas
        </button>
      </div>

      {/* HTML5 Interactive Drawing Canvas */}
      <div className="relative rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 overflow-hidden">
        <canvas
          ref={canvasRef}
          width={440}
          height={160}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full h-40 cursor-crosshair touch-none bg-transparent"
        />

        {!hasDrawn && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-xs font-semibold text-slate-400">
            ✍️ Use mouse or touch to draw signature here
          </div>
        )}
      </div>

      <p className="text-[11px] text-slate-500 italic">
        Tip: Draw your signature cleanly within the box. It will automatically export as a transparent PNG.
      </p>
    </div>
  );
}

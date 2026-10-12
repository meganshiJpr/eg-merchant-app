"use client";

import React, { useState } from "react";
import { TypeSignature } from "./TypeSignature";
import { DrawSignature } from "./DrawSignature";
import { UploadSignature } from "./UploadSignature";

export function SignatureModal({ isOpen, onClose, onApply, initialName = "" }) {
  const [activeTab, setActiveTab] = useState("type"); // 'type' | 'draw' | 'upload'
  const [currentSignaturePng, setCurrentSignaturePng] = useState(null);

  if (!isOpen) return null;

  const handleTabSwitch = (tab) => {
    setActiveTab(tab);
    setCurrentSignaturePng(null);
    console.log(`[KYC] Signature type selected: ${tab}`);
  };

  const handleApply = () => {
    if (!currentSignaturePng) {
      alert("Please enter, draw, or upload a signature before applying.");
      return;
    }

    // console.log(`[KYC] Signature created`);
    // console.log(`[KYC] Signature converted to PNG`);
    // console.log(`[KYC] Signature applied:`, {
    //   type: activeTab,
    //   format: "image/png",
    //   dimensions: "180x70px (fixed containment)",
    //   position: "Page 2 / bottom signature section",
    // });

    onApply({
      dataUrl: currentSignaturePng,
      type: activeTab,
      format: "image/png",
      appliedAt: new Date().toISOString(),
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-lg text-slate-900">Add E-Signature</h3>
            <p className="text-xs font-medium text-slate-500">
              Choose your preferred signature creation method
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
          >
            ✕
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="mt-4 flex rounded-2xl bg-slate-100 p-1 text-xs font-bold">
          <button
            type="button"
            onClick={() => handleTabSwitch("type")}
            className={`flex-1 rounded-xl py-2.5 transition ${
              activeTab === "type"
                ? "bg-primary text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            ✍️ Type
          </button>
          <button
            type="button"
            onClick={() => handleTabSwitch("draw")}
            className={`flex-1 rounded-xl py-2.5 transition ${
              activeTab === "draw"
                ? "bg-primary text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            🎨 Draw
          </button>
          <button
            type="button"
            onClick={() => handleTabSwitch("upload")}
            className={`flex-1 rounded-xl py-2.5 transition ${
              activeTab === "upload"
                ? "bg-primary text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            📁 Upload
          </button>
        </div>

        {/* Tab Content Display */}
        <div className="mt-5">
          {activeTab === "type" && (
            <TypeSignature
              initialName={initialName}
              onSignatureChange={setCurrentSignaturePng}
            />
          )}

          {activeTab === "draw" && (
            <DrawSignature onSignatureChange={setCurrentSignaturePng} />
          )}

          {activeTab === "upload" && (
            <UploadSignature onSignatureChange={setCurrentSignaturePng} />
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="mt-6 flex gap-3 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-slate-300 bg-slate-50 py-3 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!currentSignaturePng}
            onClick={handleApply}
            className="flex-1 rounded-xl bg-primary py-3 text-xs font-bold text-white shadow-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            Apply Signature
          </button>
        </div>
      </div>
    </div>
  );
}

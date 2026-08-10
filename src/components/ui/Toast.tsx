"use client";

import { create } from "zustand";

type ToastState = {
  message: string | null;
  show: (message: string) => void;
};

let timer: ReturnType<typeof setTimeout> | undefined;

export const useToast = create<ToastState>((set) => ({
  message: null,
  show: (message) => {
    set({ message });
    clearTimeout(timer);
    timer = setTimeout(() => set({ message: null }), 2600);
  },
}));

export function ToastHost() {
  const message = useToast((s) => s.message);
  if (!message) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[60] flex justify-center px-6">
      <div className="max-w-app rounded-xl bg-text-1 px-4 py-2.5 text-[12.5px] font-medium text-surface shadow-lg">
        {message}
      </div>
    </div>
  );
}

"use client";

import React, { createContext, useContext, useEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";

const UIHistoryContext = createContext(null);

let layerCounter = 0;

export function UIHistoryProvider({ children }) {
  const stackRef = useRef([]);
  const isManualPopRef = useRef(false);
  const pathname = usePathname();

  // Clear stale UI stack layers when page route changes
  useEffect(() => {
    stackRef.current = [];
    isManualPopRef.current = false;
  }, [pathname]);

  // Global popstate event handler (handles Desktop & Android Back button)
  useEffect(() => {
    function handlePopState() {
      if (isManualPopRef.current) {
        isManualPopRef.current = false;
        return;
      }

      if (stackRef.current.length > 0) {
        const topLayer = stackRef.current.pop();
        if (topLayer) {
          try {
            sessionStorage.removeItem(`ui_layer_${pathname}_${topLayer.id}`);
          } catch {}
          if (typeof topLayer.onClose === "function") {
            topLayer.onClose();
          }
        }
      }
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [pathname]);

  const pushLayer = useCallback((layerObj) => {
    const { id, type = "modal", onClose } = layerObj;
    if (!id) return null;

    const existingIndex = stackRef.current.findIndex((item) => item.id === id);
    if (existingIndex !== -1) {
      stackRef.current[existingIndex].onClose = onClose;
      return id;
    }

    const stateToken = { _uiHistoryToken: id, type };
    if (typeof window !== "undefined" && window.history.state?._uiHistoryToken !== id) {
      window.history.pushState(stateToken, "", window.location.href);
    }

    if (typeof window !== "undefined") {
      try {
        sessionStorage.setItem(`ui_layer_${window.location.pathname}_${id}`, "true");
      } catch {}
    }

    stackRef.current.push({ id, type, onClose });
    return id;
  }, []);

  const closeLayer = useCallback((id) => {
    if (!id) return;
    const index = stackRef.current.findIndex((item) => item.id === id);

    if (typeof window !== "undefined") {
      try {
        sessionStorage.removeItem(`ui_layer_${window.location.pathname}_${id}`);
      } catch {}
    }

    if (index === -1) return;

    const targetLayer = stackRef.current[index];

    if (index === stackRef.current.length - 1) {
      stackRef.current.pop();
      isManualPopRef.current = true;
      if (targetLayer && typeof targetLayer.onClose === "function") {
        targetLayer.onClose();
      }
      if (typeof window !== "undefined") {
        window.history.back();
      }
    } else {
      stackRef.current.splice(index, 1);
      if (targetLayer && typeof targetLayer.onClose === "function") {
        targetLayer.onClose();
      }
    }
  }, []);

  const isLayerActiveOnRefresh = useCallback((id) => {
    if (typeof window === "undefined") return false;
    try {
      const isSaved = sessionStorage.getItem(`ui_layer_${window.location.pathname}_${id}`);
      const isHistState = window.history.state?._uiHistoryToken === id;
      return Boolean(isSaved || isHistState);
    } catch {
      return false;
    }
  }, []);

  const value = {
    pushLayer,
    closeLayer,
    isLayerActiveOnRefresh,
    stackRef,
  };

  return <UIHistoryContext.Provider value={value}>{children}</UIHistoryContext.Provider>;
}

export function useUIHistory() {
  const context = useContext(UIHistoryContext);
  if (!context) {
    return {
      pushLayer: () => {},
      closeLayer: () => {},
      isLayerActiveOnRefresh: () => false,
    };
  }
  return context;
}

export function useUIHistoryLayer({ id, type = "sheet", open, onClose }) {
  const { pushLayer, closeLayer, isLayerActiveOnRefresh } = useUIHistory();
  const autoIdRef = useRef(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  if (!autoIdRef.current) {
    layerCounter += 1;
    autoIdRef.current = id || `ui-layer-${type}-${layerCounter}`;
  }

  const layerId = id || autoIdRef.current;

  useEffect(() => {
    if (open) {
      pushLayer({
        id: layerId,
        type,
        onClose: () => {
          if (onCloseRef.current) onCloseRef.current();
        },
      });
    } else {
      closeLayer(layerId);
    }

    return () => {
      if (open) {
        closeLayer(layerId);
      }
    };
  }, [open, layerId, type, pushLayer, closeLayer]);

  return {
    layerId,
    close: () => closeLayer(layerId),
    isRestored: isLayerActiveOnRefresh(layerId),
  };
}

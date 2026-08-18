"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { apish } from "@/lib/net/apish";

const COOKIE_KEY = "banner_impressions";
const SESSION_SHOWN_KEY = "banner_shown_in_session";
const SESSION_BANNER_API_KEY = "dashboard_banner_session";

function getStoredImpressions() {
  try {
    const raw = Cookies.get(COOKIE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function incrementBannerImpression(bannerId) {
  if (!bannerId) return;
  try {
    const impressions = getStoredImpressions();
    const currentCount = Number(impressions[bannerId] || 0);
    impressions[bannerId] = currentCount + 1;
    // Store in 1-day expiring cookie (resets daily)
    Cookies.set(COOKIE_KEY, JSON.stringify(impressions), { expires: 1 });
    // console.log(` Banner [${bannerId}] 1-day cookie visit count updated to: ${currentCount + 1}`);
  } catch (err) {
    console.error("Error saving banner cookie impression:", err);
  }
}

export function BottomBannerSheet() {
  const router = useRouter();
  const [activeBanner, setActiveBanner] = useState(null);
  const [dismissed, setDismissed] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const hasFetchedRef = useRef(false);

  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    // Check same-session refresh guard: if already shown in this tab session, do not display again on F5 refresh
    if (typeof window !== "undefined" && sessionStorage.getItem(SESSION_SHOWN_KEY) === "true") {
      console.log(" Banner already displayed in this tab session (refresh guard active)");
      return;
    }

    async function loadBanner() {
      try {
        let raw = null;

        // Check sessionStorage cache first for dashboardBanner API payload
        if (typeof window !== "undefined") {
          const cachedApi = sessionStorage.getItem(SESSION_BANNER_API_KEY);
          if (cachedApi) {
            try {
              raw = JSON.parse(cachedApi);
              console.log("⚡ Loaded dashboardBanner from sessionStorage cache:", raw);
            } catch {}
          }
        }

        // Fetch from network if not cached in session
        if (!raw) {
          raw = await apish("dashboardBanner");
          console.log("dashboardBanner raw response:", raw);

          if (typeof window !== "undefined" && raw) {
            try {
              sessionStorage.setItem(SESSION_BANNER_API_KEY, JSON.stringify(raw));
            } catch {}
          }
        }

        let list = raw;

        // Step 1: If stringified JSON, parse it
        if (typeof list === "string") {
          try {
            list = JSON.parse(list);
          } catch (e) {
            console.warn("Could not JSON parse raw response string:", e);
          }
        }

        // Step 2: Extract array from nested properties (.dashboard_banner, .data, or .banners)
        if (list && typeof list === "object") {
          if (list.dashboard_banner !== undefined) {
            list = list.dashboard_banner;
          } else if (list.data !== undefined) {
            list = list.data;
          } else if (list.banners !== undefined) {
            list = list.banners;
          }

          if (typeof list === "string") {
            try {
              list = JSON.parse(list);
            } catch (e) {
              console.warn("Could not JSON parse nested list string:", e);
            }
          }
        }

        if (!Array.isArray(list) || list.length === 0) {
          console.log("No banner array found in response");
          return;
        }

        // Step 3: Find first eligible banner where userVisits < show count (via 1-day cookie)
        const storedImpressions = getStoredImpressions();

        const eligible = list.find((item) => {
          if (!item || !item.id || item.show === undefined) return false;
          const maxShow = Number(item.show);
          const userVisits = Number(storedImpressions[item.id] || 0);
          // console.log(`Checking Banner [${item.id}]: Visits=${userVisits}, Limit=${maxShow}`);
          return userVisits < maxShow;
        });

        if (eligible) {
          console.log(" Selected Eligible Banner:", eligible);
          setActiveBanner(eligible);

          // Mark session display flag so F5 refresh in same tab won't show it again
          if (typeof window !== "undefined") {
            sessionStorage.setItem(SESSION_SHOWN_KEY, "true");
          }

          // Increment daily visit count in 1-day cookie
          incrementBannerImpression(eligible.id);
        } else {
          console.log("All banners reached their max visit limit (show limit)");
        }
      } catch (err) {
        console.error("fetchDashboardBanner failed:", err);
      }
    }
    loadBanner();
  }, []);

  if (dismissed || !activeBanner || !activeBanner.image) {
    return null;
  }

  const handleBannerClick = () => {
    const targetUrl = activeBanner?.web_url || activeBanner?.redirect;
    const isInApp = Number(activeBanner?.in_app) === 1;

    if (!targetUrl || typeof window !== "undefined") {
      setIsClosing(true);
      setTimeout(() => {
        if (isInApp) {
          // console.log(" Opening in-app URL:", targetUrl);
          router.push(targetUrl);
        } else {
          console.log(" Opening external URL in new tab:", targetUrl);
          window.open(targetUrl, "_blank");
        }
        setDismissed(true);
      }, 300);
    }
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setDismissed(true);
    }, 300);
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-end bg-black/60 backdrop-blur-xs transition-all duration-300 ${
        isClosing ? "opacity-0" : "opacity-100"
      }`}
      onClick={handleClose}
    >
      <div className="bottom-2 top-2 z-10 my-3 flex justify-center">
        <button
          onClick={handleClose}
          aria-label="Close banner"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white shadow-md transition hover:bg-black/80"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4 fill-white">
            <path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12Z" />
          </svg>
        </button>
      </div>

      <div
        className={`relative flex max-h-[70vh] w-full max-w-app flex-col overflow-hidden rounded-t-3xl bg-surface shadow-2xl transition-all duration-300 ${
          isClosing ? "translate-y-96" : "translate-y-0"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          onClick={handleBannerClick}
          className="group relative flex w-full cursor-pointer flex-col overflow-hidden"
        >
          <div className="relative w-full overflow-hidden bg-page">
            <img
              src={activeBanner.image}
              alt="Dashboard Banner"
              className="h-full w-full object-cover object-top transition-transform duration-300"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

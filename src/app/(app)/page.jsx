"use client";

import { useState, useEffect } from "react";
import { ServiceGrid } from "@/features/home/ServiceGrid";
import { useDashboard } from "@/features/dashboard/hooks/useDashboard";
import { BottomBannerSheet } from "@/features/home/components/BottomBannerSheet";

export default function HomePage() {
  const { data: dashboardData, isLoading } = useDashboard();
  const [slides, setSlides] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (dashboardData?.slides && Array.isArray(dashboardData.slides)) {
      setSlides(dashboardData.slides);
    }
  }, [dashboardData]);  


  const handleSlideClick = (slide) => {
    if (slide.web_url) {
      if (slide.in_app === "1" || slide.in_app === true) {
        // Internal link
        window.location.href = slide.web_url;
      } else {
        // External link
        window.open(slide.web_url, "_blank");
      }
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Banner Slider from API */}
      {isLoading ? (
        <div className="flex h-[140px] items-center justify-center rounded-2xl bg-border">
          <span className="text-sm text-text-2">Loading banners...</span>
        </div>
      ) : slides.length > 0 ? (
        <div className="relative overflow-hidden rounded-2xl">
          <div
            className="cursor-pointer"
            onClick={() => handleSlideClick(slides[currentSlide])}
          >
            <img
              src={`${dashboardData.slide_path}/${slides[currentSlide].slide}`}
              alt="Banner"
              className="h-[140px] w-full object-cover"
              onError={(e) => {
                e.target.src =
                  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 140'%3E%3Crect fill='%23f0f0f0' width='400' height='140'/%3E%3C/svg%3E";
              }}
            />
          </div>

          {slides.length > 1 && (
            <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  className={`h-2 w-2 rounded-full transition ${
                    idx === currentSlide ? "bg-white" : "bg-white/50"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      ) : null}

      {/* KYC banner */}
     

      <ServiceGrid />
      <BottomBannerSheet/>
    </div>
  );
}

"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { SubHeader } from "@/components/ui/SubHeader";
import { generateProfileOtp, submitMerchantOnboard, getCityDropdownByStateId } from "@/features/auth/api";
import { useAuthStore } from "@/lib/auth/store";

export function ProfileDetails({ onSave }) {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const fileInputRef = useRef(null);
  
  const [step, setStep] = useState(1);
  const [tempToken, setTempToken] = useState("");
  const [merchantData, setMerchantData] = useState(null);

  // Form State
  const [profileImage, setProfileImage] = useState(null);
  const [fullName, setFullName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [stateName, setStateName] = useState("");
  const [selectedStateId, setSelectedStateId] = useState("");
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");

  // Dynamic Dropdown Lists State
  const [statesList, setStatesList] = useState([]);
  const [citiesList, setCitiesList] = useState([]);
  const [loadingCities, setLoadingCities] = useState(false);

  // OTP State
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [otpToken, setOtpToken] = useState("");
  const [timer, setTimer] = useState(30);
  const [isResendActive, setIsResendActive] = useState(false);
  const [loadingOtp, setLoadingOtp] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [otpError, setOtpError] = useState("");
  
  const otpInputRefs = useRef([]);

  // Fetch Cities dynamically for a given state ID
  const fetchCitiesForState = async (stateId, defaultCity = "") => {
    if (!stateId) {
      setCitiesList([]);
      setCity("");
      return;
    }

    setLoadingCities(true);
    try {
      const res = await getCityDropdownByStateId({ state_id: stateId,tempToken });
      console.log("getCityDropdownByStateId response:", res);

      const rawCities =
        res?.data?.data ||
        res?.data ||
        res?.cities ||
        res?.city_dropdown_data ||
        res ||
        [];
      const citiesArray = Array.isArray(rawCities) ? rawCities : [];
      setCitiesList(citiesArray);

      if (citiesArray.length > 0) {
        let matchedCity = "";
        if (defaultCity && defaultCity !== "null" && defaultCity !== "undefined") {
          const found = citiesArray.find(
            (c) =>
              String(c.id || c.city_id || "") === String(defaultCity) ||
              String(c.name || c.city_name || c).toLowerCase() === String(defaultCity).toLowerCase()
          );
          if (found) {
            matchedCity = found.name || found.city_name || String(found);
          }
        }

        if (!matchedCity) {
          const first = citiesArray[0];
          matchedCity = first.name || first.city_name || String(first);
        }

        setCity(matchedCity);
      } else {
        setCity("");
      }
    } catch (err) {
      console.error("Failed to fetch cities for stateId:", stateId, err);
      setCitiesList([]);
      setCity("");
    } finally {
      setLoadingCities(false);
    }
  };

  // Read initial pending profile update data from session storage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("pending_profile_update");
      if (stored) {
        try {
          let parsed = JSON.parse(stored);
          if (typeof parsed === "string") {
            try {
              parsed = JSON.parse(parsed);
            } catch (e) {}
          }
          console.log("Loaded pending_profile_update data in ProfileDetails:", parsed);

          // Handle token keys
          const tokenVal =
            parsed.tempToken ||
            parsed.logintoken ||
            parsed.token ||
            parsed.rawResponse?.logintoken ||
            parsed.data?.logintoken ||
            "";
          if (tokenVal) {
            setTempToken(tokenVal);
          }

          // Handle merchant data
          const merchantObj =
            parsed.merchant ||
            parsed.user_details ||
            parsed.userDetails ||
            parsed.rawResponse?.user_details ||
            null;
          if (merchantObj) {
            setMerchantData(merchantObj);
          }

          // Extract state_dropdown_data list
          const rawStates =
            parsed.state_dropdown_data ||
            parsed.rawResponse?.state_dropdown_data ||
            parsed.states ||
            parsed.data?.state_dropdown_data ||
            [];
          const normalizedStates = Array.isArray(rawStates) ? rawStates : [];
          setStatesList(normalizedStates);

          // Extract user details object (supports user_details and userDetails)
          const details =
            parsed.user_details ||
            parsed.userDetails ||
            parsed.rawResponse?.user_details ||
            parsed.data?.user_details;

          if (details) {
            if (details.name) setFullName(String(details.name).replace(/\n/g, " "));
            if (details.mobile || parsed.device || parsed.rawResponse?.device) {
              setMobile(String(details.mobile || parsed.device || parsed.rawResponse?.device));
            }
            if (details.email) setEmail(String(details.email));
            if (details.pincode) setPincode(String(details.pincode));
            if (details.address && details.address !== "null") setAddress(String(details.address));

            // State pre-filled setup logic
            const rawStateVal = details.state || details.state_id || "";
            const isNullState = !rawStateVal || rawStateVal === "null" || rawStateVal === "undefined";

            let matchedState = null;
            if (!isNullState) {
              matchedState = normalizedStates.find(
                (s) =>
                  String(s.id || s.state_id || "") === String(rawStateVal) ||
                  String(s.name || s.state_name || "").toLowerCase() === String(rawStateVal).toLowerCase()
              );
            }

            if (matchedState) {
              // Pre-select user's existing state
              const stId = String(matchedState.id || matchedState.state_id || "");
              const stName = matchedState.name || matchedState.state_name || "";
              setSelectedStateId(stId);
              setStateName(stName);
              fetchCitiesForState(stId, details.city || details.city_id || "");
            } else {
              // State is null -> Dropdown displays "Select State" placeholder so user selects state
              setSelectedStateId("");
              setStateName("");
              setCity("");
              setCitiesList([]);
            }
          }
        } catch (err) {
          console.error("Failed to parse pending_profile_update:", err);
        }
      }
    }
  }, []);

  // Countdown timer for OTP screen
  useEffect(() => {
    let interval = null;
    if (step === 2 && timer > 0) {
      setIsResendActive(false);
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (step === 2 && timer === 0) {
      setIsResendActive(true);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [step, timer]);

  // Handler for state selection change
  const handleStateChange = (newStateId) => {
    setSelectedStateId(newStateId);

    const selectedObj = statesList.find(
      (s) => String(s.id || s.state_id || "") === String(newStateId)
    );
    const newStName = selectedObj ? (selectedObj.name || selectedObj.state_name || "") : "";
    setStateName(newStName);

    setCity("");
    fetchCitiesForState(newStateId, "");
  };

 



  // Step 1 Submission: Call Generate OTP API & Go to OTP Screen
  const handleProceedToOtp = async (e) => {
    e.preventDefault();
    setLoadingOtp(true);
    console.log("temptoken", tempToken);

    try {
      console.log("Generating OTP with tempToken via generateProfileOtp:", tempToken);
      if (tempToken) {
        const otpRes = await generateProfileOtp({ tempToken });
        console.log("generateProfileOtp full response:", otpRes);
        const extractedToken =
          otpRes?.data?.data?.otp_token ||
          otpRes?.data?.otp_token ||
          otpRes?.otp_token ||
          "";
        if (extractedToken) {
          console.log("Extracted otp_token:", extractedToken);
          setOtpToken(extractedToken);
        }
      }
    } catch (err) {
      console.warn("generateProfileOtp API call notice:", err);
    } finally {
      setLoadingOtp(false);
      // Reset OTP digits & timer when entering Step 2
      setOtpDigits(["", "", "", "", "", ""]);
      setOtpError("");
      setTimer(30);
      setIsResendActive(false);
      setStep(2);
    }
  };

  // OTP Input Handlers
  const handleOtpDigitChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newDigits = [...otpDigits];
    newDigits[index] = value.slice(-1);
    setOtpDigits(newDigits);
    setOtpError("");

    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pastedData) {
      const newDigits = [...otpDigits];
      for (let i = 0; i < 6; i++) {
        newDigits[i] = pastedData[i] || "";
      }
      setOtpDigits(newDigits);
      const focusIndex = Math.min(pastedData.length, 5);
      otpInputRefs.current[focusIndex]?.focus();
    }
  };

  const handleResendOtp = async () => {
    if (!isResendActive) return;
    try {
      console.log("Resending OTP for tempToken:", tempToken);
      if (tempToken) {
        const otpRes = await generateProfileOtp({ tempToken });
        const extractedToken =
          otpRes?.data?.data?.otp_token ||
          otpRes?.data?.otp_token ||
          otpRes?.otp_token ||
          "";
        if (extractedToken) {
          setOtpToken(extractedToken);
        }
      }
    } catch (err) {
      console.warn("Resend OTP notice:", err);
    } finally {
      setOtpDigits(["", "", "", "", "", ""]);
      setOtpError("");
      setTimer(30);
      setIsResendActive(false);
    }
  };

  // Step 2 Submission: Verify OTP & Final Submit
  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    const fullOtp = otpDigits.join("");
    
    if (fullOtp.length < 6) {
      setOtpError("Please enter complete 6-digit OTP");
      return;
    }

    setSubmitting(true);
    const onboardPayload = {
      name: fullName,
      email,
      mobile,
      address,
      city,
      state: stateName,
      state_id: selectedStateId,
      pincode,
      otp_token: otpToken,
      otp: fullOtp,
      token: tempToken,
    };

    console.log("Submitting final merchant_onboard payload:", onboardPayload);

    try {
      const res = await submitMerchantOnboard(onboardPayload);
      console.log("merchant_onboard API Response:", res);

      const permanentToken =
        res?.logintoken || res?.token || res?.data?.logintoken || res?.data?.token || tempToken;
      const deviceMobile = res?.device || res?.data?.device || mobile;

      if (typeof window !== "undefined") {
        Cookies.set("authToken", permanentToken, { expires: 1 });
        Cookies.set("authMobile", deviceMobile, { expires: 1 });
        sessionStorage.removeItem("pending_profile_update");
      }

      setSession(
        permanentToken,
        merchantData || { id: "merchant_id", name: fullName, mobile: deviceMobile },
        deviceMobile
      );

      if (onSave) {
        onSave(res);
      }

      router.replace("/");
    } catch (err) {
      console.error("submitMerchantOnboard submit error:", err);
      setOtpError(err?.message || "Merchant onboard failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface pb-4">
      {/* Header */}
      <SubHeader 
        title={step === 1 ? "Profile Details" : "Verify Mobile OTP"} 
        backHref={step === 1 ? "/profile" : undefined}
        showImg={false}
      />

      {/* Main Container */}
      <div className="mx-auto max-w-app px-3">
        {step === 1 ? (
     
          <div className="rounded-3xl bg-surface p-5 mt-4 shadow-xl border border-border/60">
            <form onSubmit={handleProceedToOtp}>
              {/* Profile Avatar Upload Section */}
              <div className="flex flex-col items-center justify-center pt-2 pb-4">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  className="hidden"
                />
                <div 
                  className="relative flex h-24 w-24 cursor-pointer items-center justify-center rounded-full border-[2.5px] border-[#0112fe] bg-primary-soft/40 p-1 "
                >
                  <div className="flex h-full w-full items-center justify-center rounded-full bg-slate-100 text-slate-400">
                    <svg viewBox="0 0 24 24" className="h-12 w-12 fill-current">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                {/* Full Name */}
                <div>
                  <label className="block text-[12.5px] font-bold text-text-1 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your name"
                    required
                    className="w-full rounded-xl border border-border bg-[#f8f9fe] px-3.5 py-3 text-[13px] font-medium text-text-1 outline-none focus:border-primary focus:bg-white transition-all placeholder:text-text-3"
                  />
                </div>

                {/* Mobile & Email Row */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[12.5px] font-bold text-text-1 mb-1">
                      Mobile <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      placeholder="Enter Number"
                      required
                      className="w-full rounded-xl border border-border bg-[#f8f9fe] px-3 py-3 text-[13px] font-medium text-text-1 outline-none focus:border-primary focus:bg-white transition-all placeholder:text-text-3"
                    />
                  </div>
                  <div>
                    <label className="block text-[12.5px] font-bold text-text-1 mb-1">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="email@gmail.com"
                      required
                      className="w-full rounded-xl border border-border bg-[#f8f9fe] px-3 py-3 text-[13px] font-medium text-text-1 outline-none focus:border-primary focus:bg-white transition-all placeholder:text-text-3"
                    />
                  </div>
                </div>

                {/* Address */}
                <div>
                  <label className="block text-[12.5px] font-bold text-text-1 mb-1">
                    Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="House No, Street, Area"
                    required
                    className="w-full rounded-xl border border-border bg-[#f8f9fe] px-3.5 py-3 text-[13px] font-medium text-text-1 outline-none focus:border-primary focus:bg-white transition-all placeholder:text-text-3"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[12.5px] font-bold text-text-1 mb-1">
                      State <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={selectedStateId}
                        onChange={(e) => handleStateChange(e.target.value)}
                        required
                        className="w-full appearance-none rounded-xl border border-border bg-[#f8f9fe] px-3 py-3 text-[13px] font-medium text-text-1 outline-none focus:border-primary focus:bg-white transition-all cursor-pointer"
                      >
                        <option value="">Select State</option>
                        {statesList.map((s, idx) => {
                          const sId = String(s.id || s.state_id || idx);
                          const sName = s.name || s.state_name || String(s);
                          return (
                            <option key={sId} value={sId}>
                              {sName}
                            </option>
                          );
                        })}
                      </select>
                      <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-3">
                        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M6 9l6 6 6-6" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[12.5px] font-bold text-text-1 mb-1">
                      City <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        required
                        disabled={loadingCities || !selectedStateId}
                        className="w-full appearance-none rounded-xl border border-border bg-[#f8f9fe] px-3 py-3 text-[13px] font-medium text-text-1 outline-none focus:border-primary focus:bg-white transition-all cursor-pointer disabled:opacity-60"
                      >
                        {loadingCities ? (
                          <option value="">Loading cities...</option>
                        ) : citiesList.length === 0 ? (
                          <option value="">Select State First</option>
                        ) : (
                          citiesList.map((c, idx) => {
                            const cName = typeof c === "string" ? c : c.name || c.city_name || String(c);
                            const cVal = cName;
                            return (
                              <option key={c.id || c.city_id || idx} value={cVal}>
                                {cName}
                              </option>
                            );
                          })
                        )}
                      </select>
                      <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-3">
                        {loadingCities ? (
                          <span className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        ) : (
                          <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M6 9l6 6 6-6" />
                          </svg>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pincode */}
                <div>
                  <label className="block text-[12.5px] font-bold text-text-1 mb-1">
                    Pincode <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value)}
                      placeholder="302001"
                      maxLength={6}
                      required
                      className="w-full rounded-xl border-2 border-[#0112fe] bg-[#f8f9fe] px-3.5 py-3 text-[13px] font-medium text-text-1 outline-none shadow-2xs transition-all placeholder:text-text-3"
                    />
                    <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-3">
                      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M7 15l5 5 5-5M7 9l5-5 5 5" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 1 Action Button */}
              <div className="mt-6 pt-2">
                <button
                  type="submit"
                  disabled={loadingOtp}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0112fe] py-3.5 font-display text-[14px] font-bold text-white shadow-md active:scale-[0.985] hover:bg-blue-700 disabled:opacity-50 transition-all"
                >
                  {loadingOtp ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>Requesting OTP...</span>
                    </span>
                  ) : (
                    <>
                      <span>Save & Continue</span>
                      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="rounded-3xl bg-surface p-5 shadow-xl border border-border/60">
            
            <div className="mb-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex items-center gap-1.5 text-[12.5px] font-bold text-primary hover:underline cursor-pointer"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
                <span>Edit Profile Details</span>
              </button>
            </div>

            
            <div className="flex flex-col items-center justify-center py-3">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-soft text-[#0112fe] shadow-xs">
                <svg viewBox="0 0 24 24" className="h-8 w-8 fill-none stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>

              <h2 className="mt-3 text-[17px] font-bold text-text-1">
                Verify Mobile OTP
              </h2>

              <p className="mt-1 text-center text-[12.5px] font-medium text-text-2">
                Enter the 6-digit verification code sent to{" "}
                <span className="font-bold text-text-1">
                  {mobile || "+91 XXXXX XXXXX"}
                </span>
              </p>
            </div>

            <form onSubmit={handleFinalSubmit} className="mt-4">
            
              <div className="flex items-center justify-center gap-2 my-4">
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (otpInputRefs.current[idx] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    onPaste={handleOtpPaste}
                    className="h-12 w-11 text-center rounded-xl border-2 border-border bg-[#f8f9fe] text-[18px] font-bold text-text-1 outline-none focus:border-[#0112fe] focus:bg-white shadow-2xs transition-all"
                  />
                ))}
              </div>

              {/* Error Message */}
              {otpError && (
                <p className="text-center text-[12px] font-semibold text-red-500 mb-2">
                  {otpError}
                </p>
              )}

              <div className="flex items-center justify-between px-1 my-3 text-[12.5px]">
                <span className="text-text-3 font-medium">
                  Didn't receive code?
                </span>
                {isResendActive ? (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    className="font-bold text-[#0112fe] hover:underline cursor-pointer"
                  >
                    Resend OTP
                  </button>
                ) : (
                  <span className="font-semibold text-text-2">
                    Resend OTP in <span className="mono text-[#0112fe]">0:{timer.toString().padStart(2, "0")}s</span>
                  </span>
                )}
              </div>

              <div className="mt-6">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0112fe] py-3.5 font-display text-[14px] font-bold text-white shadow-md active:scale-[0.985] hover:bg-blue-700 disabled:opacity-50 transition-all"
                >
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>Verifying...</span>
                    </span>
                  ) : (
                    <>
                      <span>Verify & Complete Profile</span>
                      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

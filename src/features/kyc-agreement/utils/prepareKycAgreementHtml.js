"use client";

/**
 * Safely escapes HTML special characters to prevent XSS injection.
 */
function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function prepareKycAgreementHtml({
  html,
  userData = {},
  signature = null,
  signedAt = "",
  latitude = null,
  longitude = null,
  signatureId = "signature-placeholder",
  dateId = "kyc-date",
  locationId = "kyc-location",
}) {
  if (!html || typeof window === "undefined") {
    return html || "";
  }

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    // Helper to safely set text content across all matching elements by data-field
    const setFieldText = (fieldName, value) => {
      const elements = doc.querySelectorAll(`[data-field="${fieldName}"]`);
      elements.forEach((el) => {
        el.textContent = value !== undefined && value !== null ? String(value) : "";
      });
    };

    // 1. Always inject persistent user details into data-field selectors
    if (userData.document_id || userData.documentId) {
      setFieldText("document_id", userData.document_id || userData.documentId);
    }
    if (userData.name) setFieldText("name", userData.name);
    if (userData.mobile) setFieldText("mobile", userData.mobile);
    if (userData.pan) setFieldText("pan", userData.pan);
    if (userData.aadhaar_last4 || userData.aadhaarLast4) {
      setFieldText("aadhaar_last4", userData.aadhaar_last4 || userData.aadhaarLast4);
    }
    if (userData.address) setFieldText("address", userData.address);

    // 2. Applicant Photo injection (if photo passed in userData or existing placeholder)
    const photoUrl =
      userData.photo ||
      userData.selfie ||
      userData.profile_photo ||
      userData.applicant_photo ||
      null;

    if (photoUrl) {
      const photoPlaceholders = doc.querySelectorAll(
        `[data-field="photo"], [data-field="selfie"], [data-field="applicant_photo"], #photo-placeholder, .photo-placeholder, .passport-photo, [data-photo-placeholder]`
      );
      photoPlaceholders.forEach((el) => {
        const existingImg = el.querySelector("img");
        if (existingImg) {
          if (!existingImg.src || existingImg.src === "" || existingImg.src.includes("placeholder")) {
            existingImg.src = photoUrl;
            existingImg.setAttribute("crossorigin", "anonymous");
          }
        } else {
          el.innerHTML = `<img src="${photoUrl}" alt="Applicant Photo" style="width: 100%; height: 100%; object-fit: cover; display: block;" crossorigin="anonymous" />`;
        }
      });
    }

    // Ensure all existing img tags have crossorigin="anonymous" for CORS compatibility
    doc.querySelectorAll("img").forEach((img) => {
      if (!img.hasAttribute("crossorigin")) {
        img.setAttribute("crossorigin", "anonymous");
      }
    });

    // 3. Check if user signature is present
    const signatureImage =
      typeof signature === "string"
        ? signature
        : typeof signature?.dataUrl === "string"
        ? signature.dataUrl
        : typeof signature?.dataUrl?.dataUrl === "string"
        ? signature.dataUrl.dataUrl
        : null;

    const isSigned = Boolean(signatureImage);

    const targetSigId = signatureId || "signature-placeholder";
    const sigElements = doc.querySelectorAll(
      `#${targetSigId}, [data-signature-placeholder="applicant_signature"], [data-signature-placeholder], .signature-placeholder`
    );
    const targetDateId = dateId || "kyc-date";
    const dateElements = doc.querySelectorAll(`#${targetDateId}`);
    const targetLocId = locationId || "kyc-location";
    const locElements = doc.querySelectorAll(`#${targetLocId}`);
    const statusElements = doc.querySelectorAll(
      `[data-signature-status], .signature-status`
    );

    // Extract original template IP before clearing/modifying
    const originalIpEl = doc.querySelector('[data-field="ip"], #kyc-ip, .kyc-ip');
    const templateIp = originalIpEl?.textContent?.trim() || "";
    const resolvedIp = userData.ip || userData.ipAddress || templateIp;

    if (isSigned) {

      //Signature Image
      sigElements.forEach((sigElement) => {
        sigElement.innerHTML = `<img src="${signatureImage}" alt="Applicant Signature" style="max-height: 100%; max-width: 100%; object-fit: contain; display: block; margin: 0 auto;" />`;
      });

      //Signature Status
      statusElements.forEach((statusElement) => {
        statusElement.textContent = `✓ Digitally Signed ${signedAt ? `at ${signedAt}` : ""}`;
        statusElement.style.color = "#059669";
        statusElement.style.fontWeight = "bold";
      });

      //Date (Exact signing timestamp or fallback)
      const displayDate = signedAt || userData.date || "";
      setFieldText("date", displayDate);
      dateElements.forEach((el) => {
        el.textContent = displayDate;
      });

      //IP Address (Resolved from userData or template)
      if (resolvedIp) {
        setFieldText("ip", resolvedIp);
        const ipElements = doc.querySelectorAll('#kyc-ip, .kyc-ip');
        ipElements.forEach((el) => {
          el.textContent = resolvedIp;
        });
      }

      //GPS Location (Latitude, Longitude)
      if (latitude && longitude) {
        const locationStr = `${latitude}°, ${longitude}°`;
        setFieldText("location", locationStr);
        locElements.forEach((el) => {
          el.textContent = locationStr;
        });
      }
    } else {
     
      //Status Pending
      statusElements.forEach((statusElement) => {
        statusElement.textContent = "Signature Pending";
        statusElement.style.color = "#94a3b8";
        statusElement.style.fontWeight = "normal";
      });

      // B. Hide Date value (labels remain intact)
      setFieldText("date", "");
      dateElements.forEach((el) => {
        el.textContent = "";
      });

      // C. Hide IP value (labels remain intact)
      setFieldText("ip", "");
      const ipElements = doc.querySelectorAll('#kyc-ip, .kyc-ip');
      ipElements.forEach((el) => {
        el.textContent = "";
      });

      // D. Hide Location value (labels remain intact)
      setFieldText("location", "");
      locElements.forEach((el) => {
        el.textContent = "";
      });
    }

    return "<!DOCTYPE html>\n" + doc.documentElement.outerHTML;
  } catch (err) {
    console.error("[KYC Helper] prepareKycAgreementHtml error:", err);
    return html;
  }
}

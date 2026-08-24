import { inr } from "@/utils/format";
import Cookies from "js-cookie";

export { inr };

export const OPERATORS = [
  { id: "jio", name: "Jio", abbr: "Jio", color: "#0A2885", walletAllowed: true },
  { id: "airtel", name: "Airtel", abbr: "Ai", color: "#E40000", walletAllowed: true },
  { id: "vi", name: "Vi", abbr: "Vi", color: "#EE2E7B", walletAllowed: true },
  { id: "bsnl", name: "BSNL", abbr: "BS", color: "#008540", walletAllowed: false },
];

export const CIRCLES = ["Rajasthan", "Delhi NCR", "UP West", "Mumbai", "Gujarat", "Punjab"];

export const STATIC_CONTACTS = [
  { name: "+919826585274", num: "9826585274", tag: "contact", color: "#F07800" },
  { name: "ARV", num: "9257475779", tag: "contact", color: "#00A389" },
  { name: "Aanand Colony", num: "6263471067", tag: "contact", color: "#E40000" },
  { name: "Aanand Yadav", num: "9981223344", tag: "contact", color: "#008540" },
];

export const SUGGESTS = [
  { name: "My Number", num: "9926452120", tag: "self", color: "var(--primary)" },
  ...STATIC_CONTACTS,
];

const CINE = { n: "CinePlay Mobile", ic: "C", c: "#D81F26", d: "Mobile-only subscription, plan validity" };
const TUNE = { n: "TuneBox Music", ic: "T", c: "#7B2FBE", d: "Ad-free music streaming" };

export const PLANS = [
  { amt: 199, val: "23 days", calls: "Unlimited", sms: "100/day", data: "1.5GB/day", cat: "Popular", desc: "Best seller for light users.", full: "Unlimited voice to all networks. 100 SMS per day. 1.5GB high-speed data daily, unlimited at 64kbps after limit.", ott: [] },
  { amt: 239, val: "28 days", calls: "Unlimited", sms: "100/day", data: "1.5GB/day", cat: "Popular", desc: "Full month value plan.", full: "Unlimited voice calls. 100 SMS/day. 1.5GB/day high-speed data with speed reduced after quota.", ott: [TUNE] },
  { amt: 299, val: "28 days", calls: "Unlimited", sms: "100/day", data: "2GB/day", cat: "Popular", desc: "Most recharged plan this month.", full: "Unlimited voice to any network. 100 SMS per day. 2GB daily high-speed data. Post-quota speed 64kbps.", ott: [CINE, TUNE] },
  { amt: 349, val: "28 days", calls: "Unlimited", sms: "100/day", data: "2.5GB/day", cat: "Data", desc: "Extra data for heavy users.", full: "Unlimited calls, 100 SMS/day and 2.5GB/day. Unused daily data does not carry forward.", ott: [CINE] },
  { amt: 19, val: "1 day", calls: "-", sms: "-", data: "1GB", cat: "Data", desc: "Emergency data top-up.", full: "1GB data valid 1 day, works with any active base plan. No voice or SMS benefit.", ott: [] },
  { amt: 61, val: "Existing", calls: "-", sms: "-", data: "6GB", cat: "Data", desc: "Data add-on, keeps base validity.", full: "6GB add-on data with validity same as your existing base plan. Can be stacked multiple times.", ott: [] },
  { amt: 479, val: "56 days", calls: "Unlimited", sms: "100/day", data: "1.5GB/day", cat: "Unlimited", desc: "Two months, one recharge.", full: "56-day validity with unlimited voice, 100 SMS/day and 1.5GB daily data. Best per-day price for regular users.", ott: [{ ...TUNE, d: "Ad-free music for 56 days" }] },
  { amt: 3199, val: "365 days", calls: "Unlimited", sms: "100/day", data: "2.5GB/day", cat: "Unlimited", desc: "Full year, no monthly hassle.", full: "Annual plan: unlimited voice, 100 SMS/day, 2.5GB/day high-speed data for 365 days.", ott: [{ n: "CinePlay Premium", ic: "C", c: "#D81F26", d: "Full HD, all devices, 365 days" }, { ...TUNE, d: "Ad-free music, 365 days" }, { n: "SportsMax Live", ic: "S", c: "#0A7A3D", d: "Live sports streaming included" }] },
  { amt: 99, val: "Existing", calls: "Talktime Rs 81", sms: "-", data: "200MB", cat: "Talktime", desc: "Top-up with talktime value.", full: "Rs 81 talktime credited to main balance plus 200MB data. Validity follows existing plan.", ott: [] },
  { amt: 49, val: "Existing", calls: "Talktime Rs 38", sms: "-", data: "100MB", cat: "Talktime", desc: "Small top-up pack.", full: "Rs 38.52 talktime plus 100MB data. Unlimited validity with active plan.", ott: [] },
];

export const PLAN_CATS = ["Popular", "Data", "Unlimited", "Talktime",];

export function perDay(p) {
  const m = /^(\d+)\s*days?$/.exec(p.val);
  if (!m) return "";
  const d = parseInt(m[1], 10);
  return d < 2 ? "" : `Rs ${(p.amt / d).toFixed(1)}/day`;
}

export function fmtNum(n) {
  if (!n) return "";
  const clean = String(n).replace(/\D/g, "");
  if (clean.length === 10) {
    return `${clean.slice(0, 5)} ${clean.slice(5)}`;
  }
  return n;
}

export function detectOperator(num) {
  return OPERATORS[parseInt(num[0], 10) % 4];
}

/**
 * Dynamically extract logged-in merchant mobile number from session or cookies
 */
export function getMerchantMobile() {
  if (typeof window !== "undefined") {
    try {
      const cached = sessionStorage.getItem("dashboard_data_session");
      if (cached) {
        const parsed = JSON.parse(cached);
        const mobile = parsed?.user?.mobile || parsed?.mobile || parsed?.authMobile;
        if (mobile) return String(mobile);
      }
    } catch {}
  }
  const cookieMobile = Cookies.get("authMobile");
  if (cookieMobile) return String(cookieMobile);
  return "9926452120"; // Fallback default
}

/**
 * Format Unix timestamp or date string to "14 Aug 2026"
 */
export function formatRechargeDate(ts) {
  if (!ts) return "";
  let dateObj;
  if (typeof ts === "number") {
    dateObj = new Date(ts > 1e11 ? ts : ts * 1000);
  } else {
    dateObj = new Date(ts);
  }

  if (isNaN(dateObj.getTime())) return "";

  const day = dateObj.getDate();
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = monthNames[dateObj.getMonth()];
  const year = dateObj.getFullYear();

  return `${day} ${month} ${year}`;
}

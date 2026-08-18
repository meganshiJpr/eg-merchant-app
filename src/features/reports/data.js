import { fmtDate, inr } from "@/utils/format";

export { fmtDate, inr };

const now = Date.now(), H = 3600000, D = 86400000;

export const SVC_COLOR = {
  Mobile: "var(--primary)", DTH: "var(--accent)", Electricity: "var(--orange)",
  Water: "var(--teal)", Gas: "var(--violet)", FASTag: "var(--primary)",
};
export const SVC_SOFT = {
  Mobile: "var(--primary-soft)", DTH: "var(--accent-soft)", Electricity: "var(--orange-soft)",
  Water: "var(--teal-soft)", Gas: "var(--violet-soft)", FASTag: "var(--primary-soft)",
};

export const TXNS = [
  { id: "RC482910345", svc: "Mobile", op: "Airtel", acct: "98212 34567", amt: 299, st: "success", t: now - 2 * H },
  { id: "RC482910301", svc: "DTH", op: "Tata Play", acct: "1234567890", amt: 350, st: "processing", t: now - 5 * H },
  { id: "BP482910222", svc: "Electricity", op: "JVVNL", acct: "1234 5678 9012", amt: 1240, st: "success", t: now - 8 * H },
  { id: "RC482909987", svc: "Mobile", op: "Jio", acct: "70144 55667", amt: 239, st: "failed", t: now - 1 * D - 3 * H },
  { id: "BP482909920", svc: "Water", op: "PHED Rajasthan", acct: "JPR04XX8821", amt: 460, st: "success", t: now - 1 * D - 6 * H },
  { id: "RC482909815", svc: "FASTag", op: "ICICI Bank", acct: "RJ14AB1234", amt: 500, st: "success", t: now - 2 * D },
  { id: "RC482909714", svc: "Mobile", op: "Vi", acct: "96369 98877", amt: 479, st: "refunded", t: now - 3 * D },
  { id: "BP482909633", svc: "Gas", op: "Indane Gas", acct: "98212 34567", amt: 950, st: "success", t: now - 4 * D },
  { id: "RC482909501", svc: "DTH", op: "Dish TV", acct: "12345678901", amt: 300, st: "success", t: now - 6 * D },
  { id: "BP482909444", svc: "Electricity", op: "AVVNL", acct: "9876 5432 1098", amt: 780, st: "processing", t: now - 9 * D },
  { id: "RC482909310", svc: "Mobile", op: "Airtel", acct: "88903 34455", amt: 3199, st: "success", t: now - 14 * D },
  { id: "BP482909228", svc: "Water", op: "Delhi Jal Board", acct: "1029384756", amt: 320, st: "failed", t: now - 22 * D },
];

export const LEDGER = [
  { id: "RC482910345", remark: "Mobile recharge · Airtel 98212 34567", amt: 299, ty: "dr", bal: 551, t: now - 2 * H },
  { id: "WT482910340", remark: "Wallet top-up via UPI", amt: 500, ty: "cr", bal: 850, t: now - 3 * H },
  { id: "RC482910301", remark: "DTH recharge · Tata Play 1234567890", amt: 350, ty: "dr", bal: 350, t: now - 5 * H },
  { id: "BP482910222", remark: "Electricity bill · JVVNL", amt: 1240, ty: "dr", bal: 700, t: now - 8 * H },
  { id: "CM482910101", remark: "Commission credit · daily payout", amt: 84, ty: "cr", bal: 1940, t: now - 22 * H },
  { id: "RF482909990", remark: "Refund · failed recharge Jio 70144 55667", amt: 239, ty: "cr", bal: 1856, t: now - 1 * D - 2 * H },
  { id: "MD482909900", remark: "Manual deposit approved · HDFC IMPS", amt: 2000, ty: "cr", bal: 1856, t: now - 1 * D - 8 * H },
  { id: "RC482909815", remark: "FASTag recharge · ICICI RJ14AB1234", amt: 500, ty: "dr", bal: 316, t: now - 2 * D },
  { id: "CM482909700", remark: "Commission credit · daily payout", amt: 61, ty: "cr", bal: 816, t: now - 2 * D - 6 * H },
  { id: "BP482909633", remark: "Gas bill · Indane 98212 34567", amt: 950, ty: "dr", bal: 755, t: now - 4 * D },
  { id: "WT482909500", remark: "Wallet top-up via UPI", amt: 1500, ty: "cr", bal: 1705, t: now - 5 * D },
  { id: "MD482909100", remark: "Manual deposit approved · ICICI NEFT", amt: 3000, ty: "cr", bal: 3404, t: now - 15 * D },
];

export const DEPOSITS = [
  { id: "WT482910340", app: "PhonePe", rrn: "618822904511", amt: 500, st: "success", t: now - 3 * H },
  { id: "WT482910218", app: "Google Pay", rrn: "618820773245", amt: 2000, st: "success", t: now - 9 * H },
  { id: "WT482910105", app: "Paytm", rrn: "618817665002", amt: 1000, st: "pending", t: now - 20 * H },
  { id: "WT482909902", app: "PhonePe", rrn: "618809441780", amt: 199, st: "failed", t: now - 1 * D - 4 * H },
  { id: "WT482909500", app: "PhonePe", rrn: "618702118456", amt: 1500, st: "success", t: now - 5 * D },
  { id: "WT482909207", app: "Other UPI", rrn: "618544019823", amt: 700, st: "failed", t: now - 12 * D },
  { id: "WT482909015", app: "Paytm", rrn: "618410277645", amt: 5000, st: "success", t: now - 18 * D },
];

export const MANUAL_DEPS = [
  { id: "MD482910400", bank: "HDFC Bank · ****4521", mode: "IMPS", utr: "HDFCR52026072010", amt: 5000, st: "pending", t: now - 4 * H },
  { id: "MD482909900", bank: "HDFC Bank · ****4521", mode: "IMPS", utr: "HDFCR52026071822", amt: 2000, st: "approved", t: now - 1 * D - 8 * H },
  { id: "MD482909750", bank: "ICICI Bank · ****8890", mode: "NEFT", utr: "ICICN52026071540", amt: 10000, st: "approved", t: now - 3 * D },
  { id: "MD482909600", bank: "Axis Bank · ****2214", mode: "Cash", utr: "CASH-DEP-88213", amt: 3000, st: "rejected", reason: "Deposit slip not readable · upload again", t: now - 5 * D },
  { id: "MD482909300", bank: "HDFC Bank · ****4521", mode: "RTGS", utr: "HDFCR52026070901", amt: 200000, st: "approved", t: now - 9 * D },
  { id: "MD482908800", bank: "HDFC Bank · ****4521", mode: "CDM", utr: "CDM-JPR-104482", amt: 8000, st: "rejected", reason: "UTR did not match bank statement", t: now - 21 * D },
];

export const DISPUTES = [
  { cid: "CMP20260931", txn: "RC482909987", svc: "Mobile", op: "Jio", acct: "70144 55667", amt: 239, st: "resolved", remark: "Customer says recharge failed but amount debited", res: "Amount refunded to wallet on 19 Jul", t: now - 6 * H },
  { cid: "CMP20260918", txn: "RC482910301", svc: "DTH", op: "Tata Play", acct: "1234567890", amt: 350, st: "progress", remark: "Recharge success but channels not active", res: "", t: now - 1 * D - 2 * H },
  { cid: "CMP20260902", txn: "BP482910222", svc: "Electricity", op: "JVVNL", acct: "1234 5678 9012", amt: 1240, st: "open", remark: "Bill paid but not updated on portal", res: "", t: now - 2 * D },
  { cid: "CMP20260867", txn: "RC482909714", svc: "Mobile", op: "Vi", acct: "96369 98877", amt: 479, st: "resolved", remark: "Wrong number recharged by mistake", res: "Refund approved as goodwill · one-time", t: now - 5 * D },
  { cid: "CMP20260812", txn: "BP482909633", svc: "Gas", op: "Indane Gas", acct: "98212 34567", amt: 950, st: "rejected", remark: "Requested refund for booked cylinder", res: "Cylinder already delivered · refund not possible", t: now - 9 * D },
];

export const COMMS = [
  ["Mobile", 299, 6, 0.1], ["Mobile", 239, 5, 0.4], ["Mobile", 479, 10, 1.2], ["Mobile", 3199, 64, 2.5],
  ["Mobile", 199, 4, 6], ["Mobile", 299, 6, 12], ["DTH", 350, 9, 0.2], ["DTH", 300, 8, 3],
  ["DTH", 600, 15, 8], ["Electricity", 1240, 5, 0.3], ["Electricity", 780, 5, 9], ["Electricity", 2200, 5, 21],
  ["Water", 460, 5, 1.3], ["Water", 320, 5, 22], ["Gas", 950, 8, 4], ["Gas", 1100, 8, 26],
  ["FASTag", 500, 4, 2], ["FASTag", 1000, 7, 14],
].map((r) => ({ svc: r[0], amt: r[1], comm: r[2], t: now - r[3] * D }));

export const withinDays = (t, days) => !days || Date.now() - t <= days * 86400000;

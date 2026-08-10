/** BBPS-style biller config. Production: GET /billers?category=
 *  Each biller declares its dynamic fields, action button, and amount rules. */
export type FieldType = "num" | "txt" | "date" | "sel";
export type Field = { label: string; type: FieldType; ph?: string; min?: number; max?: number; options?: string[] };
export type ButtonType = "fetch" | "info" | "proceed";
export type Biller = {
  n: string; sub: string; c: string; a: string;
  btn: ButtonType;
  fields: Field[];
  aedit?: boolean; // operator allows editing the fetched bill amount
  walletAllowed?: boolean;
};
export type BillerCategory = { title: string; amin: number; amax: number; items: Biller[] };

export const BUTTON_LABEL: Record<ButtonType, string> = {
  fetch: "Fetch Bill",
  info: "Get Customer Info",
  proceed: "Proceed",
};

const VEH: Field = { label: "Vehicle Number", type: "txt", ph: "e.g. RJ14AB1234", min: 8, max: 11 };

export const BILLERS: BillerCategory[] = [
  {
    title: "DTH Recharge", amin: 100, amax: 10000,
    items: [
      { n: "Tata Play", sub: "All India", c: "#3B0764", a: "TP", btn: "info", fields: [{ label: "Subscriber ID", type: "num", ph: "10-digit subscriber ID", min: 10, max: 10 }] },
      { n: "Airtel Digital TV", sub: "All India", c: "#E40000", a: "Ai", btn: "info", fields: [{ label: "Customer ID", type: "num", ph: "10-digit customer ID", min: 10, max: 10 }] },
      { n: "Dish TV", sub: "All India", c: "#F07800", a: "DT", btn: "info", fields: [{ label: "Viewing Card Number", type: "num", ph: "11-digit VC number", min: 11, max: 11 }] },
      { n: "d2h", sub: "All India", c: "#D81F26", a: "d2", btn: "info", fields: [{ label: "Customer ID", type: "num", ph: "Customer ID or RTN", min: 8, max: 12 }] },
      { n: "Sun Direct", sub: "All India", c: "#B5790E", a: "SD", btn: "info", fields: [{ label: "Smart Card Number", type: "num", ph: "11-digit smart card no.", min: 11, max: 11 }] },
    ],
  },
  {
    title: "Electricity Bill", amin: 50, amax: 50000,
    items: [
      { n: "JVVNL", sub: "Jaipur Vidyut Vitran Nigam · Rajasthan", c: "#0A2885", a: "JV", btn: "fetch", fields: [{ label: "K Number", type: "num", ph: "12-digit K number", min: 12, max: 12 }] },
      { n: "AVVNL", sub: "Ajmer Vidyut Vitran Nigam · Rajasthan", c: "#0F7A5C", a: "AV", btn: "fetch", aedit: true, fields: [{ label: "K Number", type: "num", ph: "12-digit K number", min: 12, max: 12 }, { label: "Bill Date", type: "date", ph: "DD/MM/YYYY" }] },
      { n: "JdVVNL", sub: "Jodhpur Vidyut Vitran Nigam · Rajasthan", c: "#7B2FBE", a: "Jd", btn: "fetch", fields: [{ label: "K Number", type: "num", ph: "12-digit K number", min: 12, max: 12 }] },
      { n: "Torrent Power", sub: "Gujarat · UP · Maharashtra", c: "#B4128F", a: "TO", btn: "fetch", aedit: true, fields: [{ label: "City", type: "sel", options: ["Ahmedabad", "Surat", "Agra", "Bhiwandi"] }, { label: "Service Number", type: "num", ph: "Service number", min: 6, max: 14 }] },
      { n: "Adani Electricity", sub: "Mumbai", c: "#1A5C9E", a: "AD", btn: "fetch", fields: [{ label: "Consumer Number", type: "num", ph: "9-digit consumer no.", min: 9, max: 9 }] },
      { n: "MSEDCL", sub: "Maharashtra", c: "#E40000", a: "MS", btn: "fetch", fields: [{ label: "Consumer Number", type: "num", ph: "12-digit consumer no.", min: 12, max: 12 }, { label: "Billing Unit", type: "num", ph: "4-digit BU code", min: 4, max: 4 }] },
      { n: "UPPCL", sub: "Uttar Pradesh", c: "#008540", a: "UP", btn: "fetch", fields: [{ label: "Connection Type", type: "sel", options: ["Rural", "Urban"] }, { label: "Account Number", type: "num", ph: "10 or 12-digit account no.", min: 10, max: 12 }] },
      { n: "BSES Rajdhani", sub: "Delhi", c: "#F07800", a: "BS", btn: "fetch", fields: [{ label: "CA Number", type: "num", ph: "9-digit CA number", min: 9, max: 9 }] },
    ],
  },
  {
    title: "Water Bill", amin: 50, amax: 20000,
    items: [
      { n: "PHED Rajasthan", sub: "Public Health Engineering Dept", c: "#0A7A9E", a: "PH", btn: "fetch", fields: [{ label: "Connection Number", type: "txt", ph: "e.g. JPR04XXXXXX", min: 6, max: 14 }] },
      { n: "Delhi Jal Board", sub: "Delhi", c: "#0A2885", a: "DJ", btn: "fetch", fields: [{ label: "K Number", type: "num", ph: "10-digit K number", min: 10, max: 10 }] },
      { n: "BWSSB", sub: "Bengaluru", c: "#0F7A5C", a: "BW", btn: "fetch", fields: [{ label: "RR Number", type: "txt", ph: "e.g. NKL1234", min: 5, max: 12 }] },
      { n: "MCGM Water", sub: "Mumbai", c: "#7B2FBE", a: "MC", btn: "fetch", fields: [{ label: "CCN Number", type: "num", ph: "Contract account no.", min: 8, max: 12 }] },
    ],
  },
  {
    title: "Gas Bill", amin: 50, amax: 20000,
    items: [
      { n: "Indraprastha Gas", sub: "IGL · piped gas · Delhi NCR", c: "#008540", a: "IG", btn: "fetch", fields: [{ label: "BP Number", type: "num", ph: "10-digit BP number", min: 10, max: 10 }] },
      { n: "Rajasthan State Gas", sub: "Piped gas · Rajasthan", c: "#B5790E", a: "RS", btn: "fetch", fields: [{ label: "Customer ID", type: "num", ph: "Customer ID", min: 6, max: 12 }] },
      { n: "Indane Gas", sub: "LPG cylinder booking", c: "#D81F26", a: "IN", btn: "info", fields: [{ label: "LPG ID or Registered Mobile", type: "num", ph: "17-digit LPG ID or 10-digit mobile", min: 10, max: 17 }] },
      { n: "HP Gas", sub: "LPG cylinder booking", c: "#0A2885", a: "HP", btn: "info", fields: [{ label: "Distributor", type: "sel", options: ["Jaipur – Malviya Nagar", "Jaipur – Vaishali", "Jaipur – Sanganer"] }, { label: "Consumer Number", type: "num", ph: "Consumer number", min: 6, max: 12 }] },
      { n: "Bharatgas", sub: "LPG cylinder booking", c: "#F07800", a: "BG", btn: "info", fields: [{ label: "Registered Mobile", type: "num", ph: "10-digit mobile", min: 10, max: 10 }] },
    ],
  },
  {
    title: "FASTag Recharge", amin: 100, amax: 10000,
    items: [
      { n: "ICICI Bank FASTag", sub: "All India", c: "#B02A30", a: "IC", btn: "proceed", fields: [VEH] },
      { n: "HDFC Bank FASTag", sub: "All India", c: "#004C8F", a: "HD", btn: "proceed", fields: [VEH] },
      { n: "Axis Bank FASTag", sub: "All India", c: "#7B2FBE", a: "AX", btn: "proceed", fields: [VEH] },
      { n: "IDFC First FASTag", sub: "All India", c: "#8A1538", a: "ID", btn: "proceed", fields: [VEH] },
      { n: "Airtel Payments FASTag", sub: "All India", c: "#E40000", a: "Ai", btn: "proceed", fields: [VEH] },
    ],
  },
];

export const CATEGORY_INDEX = { dth: 0, electricity: 1, water: 2, gas: 3, fastag: 4 } as const;
export type CategoryKey = keyof typeof CATEGORY_INDEX;

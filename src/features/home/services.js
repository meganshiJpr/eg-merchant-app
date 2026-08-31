export const serviceGroups = [
  {
    title: "Recharge and Bills",
    barColor: "var(--primary)",
    items: [
      { key: "mobile", label: "Mobile", color: "var(--primary)", soft: "var(--primary-soft)", href: "/recharge" },
      { key: "dth", label: "DTH", color: "var(--accent)", soft: "var(--accent-soft)", href: "/billers?type=DTH" },
      { key: "electricity", label: "Electricity", color: "var(--orange)", soft: "var(--orange-soft)", href: "/billers?type=Electricity" },
      { key: "water", label: "Water", color: "var(--teal)", soft: "var(--teal-soft)", href: "/billers?type=Water" },
      { key: "gas", label: "Gas", color: "var(--violet)", soft: "var(--violet-soft)", href: "/billers?type=Gas" },
      { key: "fastag", label: "FASTag", color: "var(--primary)", soft: "var(--primary-soft)", href: "/billers?type=FASTag" },
      { key: "subscription", label: "Subscription", color: "var(--primary)", soft: "var(--primary-soft)", href: "/billers?type=Subscription" },

    ],
  },
  {
    title: "Banking Services",
    barColor: "var(--teal)",
    items: [
      { key: "aeps", label: "AEPS", color: "var(--teal)", soft: "var(--teal-soft)" },
      { key: "dmt", label: "Money Transfer", color: "var(--violet)", soft: "var(--violet-soft)" },
      { key: "aadhaarpay", label: "Aadhaar Pay", color: "var(--primary)", soft: "var(--primary-soft)" },
      { key: "ministmt", label: "Mini Statement", color: "var(--orange)", soft: "var(--orange-soft)" },
      { key: "cashdep", label: "Cash Deposit", color: "var(--accent)", soft: "var(--accent-soft)" },
      { key: "matm", label: "Micro ATM", color: "var(--teal)", soft: "var(--teal-soft)" },
    ],
  },
  {
    title: "Business Tools",
    barColor: "var(--accent)",
    items: [
      { key: "khaata", label: "Khaata Book", color: "var(--accent)", soft: "var(--accent-soft)", href: "/khaata" },
      { key: "qr", label: "My QR Code", color: "var(--primary)", soft: "var(--primary-soft)" },
      { key: "reports", label: "Reports", color: "var(--teal)", soft: "var(--teal-soft)", href: "/reports" },
      { key: "discount", label: "Discount Chart", color: "var(--orange)", soft: "var(--orange-soft)", href: "/discount" },
    ],
  },
  {
    title: "More Services",
    barColor: "var(--violet)",
    items: [
      { key: "insurance", label: "Insurance", color: "var(--teal)", soft: "var(--teal-soft)" },
      { key: "pan", label: "PAN Card", color: "var(--orange)", soft: "var(--orange-soft)" },
      { key: "travel", label: "Bus Booking", color: "var(--violet)", soft: "var(--violet-soft)" },
    ],
  },
];

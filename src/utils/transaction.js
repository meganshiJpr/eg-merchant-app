
//  * Dynamically extract category names from sessionStorage ("dashboard_data_session" -> services -> service_name)

export function getCategoriesFromSession() {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem("dashboard_data_session");
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    const list = parsed?.services || parsed?.data?.services || parsed?.dynamic_menus?.bbps_menus || [];

    const set = new Set();
    const processItem = (item) => {
      const name = item?.service_name || item?.name || item?.title;
      if (name && typeof name === "string") set.add(name.trim());
      if (Array.isArray(item?.sub_menus)) {
        item.sub_menus.forEach(processItem);
      }
    };

    if (Array.isArray(list)) list.forEach(processItem);
    else if (list && typeof list === "object") Object.values(list).forEach(processItem);

    return Array.from(set);
  } catch {
    return [];
  }
}

//  * Format Unix timestamp string/number or date string to "30 Aug 2026, 12:25 PM"
//  */
export function formatRequestTime(reqTime) {
  if (!reqTime) return "N/A";
  let dateObj;
  const num = Number(reqTime);
  if (!isNaN(num) && num > 0) {
    dateObj = new Date(num > 1e11 ? num : num * 1000);
  } else {
    dateObj = new Date(reqTime);
  }

  if (isNaN(dateObj.getTime())) return String(reqTime);

  const day = dateObj.getDate();
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = monthNames[dateObj.getMonth()];
  const year = dateObj.getFullYear();

  let hours = dateObj.getHours();
  const minutes = String(dateObj.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12; // hour 0 should be 12

  return `${day} ${month} ${year}, ${hours}:${minutes} ${ampm}`;
}



export function generateMonthsList(totalMonths = 12) {
  const months = [];
  const now = new Date();
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  let currentYear = now.getFullYear();
  let currentMonth = now.getMonth();

  for (let i = 0; i < totalMonths; i++) {
    const monthName = monthNames[currentMonth];
    const yearStr = currentYear.toString();
    const label = `${monthName} ${yearStr}`;

    const monthFormatted = String(currentMonth + 1).padStart(2, "0");
    const lastDay = new Date(currentYear, currentMonth + 1, 0).getDate();
    const from = `${yearStr}-${monthFormatted}-01`;
    const to = `${yearStr}-${monthFormatted}-${String(lastDay).padStart(2, "0")}`;

    months.push({
      label,
      month_year: label,
      from,
      to,
    });

    currentMonth--;
    if (currentMonth < 0) {
      currentMonth = 11;
      currentYear--;
    }
  }

  return months;
}

export function getDateRange(tab) {
  const today = new Date();
  const format = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };
  const to = format(today);

  if (tab === "all") return { from: "", to: "" };
  if (tab === "today") return { from: to, to };

  const from = new Date(today);
  if (tab === "7days") {
    from.setDate(today.getDate() - 6);
  } else {
    from.setDate(today.getDate() - 29);
  }

  return { from: format(from), to };
}
export const BUTTON_LABEL = {
  fetch: "Fetch Bill",
  info: "Get Customer Info",
  proceed: "Proceed",
};

const VEH = { label: "Vehicle Number", type: "txt", ph: "e.g. RJ14AB1234", min: 8, max: 11 };

export const BILLERS = [
  {
    title: "DTH Recharge", amin: 100, amax: 10000,
  },
  {
    title: "Electricity Bill", amin: 50, amax: 50000,
  },
  {
    title: "Water Bill", amin: 50, amax: 20000,
  },
  {
    title: "Gas Bill", amin: 50, amax: 20000,
  },
  {
    title: "FASTag Recharge", amin: 100, amax: 10000,
 
  },
];

export const CATEGORY_INDEX = { dth: 0, electricity: 1, water: 2, gas: 3, fastag: 4 };

// "use client";

// import { useEffect, useState } from "react";
// import apiCall from "@/helper/apiCall";
// import Cookies from "js-cookie";
// import { decodeApiResponse } from "@/lib/net/decodeApiResponse";

// const fetchCommissionData = async () => {
//   try {
//     const baseUrl = process?.env?.NEXT_PUBLIC_API_KEY || "https://paybyapis.com";
//     const result = await apiCall(
//       baseUrl + "/apisf/apish",
//       "post",
//       {},
//       "myCommissionPackage"
//     );

//     let apiData = result?.data;
//     const parsed = decodeApiResponse(apiData);
//     if (!parsed) return [];

//     console.log("Data Result:", parsed);
//     return parsed;
//   } catch (error) {
//     console.error("Error fetching commission data:", error);
//     return [];
//   }
// };

// export default function KhaataPage() {
//   const [data, setData] = useState([]);
//   const [loading, setLoading] = useState(true);

//   // useEffect(() => {
//   //   if (!Cookies.get("authToken")) {
//   //     Cookies.set("authToken", "test_auth_token_demo", { expires: 1 });
//   //   }
//   //   if (!Cookies.get("authMobile")) {
//   //     Cookies.set("authMobile", "9821249876", { expires: 1 });
//   //   }

//   //   async function loadData() {
//   //     setLoading(true);
//   //     const res = await fetchCommissionData();
//   //     console.log("Fetched commission data:", res);
//   //     setData(res);
//   //     setLoading(false);
//   //   }
//   //   loadData();
//   // }, []);

//   return (
//     <div className="p-4">
//       <h1 className="text-2xl font-bold mb-4">Khaata Commission Data</h1>
//       {loading ? (
//         <p className="text-sm text-text-2">Loading...</p>
//       ) : data && data.length === 0 ? (
//         <p className="text-sm text-text-2">No commission data available.</p>
//       ) : (
//         data.map((group, gi) => (
//           <div key={gi} className="mt-4">
//             <h2 className="font-semibold">{group.type}</h2>
//             <ul className="mt-2 space-y-2">
//               {group.data?.map((item, ii) => (
//                 <li key={ii} className="flex justify-between">
//                   <span>{item.name}</span>
//                   <span className="text-text-2">{item.commission}</span>
//                 </li>
//               ))}
//             </ul>
//           </div>
//         ))
//       )}

//     </div>
//   );
// }

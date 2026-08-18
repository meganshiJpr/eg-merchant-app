const paths = {
  mobile: <rect x="6.5" y="1.5" width="11" height="21" rx="2.8" />,
  dth: <path d="M12 3a9 9 0 0 1 9 9h-3.2A5.8 5.8 0 0 0 12 6.2Zm0 4.3a4.7 4.7 0 0 1 4.7 4.7h-3a1.7 1.7 0 0 0-1.7-1.7ZM4 11l6 6-2 2-1.5 1.5a1.7 1.7 0 0 1-2.4 0l-1.6-1.6a1.7 1.7 0 0 1 0-2.4Z" />,
  electricity: <path d="M13.5 2 4.8 13.5h5.2L9.5 22l8.7-11.5H13Z" />,
  water: <path d="M12 2.5c3.6 4.3 7 8 7 12a7 7 0 0 1-14 0c0-4 3.4-7.7 7-12Z" />,
  gas: <path d="M12 2c1 3.4 4.5 5.4 4.5 9.2 0 1.5-.6 2.8-1.5 3.8.2-2.6-1.2-4.4-3-5.8-1.7 1.4-3.2 3.2-3 5.8-.9-1-1.5-2.3-1.5-3.8C7.5 7.4 11 5.4 12 2Zm0 20a5.5 5.5 0 0 1-5.5-5.5c3.7.4 7.3.4 11 0A5.5 5.5 0 0 1 12 22Z" />,
  fastag: <path d="M3 5h18a1.5 1.5 0 0 1 1.5 1.5v11A1.5 1.5 0 0 1 21 19H3a1.5 1.5 0 0 1-1.5-1.5v-11A1.5 1.5 0 0 1 3 5Zm1 4v2h16V9Zm0 5v2h9v-2Z" />,
  aeps: <><circle cx="12" cy="12" r="9.5" /><circle cx="12" cy="12" r="4.3" fill="var(--surface)" /></>,
  dmt: <><rect x="2" y="6" width="14" height="9.5" rx="2" /><path d="M15.5 15H20l-1.8-1.8 1.4-1.4 3.9 3.9-3.9 3.9-1.4-1.4L20 16.5h-4.5Z" /></>,
  aadhaarpay: <><rect x="1.8" y="4.5" width="20.4" height="15" rx="2.2" /><circle cx="8" cy="10.5" r="2.6" fill="var(--surface)" /></>,
  ministmt: <path d="M6 2h12v20l-2.5-1.6L13 22l-2.5-1.6L8 22l-2-1.6Zm3 6h6v1.8H9Zm0 4h6v1.8H9Z" />,
  cashdep: <><path d="M12 2v7M9 6l3 3 3-3" stroke="currentColor" strokeWidth="2.1" fill="none" strokeLinecap="round" /><rect x="2.5" y="11" width="19" height="10.5" rx="2" /></>,
  matm: <path d="M4 2h16v13H4Zm2 2v9h12V4ZM7 17h10l2 5H5Z" />,
  khaata: <path d="M4 3.5h9.5a3 3 0 0 1 3 3V20.5H7a3 3 0 0 1-3-3Zm3 4h7v1.6H7Zm0 3.5h7v1.6H7Z" />,
  qr: <path d="M3 3h8v8H3Zm2 2v4h4V5Zm8-2h8v8h-8Zm2 2v4h4V5ZM3 13h8v8H3Zm2 2v4h4v-4Zm10-2h2.5v2.5H15Zm5.5 0H23v2.5h-2.5ZM15 18.5h2.5V21H15Zm5.5 0H23V21h-2.5Z" />,
  reports: <path d="M3 12h4.5v9H3Zm6.75-5h4.5v14h-4.5Zm6.75-4H21v18h-4.5Z" />,
  discount: <><circle cx="12" cy="12" r="10" /><path d="M8.6 15.4 15.4 8.6" stroke="var(--surface)" strokeWidth="1.9" strokeLinecap="round" /><circle cx="9.1" cy="9.1" r="1.7" fill="var(--surface)" /><circle cx="14.9" cy="14.9" r="1.7" fill="var(--surface)" /></>,
  insurance: <path d="M12 2 4 5.5v5c0 5 3.4 9.6 8 11.5 4.6-1.9 8-6.5 8-11.5v-5Zm-1.4 13.6-3.3-3.3 1.4-1.4 1.9 1.9 4.5-4.5 1.4 1.4Z" />,
  pan: <path d="M3 5h18a1.5 1.5 0 0 1 1.5 1.5v11A1.5 1.5 0 0 1 21 19H3a1.5 1.5 0 0 1-1.5-1.5v-11A1.5 1.5 0 0 1 3 5Zm4.5 4A1.8 1.8 0 1 0 9.3 10.8 1.8 1.8 0 0 0 7.5 9ZM4.8 15.5c0-1.5 1.8-2.3 2.7-2.3s2.7.8 2.7 2.3ZM13 9h6v1.6h-6Zm0 3.4h6V14h-6Z" />,
  travel: <path d="M4 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v13a2 2 0 0 1-1 1.7V20a1.3 1.3 0 0 1-2.6 0v-1H7.6v1A1.3 1.3 0 0 1 5 20v-1.3A2 2 0 0 1 4 17Zm2 1v6h12V5Zm1.8 10.8A1.3 1.3 0 1 0 9 14.5a1.3 1.3 0 0 0-1.2 1.3Zm8.4 0a1.3 1.3 0 1 0 1.2-1.3 1.3 1.3 0 0 0-1.2 1.3Z" />,
};

export function ServiceIcon({ name, color }) {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" style={{ fill: color, color }}>
      {paths[name] ?? <circle cx="12" cy="12" r="9" />}
    </svg>
  );
}

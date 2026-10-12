"use client";

import { useState } from "react";
import { SubHeader } from "@/components/ui/SubHeader";
import { BankAccountsTab } from "@/features/profile/components/BankAccountsTab";
import { UpiTab } from "@/features/profile/components/UpiTab";

export default function BanksPage() {
  const [activeTab, setActiveTab] = useState("bank");

  return (
    <>
      <SubHeader title="Bank & UPI Accounts" backHref="/profile" showImg={false} />

      <div className="flex border-b border-border bg-surface px-4 pt-2">
        <button
          type="button"
          onClick={() => setActiveTab("bank")}
          className={`flex-1 py-3 text-center text-[13px] font-bold transition border-b-2 ${
            activeTab === "bank"
              ? "border-primary text-primary"
              : "border-transparent text-text-3 hover:text-text-1"
          }`}
        >
          Bank Accounts
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("upi")}
          className={`flex-1 py-3 text-center text-[13px] font-bold transition border-b-2 ${
            activeTab === "upi"
              ? "border-primary text-primary"
              : "border-transparent text-text-3 hover:text-text-1"
          }`}
        >
          UPI Details
        </button>
      </div>

      {activeTab === "bank" ? <BankAccountsTab /> : <UpiTab />}
    </>
  );
}

"use client";

import { SubHeader } from "@/components/ui/SubHeader";
import { DetailRow } from "@/features/profile/components/DetailRow";
import { useToast } from "@/components/ui/Toast";

export default function ShopPage() {
  const toast = useToast((t) => t.show);
  return (
    <>
      <SubHeader title="Shop Details" backHref="/profile" showImg={false}/>
      <div className="p-4">
        <div className="rounded-2xl border border-border bg-surface px-4 py-1">
          <DetailRow label="Shop name" value="Shri Balaji Mobile Store" />
          <DetailRow label="Shop type" value="Mobile & Recharge" />
          <DetailRow label="Address" value="Shop 12, Johari Bazaar, Jaipur" />
          <DetailRow label="Pincode" value="302003" mono />
          <DetailRow label="GST number" value="08ABCPK1234R1Z5" mono />
        </div>
        <button onClick={() => toast("Production: opens editable form / update request")} className="mt-4 w-full rounded-xl border-[1.5px] border-border bg-surface py-3 font-display text-[13px] font-semibold">
          Request an update
        </button>
      </div>
    </>
  );
}

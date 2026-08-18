"use client";

import { SubHeader } from "@/components/ui/SubHeader";
import { DetailRow } from "@/features/profile/components/DetailRow";
import { useToast } from "@/components/ui/Toast";

export default function PersonalPage() {
  const toast = useToast((t) => t.show);
  return (
    <>
      <SubHeader title="Personal Details" backHref="/profile" />
      <div className="p-4">
        <div className="rounded-2xl border border-border bg-surface px-4 py-1">
          <DetailRow label="Full name" value="Ramesh Kumar" />
          <DetailRow label="Mobile number" value="+91 98212 49876" mono />
          <DetailRow label="Email" value="ramesh.store@gmail.com" />
          <DetailRow label="Date of birth" value="14 Aug 1988" />
          <DetailRow label="PAN" value="ABCPK1234R" mono />
        </div>
        <button onClick={() => toast("Production: opens editable form / update request")} className="mt-4 w-full rounded-xl border-[1.5px] border-border bg-surface py-3 font-display text-[13px] font-semibold">
          Request an update
        </button>
      </div>
    </>
  );
}

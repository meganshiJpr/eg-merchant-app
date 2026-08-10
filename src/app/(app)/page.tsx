import { ServiceGrid } from "@/features/home/ServiceGrid";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Promo slider — milestone 2 ports the full swipe engine.
          Slides come from the banner API with placement="home_top". */}
      <div className="flex h-[140px] items-center rounded-2xl bg-gradient-to-r from-primary to-violet px-5 text-white">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider opacity-80">
            Recharge offer
          </div>
          <div className="mt-1 max-w-[240px] font-display text-[17px] font-semibold leading-snug">
            Extra 1% commission on annual plans
          </div>
          <div className="mt-1 text-[11.5px] opacity-80">All operators · this month</div>
        </div>
      </div>

      {/* KYC banner — driven by merchant.kycStatus once auth is wired */}
      <Link
        href="/kyc"
        className="flex items-center gap-3 rounded-2xl border-[1.5px] border-orange bg-orange-soft px-4 py-3"
      >
        <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-orange">
          <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-white">
            <path d="M12 2 1.5 20.5h21Zm1.1 13.6h-2.2v-5h2.2Zm0 3.4h-2.2v-2.2h2.2Z" />
          </svg>
        </span>
        <span className="flex-1 text-[12px] font-medium text-text-2">
          Complete your KYC to unlock AEPS and Money Transfer
        </span>
        <span className="text-[12px] font-bold text-orange">Continue</span>
      </Link>

      <ServiceGrid />
    </div>
  );
}

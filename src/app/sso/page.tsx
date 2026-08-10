import { Suspense } from "react";
import { SsoLanding } from "@/features/auth/components/SsoLanding";

export default function SsoPage() {
  return (
    <Suspense>
      <SsoLanding />
    </Suspense>
  );
}

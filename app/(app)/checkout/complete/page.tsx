import type { Metadata } from "next";
import { PaymentRedirectHandler } from "@/components/checkout/PaymentRedirectHandler";

export const metadata: Metadata = { title: "결제 확인", robots: { index: false } };

// PortOne 모바일 결제는 redirectUrl 로 돌아온다: ?paymentId=...&code=...&message=...
export default function CheckoutCompletePage({
  searchParams,
}: {
  searchParams: { paymentId?: string; code?: string; message?: string };
}) {
  return (
    <PaymentRedirectHandler
      paymentId={searchParams.paymentId ?? null}
      code={searchParams.code ?? null}
      message={searchParams.message ?? null}
    />
  );
}

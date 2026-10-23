import type { Metadata } from "next";
import { PaymentRedirectHandler } from "@/components/checkout/PaymentRedirectHandler";

export const metadata: Metadata = { title: "결제 확인", robots: { index: false } };

/**
 * 결제창에서 돌아오는 자리.
 *
 * 토스는 성공하면 ?paymentType&amount&orderId&paymentKey 를,
 * 실패하면 ?code&message&orderId 를 붙여 보낸다. orderId 가 우리 주문번호다.
 */
export default function CheckoutCompletePage({
  searchParams,
}: {
  searchParams: { orderId?: string; paymentKey?: string; amount?: string; code?: string; message?: string };
}) {
  return (
    <PaymentRedirectHandler
      paymentId={searchParams.orderId ?? null}
      paymentKey={searchParams.paymentKey ?? null}
      code={searchParams.code ?? null}
      message={searchParams.message ?? null}
    />
  );
}

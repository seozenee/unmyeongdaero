import { AppError, jsonError } from "@/lib/errors";
import { confirmPayment } from "@/lib/payments/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/payments/webhook — 토스페이먼츠 결제 상태 변경 알림.
 *
 * 토스 웹훅에는 서명이 없다. 그래서 몸통의 내용은 "주문번호 하나"만 꺼내 쓰고,
 * 실제 상태는 토스에 다시 물어서 판단한다. 남이 가짜 웹훅을 쏴도 우리가 조회한 결과가
 * 'DONE' 이 아니면 아무 일도 일어나지 않는다. 서명 검증보다 이쪽이 확실하다.
 *
 * 결제 승인 자체는 완료 화면에서 이미 끝난다. 이 웹훅은 그 길이 끊겼을 때
 * (창을 닫았거나 네트워크가 끊겼거나) 뒤늦게 구매를 열어 주는 보험이다.
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | { eventType?: string; data?: { orderId?: string; status?: string } }
    | null;

  const orderId = body?.data?.orderId;
  if (!orderId) return new Response(null, { status: 200 });

  try {
    // paymentKey 를 넘기지 않으므로 승인이 아니라 '조회'로 간다.
    // 이미 승인된 결제만 구매로 이어진다.
    await confirmPayment(orderId);
  } catch (error) {
    // 우리 주문이 아니면 재시도해도 소용없다
    if (error instanceof AppError && error.status === 404) return new Response(null, { status: 200 });
    console.error(`[webhook] ${orderId} 처리 실패`, error);
    return jsonError(500, "WEBHOOK_ERROR", "웹훅 처리 실패");
  }

  return new Response(null, { status: 200 });
}

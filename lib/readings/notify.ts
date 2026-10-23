import "server-only";

import { getRepository, type Reading } from "@/lib/db";
import { env } from "@/lib/env";
import { notify, type NotifyKind } from "@/lib/notify";
import { ensureReadingPdf, ensureShareToken, pdfShareUrl, readingShareUrl } from "@/lib/pdf/store";
import type { ReportProduct } from "@/lib/reports/catalog";

const ISSUED = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric", month: "long", day: "numeric", timeZone: "Asia/Seoul",
});

/** 주문번호 대신 보여 줄 짧은 식별자 — 문의할 때 서로 가리킬 것이 필요하다 */
const orderNumber = (reading: Reading) => reading.id.replace(/-/g, "").slice(0, 8).toUpperCase();

/**
 * 풀이 진행 상황을 알림톡으로 알린다.
 *
 * 번호를 남기지 않은 사람에게는 아무 일도 하지 않는다. 같은 단계를 두 번 보내지도 않는다
 * (생성이 실패해 다시 돌 때 "시작했어요"가 또 가면 곤란하다).
 *
 * 실패해도 던지지 않는다. 알림이 안 갔다고 풀이 생성을 되돌릴 수는 없다.
 */
export async function notifyReading(reading: Reading, report: ReportProduct, kind: NotifyKind) {
  if (!reading.notifyPhone) return;
  if (reading.notifiedKind === kind) return;

  // 알림톡 버튼의 링크는 템플릿에 박혀 있어 상품마다 바꿀 수 없다.
  // 그래서 코드 하나만 변수로 두고(/v/{코드}, /r/{코드}), 어디로 갈지는 서버가 정한다.
  // 코드는 PDF 를 구울 때 함께 발급되므로, 없으면 여기서 먼저 만들어 둔다.
  const links: Partial<Record<"report" | "pdf", string>> = {};

  const variables: Record<string, string> = {
    "#{이름}": reading.subject.name,
    "#{상품}": report.title,
    "#{주문번호}": orderNumber(reading),
  };

  if (kind === "reading-ready") {
    variables["#{발행일}"] = ISSUED.format(reading.generatedAt ? new Date(reading.generatedAt) : new Date());
    try {
      const stored = await ensureReadingPdf(reading);
      if (stored) {
        links.report = readingShareUrl(stored.token);
        links.pdf = pdfShareUrl(stored.token);
      }
    } catch (error) {
      // PDF 를 못 구워도 "완성됐다"는 알림 자체는 보낸다. 보고서 화면에서 다시 받을 수 있다.
      console.error(`[notify] PDF 준비 실패 (reading ${reading.id})`, error);
    }
  } else {
    // 시작 알림에는 PDF 가 아직 없다. 코드만 미리 발급해 「진행 상황 보기」를 걸어 둔다.
    const token = await ensureShareToken(reading);
    if (token) links.report = readingShareUrl(token);
  }

  // 코드를 못 만들었으면 버튼 없이 보낸다 — 알림이 가는 편이 안 가는 것보다 낫다

  const result = await notify({ kind, to: reading.notifyPhone, variables, links });
  if (result.sent) {
    await getRepository().updateReading(reading.id, { notifiedKind: kind }).catch(() => undefined);
  }
}

import "server-only";

import { getRepository, type Reading } from "@/lib/db";
import { notify, TEMPLATES, type NotifyKind } from "@/lib/notify";
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
  let code: string | null = null;

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
        code = stored.token;
        links.report = readingShareUrl(stored.token);
        links.pdf = pdfShareUrl(stored.token);
      }
    } catch (error) {
      // PDF 를 못 구워도 "완성됐다"는 알림 자체는 보낸다. 보고서 화면에서 다시 받을 수 있다.
      console.error(`[notify] PDF 준비 실패 (reading ${reading.id})`, error);
    }
    // PDF 가 안 구워져도 코드는 있어야 버튼이 산다 — 보고서 화면만이라도 열어 준다
    if (!code) {
      code = await ensureShareToken(reading);
      if (code) links.report = readingShareUrl(code);
    }
  } else {
    // 시작 알림에는 PDF 가 아직 없다. 코드만 미리 발급해 「진행 상황 보기」를 걸어 둔다.
    code = await ensureShareToken(reading);
    if (code) links.report = readingShareUrl(code);
  }

  // 버튼 주소에 박힌 변수를 채운다.
  //
  // 이걸 빼먹으면 카카오가 `…/v/#{코드}` 를 그대로 내보내고, `#` 뒤는 프래그먼트로 먹혀
  // 실제로는 `/v/` 가 눌린다. 거기는 404 다 — 글은 멀쩡히 가고 링크만 죽으니
  // 발송 로그를 봐도 성공으로만 보인다.
  //
  // 코드를 못 만들었을 때는 아무 코드나 넣는 대신 `library` 를 넣는다. 모르는 코드는
  // 보관함으로 돌려보내므로, 404 대신 "여기 네 보고서들" 화면에 닿는다.
  variables[TEMPLATES[kind].linkVariable] = code ?? "library";

  const result = await notify({ kind, to: reading.notifyPhone, variables, links });
  if (result.sent) {
    await getRepository().updateReading(reading.id, { notifiedKind: kind }).catch(() => undefined);
  }
}

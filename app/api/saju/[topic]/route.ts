import { NextResponse } from "next/server";
import { getCurrentUser, loginUrl } from "@/lib/auth/session";
import { getRepository } from "@/lib/db";
import { jsonError, toErrorResponse } from "@/lib/errors";
import { getReport } from "@/lib/reports/catalog";
import { getSazuClient, isSazuTopic, type SazuRequest, type SazuTopic } from "@/lib/sazu";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** 무료 콘텐츠(오늘의 운세·만세력)에 쓰는 토픽은 구매 없이 호출 가능 */
const FREE_TOPICS = new Set<SazuTopic>(["manse", "today"]);

// POST /api/saju/:topic — body: sazu 입력 + (유료 토픽이면) reportSlug
export async function POST(request: Request, { params }: { params: { topic: string } }) {
  if (!isSazuTopic(params.topic)) return jsonError(404, "UNKNOWN_TOPIC", "지원하지 않는 풀이 주제예요.");
  const topic: SazuTopic = params.topic;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, "INVALID_JSON", "요청 형식이 올바르지 않아요.");
  }

  if (!FREE_TOPICS.has(topic)) {
    const slug = typeof body.reportSlug === "string" ? body.reportSlug : "";
    const user = await getCurrentUser();
    if (!user) {
      return jsonError(401, "LOGIN_REQUIRED", "로그인이 필요해요.", { loginUrl: loginUrl(`/reports/${slug}`) });
    }
    const report = getReport(slug);
    if (!report || !(report.topics as readonly SazuTopic[]).includes(topic)) {
      return jsonError(400, "REPORT_MISMATCH", "이 풀이 주제와 맞는 리포트가 아니에요.");
    }
    const purchase = await getRepository().getPurchase(user.id, report.slug);
    if (!purchase) {
      return jsonError(402, "PAYMENT_REQUIRED", "리포트를 구매한 뒤 열람할 수 있어요.", {
        checkoutUrl: `/checkout/${report.slug}`,
      });
    }
  }

  try {
    // 입력 검증은 sazu 클라이언트 내부 zod 스키마가 수행하고, reportSlug 같은 추가 필드는 제거된다.
    const result = await getSazuClient().request(topic, body as SazuRequest<SazuTopic>);
    return NextResponse.json({ data: result.data, meta: result.meta });
  } catch (error) {
    return toErrorResponse(error);
  }
}

import { NextResponse } from "next/server";
import { AppError, jsonError, toErrorResponse } from "@/lib/errors";
import { buildManseTopics } from "@/lib/manse";
import { buildHomeChart } from "@/lib/manse/home-chart";
import { birthProfileSchema } from "@/lib/readings/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/manse/chart — 로그인도 결제도 없이 내 원국을 펼쳐 준다.
 *
 * 첫 화면에서 쓴다. 생년월일을 한 번이라도 적은 사람에게 상품 목록만 또 보여 줄 이유가
 * 없다 — 그 사람의 여덟 글자는 우리가 바로 계산할 수 있다.
 *
 * 가장 힘이 실리는 달은 계산해 두고 가린 채 돌려준다. 가린 값은 응답에 아예 넣지 않는다.
 * 화면에서 가리기만 하면 개발자 도구를 열어 본 사람에게는 공짜로 보이기 때문이다.
 */
export async function POST(request: Request) {
  const parsed = birthProfileSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError(400, "VALIDATION_ERROR", "입력하신 정보를 다시 확인해 주세요.");

  try {
    let sazu;
    try {
      sazu = buildManseTopics(["today"], parsed.data, null);
    } catch (error) {
      console.error("[manse] 첫 화면 명식 계산 실패", error);
      throw new AppError(400, "MANSE_FAILED", "생년월일시를 다시 확인해 주세요.");
    }
    return NextResponse.json(buildHomeChart(sazu, parsed.data.name));
  } catch (error) {
    return toErrorResponse(error);
  }
}

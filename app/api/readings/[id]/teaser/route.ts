import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getRepository } from "@/lib/db";
import { jsonError, toErrorResponse } from "@/lib/errors";
import { buildManseTopics } from "@/lib/manse";
import { teaserFacts, writeTeaserScenes } from "@/lib/manse/teaser-ai";
import { mergedModules } from "@/lib/sazu/readings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * POST /api/readings/:id/teaser — 결제 전 화면의 "맞혀 보이는" 장면을 AI 가 쓴다.
 *
 * 본인 풀이에서만 부를 수 있다. 열어 두면 누구나 돌릴 수 있는 공짜 AI 창구가 된다.
 *
 * 화면은 이걸 기다리지 않는다. 먼저 표에 있는 문장으로 그려 두고, 받으면 바꿔 끼운다.
 * 그래서 여기서 늦거나 실패해도 손님 화면은 멀쩡하다.
 */
export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return jsonError(401, "LOGIN_REQUIRED", "로그인이 필요해요.");

  try {
    const reading = await getRepository().getReading(params.id);
    if (!reading || reading.userId !== user.id) {
      return jsonError(404, "READING_NOT_FOUND", "풀이를 찾을 수 없어요.");
    }

    // 초안에는 manse 한 토픽만 저장돼 있다. 없으면 그 자리에서 셈한다(AI 도 저장소도 아니다).
    const sazu = reading.sazu?.today ? reading.sazu : { ...(reading.sazu ?? {}), ...buildManseTopics(["today"], reading.subject, reading.partner) };
    const facts = teaserFacts(mergedModules(sazu), reading.subject.name);

    const scenes = await writeTeaserScenes(facts);
    return NextResponse.json({ scenes: scenes ?? null });
  } catch (error) {
    return toErrorResponse(error);
  }
}

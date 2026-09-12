import { getCurrentUser } from "@/lib/auth/session";
import { jsonError, toErrorResponse } from "@/lib/errors";
import { startOrAttachGeneration } from "@/lib/readings/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const STREAM_HEADERS = {
  "content-type": "text/plain; charset=utf-8",
  "cache-control": "no-store",
  "x-accel-buffering": "no",
};

// POST /api/readings/:id/generate — 이야기 대본 JSON 을 텍스트 스트림으로 흘려보낸다(useObject 가 부분 파싱)
export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return jsonError(401, "LOGIN_REQUIRED", "로그인이 필요해요.");

  try {
    const result = await startOrAttachGeneration(user, params.id);
    switch (result.kind) {
      case "ready":
        return new Response(JSON.stringify(result.report), { headers: STREAM_HEADERS });
      case "stream":
        return new Response(result.stream, { headers: STREAM_HEADERS });
      case "busy":
        return jsonError(409, "GENERATING", "다른 화면에서 풀이를 쓰고 있어요. 잠시만 기다려 주세요.");
    }
  } catch (error) {
    return toErrorResponse(error);
  }
}

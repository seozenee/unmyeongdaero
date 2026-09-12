import { NextResponse } from "next/server";
import { AppError, jsonError, toErrorResponse } from "@/lib/errors";
import { buildFreeInsight, FREE_KINDS, type FreeKind } from "@/lib/free/insights";
import { birthProfileSchema } from "@/lib/readings/schema";
import { SazuApiError } from "@/lib/sazu/errors";
import { fetchSazuForProfiles } from "@/lib/sazu/readings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/free/:kind — 로그인·결제 없는 무료 콘텐츠
export async function POST(request: Request, { params }: { params: { kind: string } }) {
  if (!(FREE_KINDS as readonly string[]).includes(params.kind)) return jsonError(404, "NOT_FOUND", "찾을 수 없는 콘텐츠예요.");
  const kind = params.kind as FreeKind;

  const parsed = birthProfileSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError(400, "VALIDATION_ERROR", "입력하신 정보를 다시 확인해 주세요.");

  try {
    const sazu = await fetchSazuForProfiles(kind === "today" ? ["today"] : [], parsed.data, null).catch((error) => {
      if (error instanceof SazuApiError && error.code === "SAMPLE_PROFILE_REQUIRED") {
        throw new AppError(400, error.code, "지금은 체험용 분석 키라 샘플 명식으로만 볼 수 있어요. 입력 칸 위의 샘플을 골라 주세요.");
      }
      throw error;
    });
    return NextResponse.json(buildFreeInsight(kind, sazu));
  } catch (error) {
    return toErrorResponse(error);
  }
}

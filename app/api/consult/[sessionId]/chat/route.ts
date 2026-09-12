import { createUIMessageStream, createUIMessageStreamResponse, generateId, type UIMessage } from "ai";
import { claudeBaseParams, getAnthropic } from "@/lib/ai/anthropic";
import { getCurrentUser } from "@/lib/auth/session";
import { buildTemplateConsultReply } from "@/lib/consult/template";
import { ensureSessionSazu, getOwnedSession } from "@/lib/consult/service";
import { getRepository } from "@/lib/db";
import { modes } from "@/lib/env";
import { jsonError, toErrorResponse } from "@/lib/errors";
import { buildConsultSystemPrompt } from "@/lib/story/prompts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const MAX_QUESTION_LENGTH = 1000;
const REFUSAL_REPLY = "이 질문은 제가 답하기 어려워요. 다른 방향으로 한 번 더 물어봐 주시겠어요?";

function lastUserText(messages: UIMessage[] | undefined) {
  const last = messages?.at(-1);
  if (!last || last.role !== "user") return "";
  return last.parts
    .map((part) => (part.type === "text" ? part.text : ""))
    .join("")
    .trim();
}

// POST /api/consult/:sessionId/chat — useChat(DefaultChatTransport) 호환 UI 메시지 스트림.
// 대화 기록은 클라이언트가 보낸 목록이 아니라 DB 에 저장된 기록을 기준으로 삼는다.
export async function POST(request: Request, { params }: { params: { sessionId: string } }) {
  const user = await getCurrentUser();
  if (!user) return jsonError(401, "LOGIN_REQUIRED", "로그인이 필요해요.");

  const body = (await request.json().catch(() => null)) as { messages?: UIMessage[] } | null;
  const question = lastUserText(body?.messages);
  if (!question) return jsonError(400, "VALIDATION_ERROR", "질문을 입력해 주세요.");
  if (question.length > MAX_QUESTION_LENGTH) {
    return jsonError(400, "VALIDATION_ERROR", `질문은 ${MAX_QUESTION_LENGTH}자 이내로 적어 주세요.`);
  }

  const repo = getRepository();
  let session;
  let sazu;
  let history;
  try {
    session = await getOwnedSession(user, params.sessionId);
    sazu = await ensureSessionSazu(session);
    history = await repo.listConsultMessages(session.id);
  } catch (error) {
    return toErrorResponse(error);
  }

  const remaining = await repo.consumeConsultTurn(session.id, user.id);
  if (remaining === null) {
    return jsonError(402, "TURNS_EXHAUSTED", "이번 상담 세션의 20턴을 모두 사용했어요.", { checkoutUrl: "/consult" });
  }
  await repo.addConsultMessage({ sessionId: session.id, role: "user", content: question });

  const today = new Date().toISOString().slice(0, 10);
  const sessionId = session.id;
  const subjectName = session.subject.name;
  const turnIndex = session.turnsUsed;
  const systemPrompt = buildConsultSystemPrompt(session, sazu, today);

  const stream = createUIMessageStream({
    async execute({ writer }) {
      let textId = generateId();
      let answer = "";
      writer.write({ type: "text-start", id: textId });

      try {
        if (modes.ai() === "anthropic") {
          const claude = getAnthropic().beta.messages.stream({
            ...claudeBaseParams(),
            max_tokens: 8000,
            output_config: { effort: "medium" },
            system: [{ type: "text", text: systemPrompt, cache_control: { type: "ephemeral" } }],
            messages: [
              ...history.map((message) => ({ role: message.role, content: message.content })),
              { role: "user" as const, content: question },
            ],
          });
          for await (const event of claude) {
            if (event.type === "content_block_start" && event.content_block.type === "fallback") {
              // 폴백이 일어나면 앞서 흘린 부분은 무효 → 텍스트 파트를 새로 시작한다
              writer.write({ type: "text-end", id: textId });
              textId = generateId();
              answer = "";
              writer.write({ type: "text-start", id: textId });
            }
            if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
              answer += event.delta.text;
              writer.write({ type: "text-delta", id: textId, delta: event.delta.text });
            }
          }
          const final = await claude.finalMessage();
          if (final.stop_reason === "refusal") {
            answer = REFUSAL_REPLY;
            writer.write({ type: "text-delta", id: textId, delta: `\n\n${REFUSAL_REPLY}` });
          }
        } else {
          answer = buildTemplateConsultReply(sazu, subjectName, turnIndex);
          for (let index = 0; index < answer.length; index += 6) {
            writer.write({ type: "text-delta", id: textId, delta: answer.slice(index, index + 6) });
            await new Promise((resolve) => setTimeout(resolve, 20));
          }
        }
        writer.write({ type: "text-end", id: textId });
        await repo.addConsultMessage({ sessionId, role: "assistant", content: answer.trim() || REFUSAL_REPLY });
      } catch (error) {
        await repo.refundConsultTurn(sessionId, user.id).catch(() => undefined);
        throw error;
      }
    },
    onError(error) {
      console.error(`[consult ${sessionId}] 답변 생성 실패`, error);
      return "답변을 만드는 중 문제가 생겼어요. 이번 질문은 턴에서 차감되지 않았어요. 다시 보내 주세요.";
    },
  });

  return createUIMessageStreamResponse({ stream, headers: { "x-turns-remaining": String(remaining) } });
}

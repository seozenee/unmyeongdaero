"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { TypingIndicator } from "@/components/story/Bubbles";
import { GuideAvatar } from "@/components/story/GuideAvatar";
import { Icon } from "@/components/ui/Icon";
import { formatKRW } from "@/lib/format";
import { getReport } from "@/lib/reports/catalog";
import { getGuide } from "@/lib/story/guides";

interface ConsultChatProps {
  sessionId: string;
  subjectName: string;
  turnLimit: number;
  turnsUsed: number;
  templateMode: boolean;
  initialMessages: UIMessage[];
}

const SUGGESTIONS = ["요즘 일이 잘 안 풀리는 이유가 궁금해요", "올해 연애 흐름은 어떤가요?", "지금 이직해도 괜찮을까요?"];

const textOf = (message: UIMessage) =>
  message.parts.map((part) => (part.type === "text" ? part.text : "")).join("");

function parseErrorCode(error: Error | undefined) {
  if (!error) return null;
  try {
    return (JSON.parse(error.message) as { error?: { code?: string; message?: string } }).error ?? null;
  } catch {
    return { message: error.message };
  }
}

export function ConsultChat({ sessionId, subjectName, turnLimit, turnsUsed, templateMode, initialMessages }: ConsultChatProps) {
  const guide = getGuide("seoha");
  const product = getReport("consult")!;
  const [input, setInput] = useState("");
  const [used, setUsed] = useState(turnsUsed);
  const bottomRef = useRef<HTMLDivElement>(null);

  const transport = useMemo(() => new DefaultChatTransport({ api: `/api/consult/${sessionId}/chat` }), [sessionId]);
  const { messages, sendMessage, status, error, clearError } = useChat({
    id: sessionId,
    messages: initialMessages,
    transport,
    onError: () => setUsed((value) => Math.max(value - 1, turnsUsed)), // 실패한 질문은 서버에서 턴이 복구된다
  });

  const remaining = Math.max(turnLimit - used, 0);
  const busy = status === "submitted" || status === "streaming";
  const errorInfo = parseErrorCode(error);
  const exhausted = remaining === 0 || errorInfo?.code === "TURNS_EXHAUSTED";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, status]);

  const send = (text: string) => {
    const question = text.trim();
    if (!question || busy || exhausted) return;
    clearError();
    setUsed((value) => value + 1);
    setInput("");
    void sendMessage({ text: question });
  };

  return (
    <div className="flex w-full flex-col pb-28">
      <header className="sticky top-16 z-40 -mx-margin flex items-center gap-space-sm bg-surface/90 px-margin py-space-sm backdrop-blur-xl">
        <GuideAvatar guide={guide} size="sm" />
        <div className="flex flex-1 flex-col">
          <span className="font-label-md text-label-md text-on-surface">{guide.title}</span>
          <span className="font-label-sm text-label-sm text-outline">{subjectName}님의 명식으로 상담 중</span>
        </div>
        <span className="rounded-full bg-surface-container-high px-space-sm py-1 font-label-sm text-label-sm text-on-surface">
          남은 질문 <strong className={remaining <= 3 ? "text-secondary" : "text-primary"}>{remaining}</strong>/{turnLimit}
        </span>
      </header>

      {templateMode && (
        <p className="mt-space-sm rounded-lg bg-tertiary/10 p-space-sm font-label-sm text-label-sm text-tertiary">
          AI 연결 전 개발 모드 · 명식 문장으로 만든 예시 답변이 나와요.
        </p>
      )}

      <div className="mt-space-md flex flex-col gap-space-md">
        {messages.length === 0 && (
          <div className="flex flex-col gap-space-sm motion-safe:animate-fade-up">
            <div className="flex items-start gap-space-sm">
              <GuideAvatar guide={guide} size="sm" />
              <p className="max-w-[84%] rounded-2xl rounded-tl-md bg-surface-container-high px-space-md py-2.5 font-body-md text-body-md text-on-surface">
                {subjectName}님, 편하게 물어봐요. 명식에 적힌 근거로 차분히 짚어 드릴게요.
              </p>
            </div>
            <div className="flex flex-wrap justify-end gap-space-xs">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => send(suggestion)}
                  className="rounded-full bg-surface-container-high px-space-md py-2 font-label-sm text-label-sm text-on-surface ring-1 ring-outline-variant hover:ring-primary/60"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message, index) => {
          const text = textOf(message);
          if (message.role === "user") {
            return (
              <div key={message.id} className="flex justify-end motion-safe:animate-fade-up">
                <p className="max-w-[80%] whitespace-pre-line rounded-2xl rounded-tr-md bg-primary/20 px-space-md py-2.5 font-body-md text-body-md text-on-surface">
                  {text}
                </p>
              </div>
            );
          }
          const streaming = status === "streaming" && index === messages.length - 1;
          const showName = messages[index - 1]?.role !== "assistant";
          return (
            <div key={message.id} className="flex items-start gap-space-sm motion-safe:animate-fade-up">
              <GuideAvatar guide={guide} size="sm" className={showName ? undefined : "invisible"} />
              <div className="flex max-w-[84%] flex-col gap-1">
                {showName && <span className="font-label-sm text-label-sm text-on-surface-variant">{guide.name}</span>}
                <p className="whitespace-pre-line rounded-2xl rounded-tl-md bg-surface-container-high px-space-md py-2.5 font-body-md text-body-md leading-relaxed text-on-surface">
                  {text}
                  {streaming && <span className="ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 bg-primary motion-safe:animate-dot-blink" />}
                </p>
                <span className="flex items-center gap-1 pl-1 font-label-sm text-[10px] leading-4 text-outline">
                  <Icon name="info" className="text-[12px]" /> 참고용 콘텐츠입니다
                </span>
              </div>
            </div>
          );
        })}

        {status === "submitted" && <TypingIndicator guide={guide} />}

        {error && !exhausted && (
          <p role="alert" className="rounded-lg bg-error-container/30 p-space-sm font-body-sm text-body-sm text-on-surface">
            {errorInfo?.message ?? "답변을 받지 못했어요. 이번 질문은 차감되지 않았으니 다시 보내 주세요."}
          </p>
        )}

        {exhausted && (
          <div className="flex flex-col gap-space-sm rounded-xl bg-surface-container-low p-space-lg motion-safe:animate-fade-up">
            <span className="font-label-md text-label-md text-secondary">이번 세션의 질문 {turnLimit}개를 모두 사용했어요</span>
            <p className="font-body-sm text-body-sm text-on-surface-variant">대화 기록은 보관함에 남아 있어요. 더 이야기하고 싶다면 새 세션을 열어 주세요.</p>
            <Link
              href="/consult"
              className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-secondary-container to-secondary py-3.5 font-label-md text-label-md text-on-secondary"
            >
              새 상담 세션 {formatKRW(product.price)} <Icon name="arrow_forward" className="text-[18px]" />
            </Link>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {!exhausted && (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            send(input);
          }}
          className="pb-safe fixed inset-x-0 bottom-16 z-40 bg-surface/95 backdrop-blur-xl"
        >
          <div className="mx-auto flex max-w-md items-end gap-space-xs px-margin py-space-sm">
            <textarea
              value={input}
              rows={1}
              maxLength={1000}
              placeholder="서하에게 물어보기"
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                  event.preventDefault();
                  send(input);
                }
              }}
              className="max-h-32 min-h-[44px] flex-1 resize-none rounded-2xl border border-outline-variant/60 bg-surface-container-lowest px-space-md py-2.5 font-body-md text-body-md text-on-surface outline-none focus:border-primary"
            />
            <button
              type="submit"
              aria-label="보내기"
              disabled={busy || !input.trim()}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary disabled:opacity-40"
            >
              <Icon name="arrow_upward" className="text-[22px]" />
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

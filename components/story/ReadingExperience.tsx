"use client";

import { experimental_useObject as useObject } from "@ai-sdk/react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ReportDocument, type ReportPanels } from "@/components/report/ReportDocument";
import { GuideBubble, NarrationLine, TypingIndicator } from "@/components/story/Bubbles";
import { Icon } from "@/components/ui/Icon";
import { CaptionBox, SfxText } from "@/components/webtoon/ComicText";
import { WebtoonMedia } from "@/components/webtoon/WebtoonMedia";
import { getWebtoonAsset } from "@/components/webtoon/assets";
import type { ReadingStatus } from "@/lib/db/types";
import type { BasisFact } from "@/lib/saju/basis";
import { getGuide, type GuideId } from "@/lib/story/guides";
import { isCompleteReport, storyReportSchema, type PartialStoryReport, type StoryReport } from "@/lib/story/report";
import { josa } from "@/lib/text/josa";

interface ReadingExperienceProps {
  readingId: string;
  guideId: GuideId;
  categoryLabel: string;
  title: string;
  chapters: readonly string[];
  subjectName: string;
  partnerName: string | null;
  issuedAt: string;
  initialStatus: ReadingStatus;
  initialReport: StoryReport | null;
  initialError: string | null;
  panels: ReportPanels;
  basisFacts: BasisFact[];
  glossary: Record<string, string>;
  disclaimer?: string;
  sample: boolean;
  templateMode: boolean;
}

function useLoadingLines(guideName: string) {
  const lines = [
    "입력해 주신 명식을 꼼꼼히 펼쳐 보고 있어요.",
    `${josa(guideName, "이/가")} 글자 하나하나의 기운을 짚고 있어요.`,
    "답해 주신 이야기와 명식을 한 줄씩 맞춰 보고 있어요.",
    "잠시 화면을 닫아도 괜찮아요. 완성된 풀이는 보관함에 남아요.",
  ];
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => setIndex((value) => (value + 1) % lines.length), 3600);
    return () => window.clearInterval(timer);
  }, [lines.length]);
  return lines[index]!;
}

export function ReadingExperience(props: ReadingExperienceProps) {
  const guide = getGuide(props.guideId);
  const stripAsset = getWebtoonAsset(guide.id, "intro-4");
  const coverAsset = getWebtoonAsset(guide.id, "report-cover");
  const [finalReport, setFinalReport] = useState<StoryReport | null>(props.initialReport);
  const [failure, setFailure] = useState<string | null>(props.initialStatus === "failed" ? props.initialError : null);
  // 다시 눌러서 풀릴 실패인지. 모르면 지금까지처럼 재시도를 보여 준다.
  const [canRetry, setCanRetry] = useState(true);
  const [polling, setPolling] = useState(false);
  const [view, setView] = useState<"chat" | "report">(props.initialReport ? "report" : "chat");
  const [cursor, setCursor] = useState(0);
  const [skipSignal, setSkipSignal] = useState(0);
  const startedRef = useRef(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const loadingLine = useLoadingLines(guide.name);

  /**
   * PDF 내려받기.
   *
   * 브라우저 인쇄가 아니라 서버에서 구운 파일을 받는다. 인쇄는 페이지 경계를 제어할 수 없어
   * 표가 반으로 잘리고, 모바일 카카오톡 브라우저에서는 아예 인쇄창이 뜨지 않는다.
   */
  const [downloading, setDownloading] = useState(false);
  const downloadPdf = useCallback(async () => {
    setDownloading(true);
    try {
      const response = await fetch(`/api/readings/${props.readingId}/pdf`, { cache: "no-store" });

      // 서버가 왜 안 됐는지 말해 주면 그대로 보여 준다.
      //
      // 전에는 응답을 보지 않고 한 문장으로 덮었다. "문제가 생겼어요"만 남으니 손님은
      // 다시 눌러 볼 수밖에 없고, 우리도 로그인이 풀린 것인지 풀이가 덜 된 것인지
      // 서버가 터진 것인지 알 수 없었다. 같은 신고를 세 번 받고도 원인을 못 찾은 이유다.
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as
          | { error?: { code?: string; message?: string } }
          | null;
        const code = body?.error?.code;
        setFailure(
          body?.error?.message ??
            (code ? `PDF 를 만들지 못했어요. (${code})` : `PDF 를 만들지 못했어요. (${response.status})`),
        );
        return;
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${props.title}.pdf`;
      link.click();
      // 곧바로 지우면 내려받기가 시작되기 전에 취소되는 브라우저가 있다
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    } catch (error) {
      // 여기까지 오는 것은 네트워크가 끊긴 경우다 — 서버는 아무 말도 하지 않았다
      console.error("[pdf] 내려받기 실패", error);
      setFailure("연결이 끊겼어요. 잠시 뒤 다시 시도해 주세요.");
    } finally {
      setDownloading(false);
    }
  }, [props.readingId, props.title]);

  const refreshStatus = useCallback(async () => {
    const response = await fetch(`/api/readings/${props.readingId}`, { cache: "no-store" });
    if (!response.ok) return null;
    const body = (await response.json()) as {
      status: ReadingStatus;
      error: string | null;
      errorRetryable?: boolean;
      script: unknown;
    };
    if (body.status === "ready" && isCompleteReport(body.script)) {
      setFinalReport(body.script);
      setPolling(false);
    } else if (body.status === "failed") {
      setFailure(body.error ?? "풀이를 쓰는 중 문제가 생겼어요.");
      setCanRetry(body.errorRetryable !== false);
      setPolling(false);
    }
    return body.status;
  }, [props.readingId]);

  const { object, submit, isLoading } = useObject({
    api: `/api/readings/${props.readingId}/generate`,
    schema: storyReportSchema,
    onFinish: () => {
      void refreshStatus().then((status) => {
        if (status === "generating") setPolling(true);
      });
    },
    onError: () => setPolling(true),
  });

  const start = useCallback(() => {
    setFailure(null);
    setCursor(0);
    setView("chat");
    submit({});
  }, [submit]);

  useEffect(() => {
    if (startedRef.current || props.initialReport) return;
    startedRef.current = true;
    start();
  }, [props.initialReport, start]);

  useEffect(() => {
    if (!polling) return;
    const timer = window.setInterval(() => void refreshStatus(), 3000);
    return () => window.clearInterval(timer);
  }, [polling, refreshStatus]);

  const partial = (finalReport ?? object) as PartialStoryReport | undefined;
  const beats = (partial?.briefing ?? []).filter((beat): beat is { speaker?: "guide" | "narration"; text: string } => Boolean(beat?.text));
  const briefingDone = Boolean(finalReport) || Boolean(partial?.headline);
  const currentStreaming = !briefingDone && cursor === beats.length - 1;
  const briefingShown = briefingDone && cursor >= beats.length;

  /**
   * 다음 말로.
   *
   * 한 줄이 다 찍히면 0.9초 뒤에 저절로 넘어갔다. 읽는 속도는 사람마다 다른데 넘어가는
   * 속도는 하나였으니, 느리게 읽는 사람은 늘 놓치고 빠르게 읽는 사람은 늘 기다렸다.
   * 돈을 내고 받은 글인데 되감을 수도 없었다.
   *
   * 이제 누를 때까지 머문다. 아직 쓰는 중인 마지막 줄만 다 찍히면 저절로 이어진다 —
   * 글이 흘러나오는 동안까지 손가락을 쓰게 할 이유는 없다.
   */
  const advance = useCallback(() => setCursor((value) => value + 1), []);
  const [awaiting, setAwaiting] = useState(false);
  const onBeatTyped = useCallback(() => setAwaiting(true), []);
  const next = useCallback(() => {
    setAwaiting(false);
    advance();
  }, [advance]);

  useEffect(() => {
    if (view === "chat") bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [cursor, beats.length, briefingShown, finalReport, view]);

  const sectionsProgress = (partial?.sections ?? []).map((section) => ({
    title: section?.title,
    done: Boolean(section?.evidence && section.evidence.length > 0),
  }));

  if (view === "report" && finalReport) {
    return (
      <div className="flex w-full flex-col">
        <div className="sticky top-16 z-40 -mx-margin flex items-center justify-between bg-surface/90 px-margin py-space-sm backdrop-blur-xl print:hidden">
          <button
            type="button"
            onClick={() => {
              setCursor(0);
              setView("chat");
              window.scrollTo({ top: 0 });
            }}
            className="flex items-center gap-1 font-label-md text-label-md text-on-surface-variant"
          >
            <Icon name="forum" className="text-[18px]" /> 대화로 다시 보기
          </button>
          <div className="flex items-center gap-space-md">
            <button
              type="button"
              onClick={downloadPdf}
              disabled={downloading}
              className="flex items-center gap-1 font-label-md text-label-md text-on-surface-variant disabled:opacity-60"
            >
              <Icon name={downloading ? "hourglass_top" : "download"} className="text-[18px]" />
              {downloading ? "만드는 중…" : "PDF 내려받기"}
            </button>
            <Link href="/library" className="flex items-center gap-1 font-label-md text-label-md text-on-surface-variant">
              <Icon name="auto_stories" className="text-[18px]" /> 보관함
            </Link>
          </div>
        </div>
        {(props.sample || props.templateMode) && <DevNotice sample={props.sample} templateMode={props.templateMode} />}
        <ReportDocument
          report={finalReport}
          guide={guide}
          categoryLabel={props.categoryLabel}
          title={props.title}
          subjectName={props.subjectName}
          partnerName={props.partnerName}
          issuedAt={props.issuedAt}
          panels={props.panels}
          basisFacts={props.basisFacts}
          glossary={props.glossary}
          disclaimer={props.disclaimer}
        />
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-space-md pb-space-xl" onClick={() => setSkipSignal((value) => value + 1)}>
      {/* 장면 띠 */}
      <section className="relative -mx-margin h-52 overflow-hidden">
        {stripAsset && <WebtoonMedia asset={stripAsset} />}
        <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/40 to-transparent" />
        <div className="absolute bottom-space-md left-margin flex max-w-[62%] flex-col gap-1">
          <span className="font-label-sm text-label-sm text-secondary">{props.categoryLabel}</span>
          <h1 className="font-headline-md text-headline-md text-on-surface">{props.title}</h1>
        </div>
      </section>

      {(props.sample || props.templateMode) && <DevNotice sample={props.sample} templateMode={props.templateMode} />}

      {beats.length === 0 && !failure && (
        <div className="flex flex-col items-center gap-space-md rounded-xl bg-surface-container p-space-xl text-center motion-safe:animate-fade-in">
          <TypingIndicator guide={guide} />
          <p key={loadingLine} className="font-body-md text-body-md text-on-surface-variant motion-safe:animate-fade-in">
            {loadingLine}
          </p>
          <ol className="flex w-full flex-col gap-1 text-left">
            {props.chapters.map((chapter, index) => (
              <li key={chapter} className="font-label-sm text-label-sm text-outline">
                {String(index + 1).padStart(2, "0")} · {chapter}
              </li>
            ))}
          </ol>
        </div>
      )}

      {/*
        화면을 누르면 — 찍히는 중이면 한 번에 다 보여 주고, 다 찍혔으면 다음으로.
        전에는 "화면을 누르면 빠르게 넘어가요"라고 적어 두고 정작 누르는 자리를 만들지
        않았다. skipSignal 을 올리는 곳이 어디에도 없었다 — 눌러 본 사람에게는 고장 난
        화면이다.
      */}
      <div
        className="flex flex-col gap-space-md"
        onClick={() => {
          if (briefingShown || beats.length === 0) return;
          if (awaiting) next();
          else setSkipSignal((value) => value + 1);
        }}
      >
        {beats.slice(0, cursor + 1).map((beat, index) => {
          const animate = index === cursor;
          const streaming = animate && currentStreaming;
          if (beat.speaker === "narration") {
            return (
              <NarrationLine
                key={index}
                text={beat.text}
                animate={animate}
                streaming={streaming}
                onTyped={animate ? (streaming ? advance : onBeatTyped) : undefined}
                skipSignal={animate ? skipSignal : 0}
              />
            );
          }
          return (
            <GuideBubble
              key={index}
              guide={guide}
              text={beat.text}
              showName={index === 0 || beats[index - 1]?.speaker === "narration"}
              animate={animate}
              streaming={streaming}
              onTyped={animate ? (streaming ? advance : onBeatTyped) : undefined}
              skipSignal={animate ? skipSignal : 0}
            />
          );
        })}
        {beats.length > 0 && !briefingDone && cursor >= beats.length && <TypingIndicator guide={guide} />}
      </div>

      {briefingShown && !failure && (
        finalReport ? (
          <section className="relative -mx-margin mt-space-md aspect-[4/3] overflow-hidden motion-safe:animate-fade-up">
            {coverAsset && <WebtoonMedia asset={coverAsset} />}
            <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/50 to-transparent" />
            <div className="absolute right-margin top-space-lg">
              <SfxText rotate={-12}>촤르륵</SfxText>
            </div>
            <div className="absolute inset-x-0 bottom-0 flex flex-col gap-space-sm px-margin pb-space-lg">
              <CaptionBox>{josa(guide.name, "이/가")} 두루마리 보고서를 펼쳐 건넸다.</CaptionBox>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setView("report");
                  window.scrollTo({ top: 0 });
                }}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-on-surface py-3.5 font-label-md text-label-md text-surface shadow-lg motion-safe:animate-pop"
              >
                <Icon name="description" className="text-[18px]" /> 보고서 펼쳐 보기
              </button>
            </div>
          </section>
        ) : (
          <div className="flex flex-col gap-space-sm rounded-xl bg-surface-container p-space-lg motion-safe:animate-fade-up">
            <span className="flex items-center gap-1.5 font-label-md text-label-md text-on-surface">
              <Icon name="edit_note" className="text-[18px] text-tertiary" /> 보고서를 정리하고 있어요
            </span>
            <ul className="flex flex-col gap-1.5">
              {props.chapters.map((chapter, index) => {
                const progress = sectionsProgress[index];
                return (
                  <li key={chapter} className="flex items-center gap-space-sm font-body-sm text-body-sm">
                    <Icon
                      name={progress?.done ? "check_circle" : progress ? "progress_activity" : "radio_button_unchecked"}
                      className={progress?.done ? "text-[16px] text-tertiary" : progress ? "animate-spin text-[16px] text-primary" : "text-[16px] text-outline"}
                    />
                    <span className={progress ? "text-on-surface" : "text-outline"}>{chapter}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        )
      )}

      {!briefingShown && beats.length > 0 && !failure && (
        awaiting ? (
          <button
            type="button"
            onClick={next}
            className="mx-auto flex w-full max-w-xs items-center justify-center gap-1 rounded-xl bg-secondary py-3.5 font-label-md text-label-md font-bold text-on-secondary transition-transform active:scale-[0.98]"
          >
            다음
            <Icon name="arrow_forward" className="text-[18px]" />
          </button>
        ) : (
          <p className="text-center font-label-sm text-label-sm text-outline/70">화면을 누르면 한 번에 다 보여 드려요</p>
        )
      )}

      {failure && (
        <div className="flex flex-col gap-space-sm rounded-xl bg-error-container/25 p-space-lg motion-safe:animate-fade-up">
          <span className="flex items-center gap-1.5 font-label-md text-label-md text-error">
            <Icon name="error" className="text-[18px]" /> 풀이를 마저 쓰지 못했어요
          </span>
          <p className="font-body-sm text-body-sm text-on-surface">{failure}</p>
          <p className="font-label-sm text-label-sm text-outline">
            {canRetry
              ? "이미 결제한 열람권은 그대로 남아 있어요. 다시 시도해도 추가 결제는 없어요."
              : "이미 결제한 열람권은 그대로 남아 있어요. 준비되는 대로 다시 만들어 드릴게요."}
          </p>
          {canRetry ? (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                start();
              }}
              disabled={isLoading}
              className="rounded-xl bg-on-surface py-3 font-label-md text-label-md text-surface disabled:opacity-60"
            >
              다시 시도하기
            </button>
          ) : (
            <a
              href="http://pf.kakao.com/_YwTaX/chat"
              target="_blank"
              rel="noreferrer"
              className="rounded-xl bg-surface-container-highest py-3 text-center font-label-md text-label-md text-on-surface"
            >
              카카오톡으로 문의하기
            </a>
          )}
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}

function DevNotice({ sample, templateMode }: { sample: boolean; templateMode: boolean }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg bg-tertiary/10 p-space-sm font-label-sm text-label-sm text-tertiary print:hidden">
      {sample && <span>체험용 분석 키의 고정 샘플 명식으로 만든 풀이예요.</span>}
      {templateMode && <span>AI 연결 전 개발 모드 · Claude 대신 명리 데이터 문장을 규칙으로 엮은 보고서예요. ANTHROPIC_API_KEY 를 넣으면 AI 풀이로 바뀝니다.</span>}
    </div>
  );
}

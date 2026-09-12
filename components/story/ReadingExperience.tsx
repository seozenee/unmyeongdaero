"use client";

import { experimental_useObject as useObject } from "@ai-sdk/react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ReportDocument, type ReportPanels } from "@/components/report/ReportDocument";
import { GuideBubble, NarrationLine, TypingIndicator } from "@/components/story/Bubbles";
import { Icon } from "@/components/ui/Icon";
import { CaptionBox, SfxText } from "@/components/webtoon/ComicText";
import { GuideFigure } from "@/components/webtoon/GuideFigure";
import { SceneBackdrop } from "@/components/webtoon/SceneBackdrop";
import { getWebtoonAsset, WebtoonMedia } from "@/components/webtoon/WebtoonMedia";
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
  const [polling, setPolling] = useState(false);
  const [view, setView] = useState<"chat" | "report">(props.initialReport ? "report" : "chat");
  const [cursor, setCursor] = useState(0);
  const [skipSignal, setSkipSignal] = useState(0);
  const startedRef = useRef(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const loadingLine = useLoadingLines(guide.name);

  /** 인쇄(PDF 저장) 직전 준비: 접힌 부록을 펼치고, PDF 기본 파일명이 보고서 제목이 되게 한다 */
  const printReport = useCallback(() => {
    const previousTitle = document.title;
    const closed = Array.from(document.querySelectorAll<HTMLDetailsElement>("details:not([open])"));
    closed.forEach((element) => {
      element.open = true;
    });
    document.title = `${props.title} · 운명대로`;
    window.print();
    document.title = previousTitle;
    closed.forEach((element) => {
      element.open = false;
    });
  }, [props.title]);

  const refreshStatus = useCallback(async () => {
    const response = await fetch(`/api/readings/${props.readingId}`, { cache: "no-store" });
    if (!response.ok) return null;
    const body = (await response.json()) as { status: ReadingStatus; error: string | null; script: unknown };
    if (body.status === "ready" && isCompleteReport(body.script)) {
      setFinalReport(body.script);
      setPolling(false);
    } else if (body.status === "failed") {
      setFailure(body.error ?? "풀이를 쓰는 중 문제가 생겼어요.");
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

  const advance = useCallback(() => {
    window.setTimeout(() => setCursor((value) => value + 1), 420);
  }, []);

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
            <button type="button" onClick={printReport} className="flex items-center gap-1 font-label-md text-label-md text-on-surface-variant">
              <Icon name="download" className="text-[18px]" /> PDF 저장
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
        {stripAsset ? (
          <WebtoonMedia asset={stripAsset} />
        ) : (
          <>
            <SceneBackdrop theme={guide.id} camera="push" />
            <div className="absolute bottom-0 right-4 h-[92%] motion-safe:animate-fade-in">
              <GuideFigure guide={guide} />
            </div>
          </>
        )}
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

      <div className="flex flex-col gap-space-md">
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
                onTyped={animate ? advance : undefined}
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
              onTyped={animate ? advance : undefined}
              skipSignal={animate ? skipSignal : 0}
            />
          );
        })}
        {beats.length > 0 && !briefingDone && cursor >= beats.length && <TypingIndicator guide={guide} />}
      </div>

      {briefingShown && !failure && (
        finalReport ? (
          <section className="relative -mx-margin mt-space-md aspect-[4/3] overflow-hidden motion-safe:animate-fade-up">
            {coverAsset ? <WebtoonMedia asset={coverAsset} /> : <SceneBackdrop theme={guide.id} camera="wide" />}
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
        <p className="text-center font-label-sm text-label-sm text-outline/70">화면을 누르면 빠르게 넘어가요</p>
      )}

      {failure && (
        <div className="flex flex-col gap-space-sm rounded-xl bg-error-container/25 p-space-lg motion-safe:animate-fade-up">
          <span className="flex items-center gap-1.5 font-label-md text-label-md text-error">
            <Icon name="error" className="text-[18px]" /> 풀이를 마저 쓰지 못했어요
          </span>
          <p className="font-body-sm text-body-sm text-on-surface">{failure}</p>
          <p className="font-label-sm text-label-sm text-outline">이미 결제한 열람권은 그대로 남아 있어요. 다시 시도해도 추가 결제는 없어요.</p>
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

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BirthForm } from "@/components/story/BirthForm";
import { useTypewriter } from "@/components/story/useTypewriter";
import { STITCH_ASSETS } from "@/components/home/assets";
import { ProductIntro } from "@/components/story/ProductIntro";
import { Icon } from "@/components/ui/Icon";
import { SpeechBalloon, WhisperLines } from "@/components/webtoon/ComicText";
import { Stage, StageAction } from "@/components/webtoon/Stage";
import { useAmbientSound } from "@/components/webtoon/useAmbientSound";
import { WebtoonIntro } from "@/components/webtoon/WebtoonIntro";
import { cn } from "@/lib/cn";
import type { BirthProfile } from "@/lib/db/types";
import { formatKRW } from "@/lib/format";
import type { ReportProduct } from "@/lib/reports/catalog";
import { describeBirth, fillName } from "@/lib/story/format";
import { buildFunnel, type FunnelStep } from "@/lib/story/funnel";
import { getGuide } from "@/lib/story/guides";
import { josa } from "@/lib/text/josa";
import type { Camera, FigurePose, Place } from "@/lib/story/webtoon";

interface SavedState {
  cursor: number;
  subject: BirthProfile | null;
  partner: BirthProfile | null;
  answers: Record<string, string>;
}

interface Scene {
  place: Place;
  camera: Camera;
  figure: FigurePose;
  asset?: string;
  sfx?: string;
}

const storageKey = (slug: string) => `sazudaero:funnel2:${slug}`;
const BASE_SCENE: Scene = { place: "room", camera: "close", figure: "close", asset: "intro-5" };

function birthTitle(report: ReportProduct, target: "subject" | "partner") {
  const role = target === "subject" ? (report.roles?.subject ?? "self") : (report.roles?.partner ?? "lover");
  if (role === "child") return "아이의 정보";
  if (role === "parent") return "부모님(나)의 정보";
  return target === "subject" ? "나의 정보" : "그 사람의 정보";
}

/** 장면 위에 뜨는 안내자 말풍선. 한 글자씩 찍히고, 다 찍히면 다음 단계로 넘긴다. */
function TypedBalloon({ text, onTyped, skipSignal }: { text: string; onTyped: () => void; skipSignal: number }) {
  const typed = useTypewriter(text);
  const { skip, done } = typed;

  useEffect(() => {
    if (skipSignal) skip();
  }, [skipSignal, skip]);

  useEffect(() => {
    if (done) onTyped();
    // onTyped 는 매 렌더 새로 만들어질 수 있어 done 변화에만 반응한다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);

  return (
    <SpeechBalloon className="self-end" tail="bottom-right">
      {typed.text}
      {!done && <span className="ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 bg-inverse-on-surface motion-safe:animate-dot-blink" />}
    </SpeechBalloon>
  );
}

/** 방금 내가 한 말 — 장면 왼쪽 아래에 잠깐 남는다 */
function EchoLine({ text }: { text: string }) {
  return (
    <p className="max-w-[76%] self-start whitespace-pre-line rounded-2xl rounded-bl-md bg-surface-container-lowest/75 px-space-md py-2 font-body-sm text-body-sm text-on-surface-variant backdrop-blur motion-safe:animate-fade-up">
      {text}
    </p>
  );
}

function SheetCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="no-scrollbar max-h-[52vh] overflow-y-auto rounded-xl bg-surface-container-lowest/92 p-space-md shadow-2xl ring-1 ring-outline-variant/40 backdrop-blur-xl motion-safe:animate-fade-up">
      {children}
    </div>
  );
}

export function StoryFunnel({
  report,
  related = [],
  owned = false,
}: {
  report: ReportProduct;
  related?: ReportProduct[];
  /** 이미 이 풀이를 산 적이 있는가 — 다시 보러 온 사람에게 지름길을 준다 */
  owned?: boolean;
}) {
  const router = useRouter();
  const guide = getGuide(report.guide);
  const steps = useMemo(() => buildFunnel(report), [report]);
  const sound = useAmbientSound();

  // 처음 열면 상품 소개. 손님이 무엇을 받는지 보고 들어가게 한다.
  // (로그인하고 돌아온 경우에는 아래 복원 훅이 "chat" 으로 되돌린다)
  const [phase, setPhase] = useState<"intro" | "chat" | "closed">("closed");
  const [cursor, setCursor] = useState(0);
  const [scene, setScene] = useState<Scene>(BASE_SCENE);
  const [echo, setEcho] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [typing, setTyping] = useState(false);
  const [skipSignal, setSkipSignal] = useState(0);
  const [subject, setSubject] = useState<BirthProfile | null>(null);
  const [partner, setPartner] = useState<BirthProfile | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [detail, setDetail] = useState("");
  // 알림톡 받을 번호. 적지 않아도 되고, 적으면 다 쓴 뒤 카톡으로 알려 준다.
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const step: FunnelStep | undefined = steps[cursor];
  const name = subject?.name;

  // 로그인하고 돌아왔으면 입력 내용을 복원
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(storageKey(report.slug));
      if (!raw) return;
      const saved = JSON.parse(raw) as SavedState;
      setCursor(saved.cursor);
      setSubject(saved.subject);
      setPartner(saved.partner);
      setAnswers(saved.answers);
      setPhase("chat");
    } catch {
      // 저장소 접근 불가 → 처음부터
    }
  }, [report.slug]);

  const advance = useCallback(() => setCursor((value) => value + 1), []);

  // 웹툰 컷은 장면만 바꾸고 머문다. 넘기는 것은 손님이 정한다.
  useEffect(() => {
    if (phase !== "chat" || step?.kind !== "panel") return;
    setScene({ place: "room", camera: step.camera, figure: step.figure, asset: step.asset, sfx: step.sfx });
    setEcho(null);
  }, [phase, step]);

  /**
   * 다음으로.
   *
   * 전에는 대사가 다 찍히면 0.76초 뒤에, 컷은 2.6초 뒤에 저절로 넘어갔다. 읽는 속도는
   * 사람마다 다른데 넘어가는 속도는 하나였으니, 느리게 읽는 사람은 늘 놓치고 빠르게
   * 읽는 사람은 늘 기다렸다. 둘 다 불편했다.
   *
   * 이제 누를 때까지 머문다. 컷을 넘길 때는 화면을 한 번 흔들어 장면이 바뀌었음을
   * 보여 준다.
   */
  const next = useCallback(() => {
    if (step?.kind === "panel") {
      setScene((current) => ({ ...BASE_SCENE, camera: current.camera === "close" ? "wide" : "close" }));
    }
    advance();
  }, [advance, step]);

  const onTyped = useCallback(() => setTyping(false), []);

  useEffect(() => {
    if (step?.kind === "line") setTyping(true);
  }, [step]);

  const answer = (text: string) => {
    setEcho(text);
    advance();
  };

  /**
   * 한 걸음 되돌리기.
   *
   * 잘못 고른 것을 고치려면 처음부터 다시 하는 수밖에 없었다. 이름을 잘못 적었거나
   * 보기를 잘못 눌렀다고 전부 다시 적게 하는 것은 벌이지 안내가 아니다.
   *
   * 대사와 컷은 건너뛰고 "답한 걸음"으로만 돌아간다. 한 번 누르면 한 번 고친다 —
   * 대사 세 줄을 거슬러 올라가게 하면 되돌리기가 또 하나의 일이 된다.
   */
  const answerable = ["question", "birth", "detail", "reply"] as const;
  const previousAnswerStep = steps
    .slice(0, cursor)
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => (answerable as readonly string[]).includes(item.kind))
    .at(-1);

  const goBack = previousAnswerStep
    ? () => {
        setCursor(previousAnswerStep.index);
        setEcho(null);
        setNotice(null);
        setTyping(false);
      }
    : undefined;

  const jumpToBirth = (target: "subject" | "partner", message: string) => {
    const index = steps.findIndex((item) => item.kind === "birth" && item.target === target);
    setNotice(message);
    if (index >= 0) setCursor(index);
  };

  const submit = async () => {
    if (!subject) return;
    setSubmitting(true);
    setNotice(null);
    const payload = {
      slug: report.slug,
      subject,
      partner,
      answers: { ...answers, ...(detail.trim() ? { detail: detail.trim() } : {}) },
      notifyPhone: phone.trim() || null,
    };

    try {
      const response = await fetch("/api/readings", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await response.json();

      if (response.status === 401 && body.error?.loginUrl) {
        const saved: SavedState = { cursor, subject, partner, answers: payload.answers };
        sessionStorage.setItem(storageKey(report.slug), JSON.stringify(saved));
        window.location.href = body.error.loginUrl;
        return;
      }
      if (!response.ok) {
        const message: string = body.error?.message ?? "잠시 문제가 생겼어요. 다시 시도해 주세요.";
        if (body.error?.target === "subject" || body.error?.target === "partner") {
          jumpToBirth(body.error.target, message);
        } else {
          setNotice(message);
        }
        return;
      }

      sessionStorage.removeItem(storageKey(report.slug));
      router.push(body.redirect);
    } catch {
      setNotice("네트워크가 불안정해요. 다시 시도해 주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  // ─ 상품 소개 (스테이지를 닫았을 때 보이는 화면) ─
  // 상품 소개는 ProductIntro 가 그린다 — 상품마다 다른 포스터·문구·서체를 쓴다
  const detailPage = (
    <>
      {/*
        이미 산 사람에게는 지름길을 준다. 전에는 이 화면에 들어오면 곧장 결과로
        돌려보냈는데, 그러면 다시 사려는 사람은 들어올 수조차 없었다. 길을 막는 대신
        길을 하나 더 놓는다 — 보러 온 사람은 누르고, 또 사러 온 사람은 그냥 내려간다.
      */}
      {owned && (
        <Link
          href={`/reports/${report.slug}/read`}
          className="fixed inset-x-0 top-16 z-30 mx-auto flex w-full max-w-md items-center gap-space-sm border-b border-outline-variant/40 bg-surface-container/95 px-margin py-space-sm backdrop-blur"
        >
          <Icon name="auto_stories" className="text-[18px] text-secondary" />
          <span className="flex-1 font-label-md text-label-md text-on-surface">이미 받으신 풀이가 있어요</span>
          <span className="flex items-center gap-0.5 font-label-sm text-label-sm text-secondary">
            바로 읽기
            <Icon name="chevron_right" className="text-[16px]" />
          </span>
        </Link>
      )}
      <ProductIntro
        report={report}
        related={related}
        onStart={() => setPhase(cursor > 0 ? "chat" : "intro")}
        resuming={cursor > 0}
      />
    </>
  );

  if (phase === "closed") return detailPage;

  if (phase === "intro") {
    return (
      <>
        {detailPage}
        <WebtoonIntro report={report} onStart={() => setPhase("chat")} onClose={() => setPhase("closed")} />
      </>
    );
  }

  // ─ 대화 스테이지 ─
  const footer = (() => {
    if (step?.kind === "reply") {
      return <StageAction onClick={() => answer(step.text)}>{step.text}</StageAction>;
    }

    if (step?.kind === "birth") {
      return (
        <SheetCard>
          <BirthForm
            key={`${step.target}-${cursor}`}
            title={birthTitle(report, step.target)}
            initial={(step.target === "subject" ? subject : partner) ?? undefined}
            // 아이·상대의 생일을 기억해 두면 다음에 홈에서 그 원국이 내 것인 양 펼쳐진다
            remember={step.target === "subject" && (report.roles?.subject ?? "self") === "self"}
            onSkip={
              step.optional
                ? () => {
                    setPartner(null);
                    answer("지금은 건너뛸게요");
                  }
                : undefined
            }
            onSubmit={(profile) => {
              if (step.target === "subject") setSubject(profile);
              else setPartner(profile);
              answer(`${profile.name} · ${describeBirth(profile)}`);
            }}
          />
        </SheetCard>
      );
    }

    if (step?.kind === "detail") {
      return (
        <SheetCard>
          <div className="flex flex-col gap-space-sm">
            <textarea
              value={detail}
              maxLength={1000}
              rows={4}
              placeholder={step.placeholder}
              onChange={(event) => setDetail(event.target.value)}
              className="w-full resize-none rounded-lg border border-outline-variant/60 bg-surface-container-lowest p-space-sm font-body-md text-body-md text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary/60"
            />
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-outline">{detail.length}/1000 · 선택</span>
              <button
                type="button"
                onClick={() => answer(detail.trim() ? detail.trim() : "여기까지만 말할게요")}
                className="rounded-lg bg-on-surface px-space-lg py-2 font-label-md text-label-md text-surface"
              >
                {detail.trim() ? "다 말했어요" : "건너뛰기"}
              </button>
            </div>
          </div>
        </SheetCard>
      );
    }

    if (step?.kind === "submit") {
      return (
        <div className="flex flex-col gap-space-sm rounded-xl bg-surface-container-lowest/92 p-space-md shadow-2xl ring-1 ring-outline-variant/40 backdrop-blur-xl motion-safe:animate-fade-up">
          <div className="flex items-baseline gap-2">
            <span className="font-price-display text-price-display text-secondary">{formatKRW(report.price)}</span>
            {report.originalPrice && <span className="font-body-sm text-body-sm text-outline line-through">{formatKRW(report.originalPrice)}</span>}
            <span className="ml-auto font-label-sm text-label-sm text-outline">12개월 열람</span>
          </div>
          <label className="flex flex-col gap-1.5">
            <span className="font-label-sm text-label-sm text-on-surface-variant">
              휴대전화 번호 <span className="text-outline">· 선택</span>
            </span>
            <input
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              value={phone}
              maxLength={13}
              placeholder="010-0000-0000"
              onChange={(event) => setPhone(event.target.value)}
              className="w-full rounded-lg border border-outline-variant/60 bg-surface-container-lowest px-space-sm py-2.5 font-body-md text-body-md text-on-surface outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary/60"
            />
            <span className="font-label-sm text-label-sm text-outline">
              적어 두시면 풀이가 다 쓰이는 대로 카카오톡으로 알려 드려요. PDF 도 함께 보내 드립니다.
              번호는 이 알림에만 쓰고 광고는 보내지 않아요.
            </span>
          </label>
          <StageAction tone="confirm" disabled={submitting} onClick={submit}>
            {submitting ? "명식을 확인하고 있어요…" : step.label}
            {!submitting && <Icon name="arrow_forward" className="text-[18px]" />}
          </StageAction>
        </div>
      );
    }

    // 대사가 찍히는 중이면 건너뛰기, 다 찍혔으면 다음으로
    if (step?.kind === "line" || step?.kind === "panel") {
      if (typing) {
        return (
          <p className="py-3.5 text-center font-label-sm text-label-sm text-on-surface-variant/70">
            화면을 누르면 한 번에 다 보여 드려요
          </p>
        );
      }
      return <StageAction onClick={next}>다음</StageAction>;
    }

    return <p className="py-3.5 text-center font-label-sm text-label-sm text-on-surface-variant/70">…</p>;
  })();

  // 손님이 답해야 넘어가는 걸음만 센다. 대사와 컷은 저절로 흐르므로 걸음으로 치지 않는다.
  const answerKinds = ["question", "birth", "detail", "submit"] as const;
  const isAnswerStep = (item: FunnelStep) => (answerKinds as readonly string[]).includes(item.kind);
  const totalSteps = steps.filter(isAnswerStep).length;
  const answeredSteps = steps.slice(0, cursor).filter(isAnswerStep).length;

  const guideLine = step?.kind === "line" && step.speaker === "guide" ? fillName(step.text, name) : null;
  const narration = step?.kind === "line" && step.speaker === "narration" ? fillName(step.text, name) : null;
  const prompt =
    step?.kind === "detail"
      ? step.prompt
      : step?.kind === "submit"
        ? "다 모였어요. 이제 펼쳐 볼까요?"
          : null;

  return (
    <>
      {detailPage}
      <Stage
        guide={guide}
        progress={{ current: answeredSteps, total: totalSteps }}
        place={scene.place}
        camera={scene.camera}
        figure={scene.figure}
        assetKey={scene.asset}
        sfx={scene.sfx}
        sound={sound}
        onBack={goBack}
        onClose={() => setPhase("closed")}
        onTap={() => {
          // 찍히는 중이면 한 번에 다 보여 주고, 다 찍혔으면 다음으로 — 손가락 하나로 끝난다
          if (typing) setSkipSignal((value) => value + 1);
          else if (step?.kind === "line" || step?.kind === "panel") next();
        }}
        footer={footer}
      >
        {notice && (
          <div className="flex items-start gap-space-sm rounded-xl bg-error-container/80 p-space-md backdrop-blur motion-safe:animate-fade-up">
            <Icon name="info" className="text-[18px] text-on-error-container" />
            <p className="font-body-sm text-body-sm text-on-error-container">{notice}</p>
          </div>
        )}
        {echo && <EchoLine text={echo} />}
        {step?.kind === "panel" && step.caption && <WhisperLines lines={[fillName(step.caption, name)]} />}
        {narration && <WhisperLines lines={[narration]} />}
        {guideLine && <TypedBalloon key={cursor} text={guideLine} onTyped={onTyped} skipSignal={skipSignal} />}
        {prompt && (
          <p
            key={`prompt-${cursor}`}
            className="text-[1.6rem] font-bold leading-snug tracking-tight text-on-surface [text-shadow:0_2px_12px_rgb(0_0_0/0.9)] motion-safe:animate-fade-up"
          >
            {fillName(prompt, name)}
          </p>
        )}
      </Stage>
    </>
  );
}

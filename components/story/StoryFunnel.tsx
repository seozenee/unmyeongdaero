"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BirthForm } from "@/components/story/BirthForm";
import { useTypewriter } from "@/components/story/useTypewriter";
import { STITCH_ASSETS } from "@/components/home/assets";
import { GuideAvatar } from "@/components/story/GuideAvatar";
import { Icon } from "@/components/ui/Icon";
import { SpeechBalloon, WhisperLines } from "@/components/webtoon/ComicText";
import { Stage, StageAction } from "@/components/webtoon/Stage";
import { useAmbientSound } from "@/components/webtoon/useAmbientSound";
import { WebtoonIntro } from "@/components/webtoon/WebtoonIntro";
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
const LINE_PAUSE_MS = 420;
const PANEL_HOLD_MS = 2600;
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

export function StoryFunnel({ report }: { report: ReportProduct }) {
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

  // 웹툰 컷은 장면을 바꾸고 잠시 머문 뒤 다음으로
  useEffect(() => {
    if (phase !== "chat" || step?.kind !== "panel") return;
    setScene({ place: "room", camera: step.camera, figure: step.figure, asset: step.asset, sfx: step.sfx });
    setEcho(null);
    const timer = window.setTimeout(() => {
      setScene((current) => ({ ...BASE_SCENE, camera: current.camera === "close" ? "wide" : "close" }));
      advance();
    }, PANEL_HOLD_MS);
    return () => window.clearTimeout(timer);
  }, [phase, step, advance]);

  const onTyped = useCallback(() => {
    setTyping(false);
    window.setTimeout(advance, LINE_PAUSE_MS);
  }, [advance]);

  useEffect(() => {
    if (step?.kind === "line") setTyping(true);
  }, [step]);

  const answer = (text: string) => {
    setEcho(text);
    advance();
  };

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
  // ─ 상품 소개 — 맨 처음 보이는 판매 화면 ─
  const detailPage = (
    <div className="flex w-full flex-col pb-[calc(6rem+env(safe-area-inset-bottom,0px))]">
      {/* 표지 — 화면 위쪽을 통째로 쓴다 */}
      <div className="relative -mx-margin aspect-[4/5] overflow-hidden">
        <div
          role="img"
          aria-label=""
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('${STITCH_ASSETS[report.cover]}')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/60 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-space-xs px-margin pb-space-lg">
          <span className="w-fit rounded-full bg-secondary-container/70 px-2.5 py-1 font-label-sm text-label-sm text-on-secondary-container backdrop-blur">
            {report.categoryLabel}
          </span>
          <span className="font-label-md text-label-md text-secondary">{report.title}</span>
          <h1 className="font-headline-xl-mobile text-headline-xl-mobile leading-tight tracking-tight text-on-surface">
            {report.tagline}
          </h1>
        </div>
      </div>

      <div className="flex flex-col gap-space-lg pt-space-md">
        <p className="font-body-md text-body-md leading-relaxed text-on-surface-variant">{report.description}</p>

        {/* 안내자 */}
        <div className="flex items-center gap-space-md rounded-xl bg-surface-container p-space-md">
          <GuideAvatar guide={guide} size="md" />
          <div className="flex min-w-0 flex-col">
            <span className="font-label-md text-label-md text-on-surface">{guide.title}</span>
            <span className="line-clamp-2 font-body-sm text-body-sm text-on-surface-variant">{guide.tagline}</span>
          </div>
        </div>

        {/* 받는 것 — 숫자로 먼저 보여 준다 */}
        <ul className="grid grid-cols-3 gap-space-sm">
          {[
            { value: `${report.chapters.length}장`, label: "보고서 구성" },
            { value: report.partner === "required" ? "두 명식" : "내 명식", label: "읽는 범위" },
            { value: "PDF", label: "저장·공유" },
          ].map((item) => (
            <li key={item.label} className="flex flex-col items-center gap-0.5 rounded-xl bg-surface-container py-space-md">
              <span className="font-headline-sm text-headline-sm text-on-surface">{item.value}</span>
              <span className="font-label-sm text-label-sm text-outline">{item.label}</span>
            </li>
          ))}
        </ul>

        {/* 목차 */}
        <section className="flex flex-col gap-space-sm rounded-xl bg-surface-container p-space-lg">
          <h2 className="font-headline-sm text-headline-sm text-on-surface">이런 이야기를 받아요</h2>
          <ol className="flex flex-col gap-space-sm">
            {report.chapters.map((chapter, index) => (
              <li key={chapter} className="flex gap-space-sm">
                <span className="w-6 shrink-0 font-label-md text-label-md text-tertiary">{String(index + 1).padStart(2, "0")}</span>
                <span className="font-body-md text-body-md leading-snug text-on-surface">{chapter}</span>
              </li>
            ))}
          </ol>
          <p className="mt-space-xs border-t border-outline-variant/40 pt-space-sm font-body-sm text-body-sm text-on-surface-variant">
            ＋ 흐름 시기표 · 해 보면 좋은 것 / 피하면 좋은 것 · 문장마다 붙는 명리 근거
          </p>
        </section>

        {/* 어떻게 읽히는지 */}
        <section className="flex flex-col gap-space-sm rounded-xl bg-surface-container-low p-space-lg">
          <h2 className="font-headline-sm text-headline-sm text-on-surface">무엇을 보고 쓰나요</h2>
          <ul className="flex flex-col gap-space-sm">
            {[
              { icon: "calendar_month", text: "생년월일시로 만세력을 직접 계산해요. 절기와 진태양시까지 맞춰서요." },
              { icon: "fact_check", text: "모든 문장에 근거가 붙어요. 어느 글자에서 나온 말인지 함께 보여 드려요." },
              { icon: "lock_open", text: "한 번 사면 계속 볼 수 있어요. 구독 결제가 아니에요." },
            ].map((item) => (
              <li key={item.icon} className="flex gap-space-sm">
                <Icon name={item.icon} className="mt-0.5 shrink-0 text-[18px] text-tertiary" />
                <span className="font-body-sm text-body-sm leading-relaxed text-on-surface-variant">{item.text}</span>
              </li>
            ))}
          </ul>
        </section>

        {report.disclaimer && (
          <p className="font-body-sm text-body-sm leading-relaxed text-outline">{report.disclaimer}</p>
        )}
      </div>

      {/* 값과 시작 버튼은 늘 손 닿는 곳에 */}
      <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom,0px))] z-30 mx-auto w-full max-w-md border-t border-outline-variant/40 bg-surface/95 px-margin py-space-sm backdrop-blur">
        <div className="flex items-center gap-space-md">
          <div className="flex min-w-0 flex-col">
            <span className="flex items-baseline gap-1.5">
              {report.originalPrice && (
                <span className="font-label-sm text-label-sm text-outline line-through">{formatKRW(report.originalPrice)}</span>
              )}
              {report.discountLabel && (
                <span className="rounded bg-secondary-container/40 px-1.5 py-0.5 font-label-sm text-label-sm font-bold text-secondary">
                  {report.discountLabel}
                </span>
              )}
            </span>
            <span className="font-price-display text-price-display text-on-surface">{formatKRW(report.price)}</span>
          </div>
          <button
            type="button"
            onClick={() => setPhase(cursor > 0 ? "chat" : "intro")}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-on-surface py-3.5 font-label-md text-label-md text-surface shadow-lg transition-transform active:scale-[0.98]"
          >
            <Icon name="play_arrow" className="text-[18px]" />
            {cursor > 0 ? "이어서 보기" : `${josa(guide.name, "을/를")} 만나러 가기`}
          </button>
        </div>
        <p className="mt-1 text-center font-label-sm text-label-sm text-outline">
          대화 입력은 무료 · 결제는 마지막에
        </p>
      </div>
    </div>
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

    if (step?.kind === "question") {
      return (
        <div className="flex flex-col gap-space-xs motion-safe:animate-fade-up">
          {step.question.options.map((option) => (
            <StageAction
              key={option}
              onClick={() => {
                setAnswers((current) => ({ ...current, [step.question.id]: option }));
                answer(option);
              }}
            >
              {option}
            </StageAction>
          ))}
        </div>
      );
    }

    if (step?.kind === "birth") {
      return (
        <SheetCard>
          <BirthForm
            key={`${step.target}-${cursor}`}
            title={birthTitle(report, step.target)}
            initial={(step.target === "subject" ? subject : partner) ?? undefined}
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
            <span className="ml-auto font-label-sm text-label-sm text-outline">{report.chapters.length}장 보고서 · 영구 소장</span>
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

    // 대사가 흐르는 동안
    return (
      <p className="py-3.5 text-center font-label-sm text-label-sm text-on-surface-variant/70">
        {typing ? "화면을 누르면 빨리 넘어가요" : "…"}
      </p>
    );
  })();

  const guideLine = step?.kind === "line" && step.speaker === "guide" ? fillName(step.text, name) : null;
  const narration = step?.kind === "line" && step.speaker === "narration" ? fillName(step.text, name) : null;
  const prompt =
    step?.kind === "question"
      ? step.question.question
      : step?.kind === "detail"
        ? step.prompt
        : step?.kind === "submit"
          ? "다 모였어요. 이제 펼쳐 볼까요?"
          : null;

  return (
    <>
      {detailPage}
      <Stage
        guide={guide}
        place={scene.place}
        camera={scene.camera}
        figure={scene.figure}
        assetKey={scene.asset}
        sfx={scene.sfx}
        sound={sound}
        onClose={() => setPhase("closed")}
        onTap={() => typing && setSkipSignal((value) => value + 1)}
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
          <SpeechBalloon key={`prompt-${cursor}`} className="self-end" tail="bottom-right">
            {fillName(prompt, name)}
          </SpeechBalloon>
        )}
      </Stage>
    </>
  );
}

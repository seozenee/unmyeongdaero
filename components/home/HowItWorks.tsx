"use client";

import { useInView } from "@/components/home/useInView";
import { getWebtoonAsset } from "@/components/webtoon/assets";
import { WebtoonMedia } from "@/components/webtoon/WebtoonMedia";
import { Icon } from "@/components/ui/Icon";

/**
 * 어떻게 받는지.
 *
 * 카드만 늘어놓으면 "이걸 누르면 무슨 일이 생기나" 를 알 수 없다. 사주 사이트에서
 * 결제 버튼을 누르기 전에 가장 궁금한 것이 그것이다. 세 칸으로 끊어 적는다.
 *
 * 세 칸 모두 지금 코드가 실제로 하는 일이다 — 만세력 직접 계산, 무료 입력, 근거 표기와
 * PDF 보관. 하지 않는 일은 적지 않는다.
 */
const STEPS: ReadonlyArray<{ icon: string; title: string; body: string }> = [
  {
    icon: "edit_calendar",
    title: "생년월일시를 적어요",
    body: "절기와 진태양시까지 맞춰 만세력을 직접 계산해요. 태어난 시를 모르면 모른다고 두고 풀어요.",
  },
  {
    icon: "chat_bubble",
    title: "안내자와 짧게 이야기해요",
    body: "지금 상황을 몇 가지 물어요. 적어 주신 만큼 더 가까이 읽어요. 여기까지는 무료예요.",
  },
  {
    icon: "menu_book",
    title: "근거가 붙은 리포트를 받아요",
    body: "문장마다 어느 글자에서 나온 말인지 함께 보여 드려요. PDF 로도 저장되고, 보관함에서 계속 열려요.",
  },
];

export function HowItWorks() {
  const { ref, inView } = useInView<HTMLDivElement>();
  const cover = getWebtoonAsset("doham", "report-cover");

  return (
    <section className="mt-space-xl flex flex-col gap-space-md">
      <div className="px-space-xs">
        <span className="font-label-sm text-label-sm tracking-widest text-secondary">HOW IT WORKS</span>
        <h3 className="mt-0.5 font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
          결제 전에 어디까지 보이나요
        </h3>
      </div>

      <div ref={ref} className="overflow-hidden rounded-2xl bg-surface-container">
        <div className="relative aspect-[16/10] w-full overflow-hidden">
          {cover && <WebtoonMedia asset={cover} active={inView} className="absolute inset-0" />}
          <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-surface-container via-surface-container/50 to-transparent" />
          <p className="absolute inset-x-0 bottom-0 px-space-lg pb-space-md font-headline-sm text-headline-sm leading-snug text-on-surface [text-shadow:0_1px_8px_rgb(0_0_0/0.9)]">
            입력과 대화는 무료예요.
            <br />
            결제는 풀이를 펼치기 직전에 한 번.
          </p>
        </div>

        {/* 세 칸도 미는 줄로 둔다 — 세로로 쌓으면 읽을 것이 늘어난 것처럼만 보인다 */}
        <ol className="no-scrollbar flex snap-x gap-space-sm overflow-x-auto p-space-md">
          {STEPS.map((step, index) => (
            <li
              key={step.title}
              className="flex w-[66vw] max-w-[15rem] shrink-0 snap-start flex-col gap-space-xs rounded-xl bg-surface-container-high p-space-md"
            >
              <span className="flex items-center gap-space-xs">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-container-highest">
                  <Icon name={step.icon} className="text-[19px] text-tertiary" />
                </span>
                <span className="font-label-sm text-label-sm tracking-widest text-outline">
                  STEP {String(index + 1).padStart(2, "0")}
                </span>
              </span>
              <span className="font-headline-sm text-headline-sm text-on-surface">{step.title}</span>
              <span className="font-body-sm text-body-sm leading-relaxed text-on-surface-variant">{step.body}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

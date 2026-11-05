import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactElement, ReactNode } from "react";
import { StoryFunnel } from "@/components/story/StoryFunnel";
import { PersonalizedSales as ProductIntro } from "@/components/story/PersonalizedSales";
import { WebtoonIntro } from "@/components/webtoon/WebtoonIntro";
import { Stage, StageAction } from "@/components/webtoon/Stage";
import { buildIntroShots } from "@/lib/story/webtoon";
import { PurchaseSheet } from "@/components/checkout/PurchaseSheet";
import { getReport } from "@/lib/reports/catalog";

const hooks = vi.hoisted(() => ({
  cursor: 0, values: [] as unknown[], effects: [] as (() => unknown)[], mounted: false,
}));
vi.mock("react", async importOriginal => ({
  ...await importOriginal<typeof import("react")>(),
  useMemo: (fn: () => unknown) => fn(),
  useCallback: (fn: unknown) => fn,
  useRef: (initial: unknown) => {
    const index = hooks.cursor++;
    if (!(index in hooks.values)) hooks.values[index] = {current:initial};
    return hooks.values[index];
  },
  useEffect: (fn: () => unknown) => { if (!hooks.mounted) hooks.effects.push(fn); },
  useState: (initial: unknown) => {
    const index = hooks.cursor++;
    if (!(index in hooks.values)) hooks.values[index] = initial;
    return [hooks.values[index], (value: unknown) => {
      hooks.values[index] = typeof value === "function" ? value(hooks.values[index]) : value;
    }];
  },
}));
vi.mock("next/navigation", () => ({useRouter:()=>({push:vi.fn()})}));
vi.mock("@/components/story/PersonalizedSales", () => ({ PersonalizedSales: () => null }));
vi.mock("@/components/checkout/PurchaseSheet", () => ({ PurchaseSheet: () => null }));
vi.mock("@/components/webtoon/useAmbientSound", () => ({ useAmbientSound: () => ({on:false, toggle:vi.fn(), chime:vi.fn(), stop:vi.fn()}) }));

function find(node: ReactNode, type: unknown): ReactElement<Record<string, unknown>> | undefined {
  if (!node || typeof node !== "object" || !("props" in node)) return;
  const element = node as ReactElement<{children?: ReactNode}>;
  if (element.type === type) return element as ReactElement<Record<string, unknown>>;
  for (const child of [element.props.children].flat()) {
    const result = find(child, type); if (result) return result;
  }
}
const report = getReport("factbomb")!;
const subject = { name:"가상검증", isFemale:true, birthCity:"서울", birthYear:1990, birthMonth:1, birthDay:1, birthHour:12, birthMinute:0, isLunar:false };

describe("상세페이지 진입 시 구매창 자동 노출 방지", () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  let pageShow: (() => void) | undefined;
  beforeEach(() => {
    hooks.cursor = 0; hooks.values = []; hooks.effects = []; hooks.mounted = false;
    fetchMock = vi.fn(); pageShow = undefined;
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("sessionStorage", {getItem:vi.fn(() => null), removeItem:vi.fn(), setItem:vi.fn()});
    vi.stubGlobal("window", {scrollTo:vi.fn(), addEventListener:vi.fn((name, fn) => {if(name === "pageshow") pageShow = fn;}), removeEventListener:vi.fn()});
  });
  afterEach(() => vi.unstubAllGlobals());
  const render = (props: Partial<Parameters<typeof StoryFunnel>[0]> = {}) => {
    hooks.cursor = 0;
    return StoryFunnel({report, ...props});
  };
  const mountEffects = () => { hooks.mounted = true; hooks.effects.forEach(effect => effect()); };

  it("저장된 입력을 복원해도 이야기 첫 장면부터 표시한다", () => {
    vi.mocked(sessionStorage.getItem).mockReturnValue(JSON.stringify({cursor:4,subject,partner:null,answers:{detail:"가상 질문"},offerSlug:report.slug}));
    render(); mountEffects();
    const page = render();
    expect(find(page, WebtoonIntro)).toBeDefined();
    expect(find(page, ProductIntro)).toBeUndefined();
    expect(find(page, PurchaseSheet)).toBeUndefined();
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("스토리 다음은 입력이며 제출 후 유도페이지만 표시하고 구입 버튼을 눌러야 선택창을 연다", async () => {
    vi.mocked(sessionStorage.getItem).mockReturnValue(JSON.stringify({cursor:4,subject,partner:null,answers:{detail:"가상 질문"},offerSlug:report.slug}));
    fetchMock.mockResolvedValue({ok:true,status:200,json:async()=>({readingId:"new-input"})});
    render(); mountEffects();
    (find(render(),WebtoonIntro)!.props.onStart as () => void)();
    const input = render();
    expect(find(input,ProductIntro)).toBeUndefined();
    expect(find(input,PurchaseSheet)).toBeUndefined();
    const footer=find(input,Stage)!.props.footer as ReactNode;
    await (find(footer,StageAction)!.props.onClick as () => Promise<void>)();
    await new Promise(resolve=>setTimeout(resolve,0));
    const sales=render();
    expect(find(sales,ProductIntro)).toBeDefined();
    expect(find(sales,PurchaseSheet)).toBeUndefined();
    (find(sales,ProductIntro)!.props.onPurchase as () => void)();
    expect(find(render(),PurchaseSheet)).toBeDefined();
    pageShow!();
    expect(find(render(),PurchaseSheet)).toBeUndefined();
  });
  it("이야기 마지막 장면에서만 상세 보기 버튼이 나오고 그 전에는 다음 장면으로만 이동한다", () => {
    const onStart = vi.fn();
    const shots = buildIntroShots(report);
    const story = () => { hooks.cursor = 0; return WebtoonIntro({report,onStart,onClose:vi.fn()}); };
    for (let i=0; i<shots.length-1; i++) {
      const page = story();
      const footer = find(page, Stage)!.props.footer as ReactNode;
      const button = find(footer, StageAction)!;
      expect(button.props.children).not.toBe("내 사주 입력하기");
      (button.props.onClick as () => void)();
      expect(onStart).not.toHaveBeenCalled();
    }
    const footer = find(story(), Stage)!.props.footer as ReactNode;
    const button = find(footer, StageAction)!;
    expect(button.props.children).toBe("내 사주 입력하기");
    (button.props.onClick as () => void)();
    expect(onStart).toHaveBeenCalledOnce();
  });

});

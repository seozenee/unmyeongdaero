import { DecadeTimeline } from "@/components/saju/DecadeTimeline";
import { FiveElementsRadar } from "@/components/saju/FiveElementsRadar";
import { FourPillarsChart } from "@/components/saju/FourPillarsChart";
import { InterpretationCard } from "@/components/saju/InterpretationCard";
import { ReportPaywall } from "@/components/saju/ReportPaywall";
import { buildBasisFacts, pickGlossary } from "@/lib/saju/basis";
import {
  findCurrentDecadeIndex,
  parseDecadeFortune,
  parseElementCounts,
  parseFourPillars,
  resolveCurrentAge,
  type SazuModules,
  type SimpleDate,
} from "@/lib/saju/modules";
import type { ReportProduct } from "@/lib/reports/catalog";

export interface InterpretationSection {
  title: string;
  paragraphs: string[];
}

type ReportResultViewProps =
  | {
      report: ReportProduct;
      locked: true;
    }
  | {
      report: ReportProduct;
      locked: false;
      modules: SazuModules;
      glossary: Record<string, string>;
      sections: InterpretationSection[];
      birth: SimpleDate;
      referenceDate: SimpleDate;
    };

export function ReportResultView(props: ReportResultViewProps) {
  const { report } = props;

  return (
    <div className="flex w-full flex-col gap-space-md py-space-md">
      <header className="flex flex-col gap-space-xs px-space-xs">
        <span className="font-label-md text-label-md text-secondary">{report.categoryLabel}</span>
        <h1 className="font-headline-xl-mobile text-headline-xl-mobile tracking-tight text-on-surface">
          {report.title}
        </h1>
      </header>

      {props.locked ? (
        // 미구매: sazu 호출 자체를 하지 않으므로 실데이터가 없다. 정적 티저만 블러 처리.
        <ReportPaywall report={report} teaser={<LockedTeaser />} showTitle={false} />
      ) : (
        <UnlockedReport {...props} />
      )}
    </div>
  );
}

function UnlockedReport({
  modules,
  glossary,
  sections,
  birth,
  referenceDate,
}: Extract<ReportResultViewProps, { locked: false }>) {
  const pillars = parseFourPillars(modules);
  const counts = parseElementCounts(modules);
  const decade = parseDecadeFortune(modules);
  const facts = buildBasisFacts(modules);
  const currentAge = resolveCurrentAge(modules, birth, referenceDate);

  return (
    <>
      {pillars && <FourPillarsChart pillars={pillars} />}
      {counts && <FiveElementsRadar counts={counts} />}
      {decade && (
        <DecadeTimeline
          items={decade.items}
          direction={decade.direction}
          currentIndex={findCurrentDecadeIndex(decade.items, currentAge)}
        />
      )}
      {sections.map((section, index) => (
        <InterpretationCard
          key={section.title}
          eyebrow={`CHAPTER ${String(index + 1).padStart(2, "0")}`}
          title={section.title}
          paragraphs={section.paragraphs}
          facts={facts}
          glossary={pickGlossary(glossary, section.paragraphs)}
        />
      ))}
    </>
  );
}

const TEASER_LINES = [
  "그 사람의 원국에서 지금 가장 강하게 움직이는 기운과, 마음이 닫힌 이유를 명리 구조로 짚어 봅니다.",
  "연락이 닿을 가능성이 높아지는 시기와, 그 전에 피해야 할 행동을 대운·세운 흐름에 맞춰 정리합니다.",
  "두 사람의 오행이 서로를 채우는 지점과 부딪히는 지점을 나란히 놓고, 현실적인 대화의 순서를 제안합니다.",
];

function LockedTeaser() {
  return (
    <div className="flex min-h-[28rem] flex-col gap-space-md">
      <div className="grid grid-cols-4 gap-space-xs rounded-lg bg-surface-container-high p-space-md">
        {Array.from({ length: 8 }, (_, index) => (
          <div key={index} className="aspect-[3/4] rounded-lg bg-surface-container-highest" />
        ))}
      </div>
      <div className="flex flex-col gap-space-sm rounded-xl bg-surface-container p-space-lg">
        {TEASER_LINES.map((line) => (
          <p key={line} className="font-body-md text-body-md text-on-surface">
            {line}
          </p>
        ))}
      </div>
    </div>
  );
}

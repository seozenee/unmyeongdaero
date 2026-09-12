import { notFound } from "next/navigation";
import { ReportResultView } from "@/components/saju/ReportResultView";
import {
  SAMPLE_BIRTH,
  SAMPLE_GLOSSARY,
  SAMPLE_INTERPRETATION,
  SAMPLE_MODULES,
  SAMPLE_REFERENCE_DATE,
} from "@/lib/saju/__fixtures__/sample-reading";
import { getReport } from "@/lib/reports/catalog";

// 개발 환경 전용: 결과 화면 컴포넌트를 샘플 데이터로 확인한다. (?locked=1 → 페이월 상태)
export default function ReportPreviewPage({ searchParams }: { searchParams: { locked?: string } }) {
  if (process.env.NODE_ENV === "production") notFound();

  const report = getReport("reunion-deep")!;

  if (searchParams.locked === "1") {
    return <ReportResultView report={report} locked />;
  }

  return (
    <ReportResultView
      report={report}
      locked={false}
      modules={SAMPLE_MODULES}
      glossary={SAMPLE_GLOSSARY}
      sections={[SAMPLE_INTERPRETATION]}
      birth={SAMPLE_BIRTH}
      referenceDate={SAMPLE_REFERENCE_DATE}
    />
  );
}

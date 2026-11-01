import { z } from "zod";
import type { ReportProduct } from "@/lib/reports/catalog";
import { reportSectionSchema, storyReportSchema, type StoryReport } from "./report";

/** 장의 정체성은 서버가 정한다. 모델은 제목 대신 지정된 ID에 본문을 작성한다. */
export function chapterPlan(product: Pick<ReportProduct, "chapters">) {
  return product.chapters.map((title, index) => ({ id: `chapter_${index + 1}`, title }));
}

export function generationSchema(product: Pick<ReportProduct, "chapters">) {
  const ids = chapterPlan(product).map(chapter => chapter.id);
  if (!ids.length) throw new Error("[report-quality] 상품 목차 누락");
  return storyReportSchema.extend({
    sections: z.array(reportSectionSchema.omit({ title: true }).extend({
      chapterId: z.enum(ids as [string, ...string[]]),
    })).length(ids.length),
  });
}

/** 중복·누락은 실패시킨다. 순서만 달라진 장은 ID로 찾아 원래 상품 목차에 연결한다. */
export function resolveGeneratedReport(value: unknown, product: Pick<ReportProduct, "chapters">): StoryReport {
  const generated = generationSchema(product).parse(value);
  const sections = new Map(generated.sections.map(section => [section.chapterId, section]));
  if (sections.size !== product.chapters.length) throw new Error("[report-quality] 생성한 장 ID 중복 또는 누락");
  return {
    ...generated,
    sections: chapterPlan(product).map(chapter => {
      const section = sections.get(chapter.id);
      if (!section) throw new Error("[report-quality] 생성한 장 누락");
      const { chapterId: _, ...content } = section;
      return { ...content, title: chapter.title };
    }),
  };
}

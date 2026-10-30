// 보고서 PDF.
//
// 화면 컴포넌트를 종이로 옮긴 게 아니라, 지면을 위해 따로 짠 문서다. 브라우저 인쇄는
// 페이지 경계를 제어할 수 없어 표가 반으로 잘리거나 제목만 홀로 남는 일이 생기는데,
// 여기서는 wrap={false} 로 "잘리면 곤란한 덩어리"를 직접 지정한다.
//
// 순서: 표지 → 결론 → 명식 한 벌 → 각 장 → 시기 → 실천 → 맺음 → 용어.
import React from "react";
import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { BirthProfile } from "@/lib/db/types";
import type { StoryReport } from "@/lib/story/report";
import { Actions, ElementBars, Evidence, Eyebrow, PillarsTable, SectionTitle, Timeline, type PillarCell } from "./parts";
import { ELEMENT_COLOR, palette, radius, space, TONE_COLOR, type } from "./theme";

const styles = StyleSheet.create({
  page: {
    backgroundColor: palette.paper,
    color: palette.ink,
    fontFamily: "Pretendard",
    paddingTop: 54,
    paddingBottom: 56,
    paddingHorizontal: 52,
  },
  // ─ 표지 ─
  cover: { flexGrow: 1, justifyContent: "center" },
  // 한글은 라틴처럼 자간을 벌리면 낱자가 흩어져 읽힌다. 살짝만 준다.
  wordmark: { ...type.labelMd, fontWeight: 700, color: palette.accent, letterSpacing: 1 },
  coverRule: { height: 2, width: 44, backgroundColor: palette.accent, marginTop: space.md, marginBottom: space.xl },
  coverTitle: { ...type.headlineXl, fontWeight: 700, color: palette.ink },
  coverSubject: { ...type.bodyLg, color: palette.inkMuted, marginTop: space.md },
  coverChart: { ...type.headlineMd, fontWeight: 600, color: palette.accent, marginTop: space.sm, letterSpacing: 1 },
  coverFooter: { ...type.bodySm, color: palette.inkFaint, marginTop: space.xl },
  // ─ 머리글·쪽번호 ─
  runningHead: {
    position: "absolute",
    top: 26,
    left: 52,
    right: 52,
    flexDirection: "row",
    justifyContent: "space-between",
    ...type.labelSm,
    color: palette.inkFaint,
  },
  pageNumber: {
    position: "absolute",
    bottom: 28,
    left: 52,
    right: 52,
    textAlign: "center",
    ...type.labelSm,
    color: palette.inkFaint,
  },
  // ─ 본문 ─
  block: { marginBottom: space.xl },
  headline: { ...type.headlineLg, fontWeight: 700, color: palette.ink, marginBottom: space.md },

  // ─ 장 표제지 ─
  // 쪽 높이를 다 쓰고 가운데에 세운다. 다음 덩어리가 break 로 넘어가므로
  // 이 뷰 하나가 한 쪽을 온전히 차지한다.
  chapterCover: { height: 680, justifyContent: "center", alignItems: "flex-start" },
  chapterNumber: { ...type.headlineLg, fontSize: 64, fontWeight: 700, color: palette.accent, opacity: 0.35 },
  chapterRule: { width: 48, height: 2, backgroundColor: palette.accent, marginVertical: space.md },
  chapterTitle: { ...type.headlineLg, fontWeight: 700, color: palette.ink, marginBottom: space.sm },
  chapterLead: { ...type.bodyLg, color: palette.inkMuted, maxWidth: 360 },
  summary: { ...type.bodyLg, color: palette.ink, marginBottom: space.md },
  keywordRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  keyword: {
    ...type.labelSm,
    fontWeight: 600,
    color: palette.accent,
    borderWidth: 1,
    borderColor: palette.accent,
    borderRadius: radius.lg,
    paddingVertical: 3,
    paddingHorizontal: 9,
  },
  caption: { ...type.bodySm, color: palette.inkMuted, marginTop: space.sm },
  subheading: { ...type.bodyLg, fontWeight: 600, color: palette.ink, marginTop: space.lg, marginBottom: space.sm },
  paragraph: { ...type.bodyMd, color: palette.ink, marginBottom: space.sm },
  lead: { ...type.bodyLg, fontWeight: 600, color: palette.ink, marginBottom: space.sm },
  closing: {
    ...type.bodyMd,
    color: palette.ink,
    backgroundColor: palette.tint,
    borderRadius: radius.lg,
    padding: space.lg,
  },
  glossaryRow: { flexDirection: "row", marginBottom: 5 },
  glossaryTerm: { ...type.labelSm, fontWeight: 700, color: palette.ink, width: 74 },
  glossaryText: { ...type.bodySm, color: palette.inkMuted, flex: 1 },
  disclaimer: { ...type.labelSm, color: palette.inkFaint, marginTop: space.lg, lineHeight: 1.5 },
});

export interface ReportPdfInput {
  report: StoryReport;
  /** 상품 이름 — 표지와 머리글에 쓴다 */
  productTitle: string;
  subject: BirthProfile;
  /** 원국 네 기둥 */
  pillars: PillarCell[];
  /** 한 줄로 쓴 원국 (예: "무인 정사 병인 계사") */
  chartLine: string;
  elements: Array<{ element: string; count: number }>;
  /** 본문에 실제로 나온 용어만 */
  glossary: Array<{ term: string; meaning: string }>;
  /** 발행일 */
  issuedAt: string;
  disclaimer?: string;
}

/** 쪽마다 아래에 도는 번호. Page 가 여럿이라 부품으로 빼 둔다 */
function PageNumber() {
  return <Text style={styles.pageNumber} render={({ pageNumber }) => `${pageNumber}`} fixed />;
}

function RunningHead({ title }: { title: string }) {
  return (
    <View style={styles.runningHead} fixed>
      <Text>운명대로</Text>
      <Text>{title}</Text>
    </View>
  );
}

export function ReportDocument(input: ReportPdfInput) {
  const { report, productTitle, subject, pillars, chartLine, elements, glossary, issuedAt, disclaimer } = input;

  return (
    <Document title={`${productTitle} — ${subject.name}`} author="운명대로" language="ko">
      {/* 표지 */}
      <Page size="A4" style={styles.page}>
        <View style={styles.cover}>
          <Text style={styles.wordmark}>운명대로</Text>
          <View style={styles.coverRule} />
          <Text style={styles.coverTitle}>{productTitle}</Text>
          <Text style={styles.coverSubject}>{subject.name} 님</Text>
          <Text style={styles.coverChart}>{chartLine}</Text>
          <Text style={styles.coverFooter}>{issuedAt} 발행 · 운명대로</Text>
        </View>
      </Page>

      {/*
        본문은 묶음마다 Page 를 따로 둔다.
        한동안 한 Page 에 전부 흘려보냈다. 장마다 Page 를 두면 남는 자리가 빈 쪽이
        된다는 이유였다. 그런데 그렇게 쌓다 보면 어느 쪽수를 넘기는 순간 레이아웃이
        통째로 깨진다 — pdfkit 이 "unsupported number: -1.18e+23" 을 던지며 멈춘다.
        우리 상품은 전부 세 장 이상이라, PDF 는 사실상 한 번도 제대로 나온 적이 없었다.

        라이브러리만 놓고 보면 스무 쪽도 멀쩡하다. 한 Page 안에서 자라는 레이아웃
        나무가 어느 크기를 넘길 때 어긋나는 것이다. 그래서 Page 를 작게 여러 개로
        나눈다. 나무가 작으면 넘칠 일이 없다.

        덤으로 종이로 읽을 때의 결도 좋아진다 — 장이 바뀌는 자리가 눈에 보이고,
        표제지가 제 쪽을 온전히 차지한다.
      */}

      {/* 결론과 명식. 읽는 사람이 가장 먼저 알고 싶은 것이 결론이다 */}
      <Page size="A4" style={styles.page}>
        <RunningHead title={productTitle} />

        <View style={styles.block}>
          <Eyebrow>결론</Eyebrow>
          <Text style={styles.headline}>{report.headline}</Text>
          <Text style={styles.summary}>{report.summary}</Text>
          <View style={styles.keywordRow}>
            {report.keywords.map((keyword) => (
              <Text key={keyword} style={styles.keyword}>
                {keyword}
              </Text>
            ))}
          </View>
        </View>

        {/* 원국과 오행은 한 덩어리로 묶는다. 따로 두면 둘 사이에서 쪽이 넘어가
            오행 막대만 덩그러니 놓인 쪽이 생긴다. */}
        <View style={styles.block} wrap={false}>
          <Eyebrow>명식</Eyebrow>
          <SectionTitle>타고난 네 기둥</SectionTitle>
          <PillarsTable cells={pillars} />
          <Text style={styles.caption}>
            위는 천간, 아래는 지지 · 가운데 줄은 일간과 맺는 관계(십성) · 아랫줄은 그 자리에서의 기운의 세기(십이운성)
          </Text>
          <Text style={styles.subheading}>다섯 기운의 분포</Text>
          <ElementBars counts={elements} />
        </View>

        <PageNumber />
      </Page>

      {/* 장마다 표제지 한 쪽, 본문 한 쪽(넘치면 이어서) */}
      {report.sections.map((section, index) => (
        <React.Fragment key={section.title}>
          <Page size="A4" style={styles.page}>
            <View style={styles.chapterCover}>
              <Text style={styles.chapterNumber}>{String(index + 1).padStart(2, "0")}</Text>
              <View style={styles.chapterRule} />
              <Text style={styles.chapterTitle}>{section.title}</Text>
              <Text style={styles.chapterLead}>{section.lead}</Text>
            </View>
            <PageNumber />
          </Page>

          <Page size="A4" style={styles.page}>
            <RunningHead title={productTitle} />
            <View style={styles.block}>
              <Eyebrow>{`${index + 1}장`}</Eyebrow>
              <SectionTitle>{section.title}</SectionTitle>
              {section.body.map((paragraph, paragraphIndex) => (
                <Text key={paragraphIndex} style={styles.paragraph}>
                  {paragraph}
                </Text>
              ))}
              <Evidence items={section.evidence} />
            </View>
            <PageNumber />
          </Page>
        </React.Fragment>
      ))}

      {/* 시기 */}
      <Page size="A4" style={styles.page}>
        <RunningHead title={productTitle} />
        <View style={styles.block}>
          <Eyebrow>시기</Eyebrow>
          <SectionTitle>흐름이 바뀌는 때</SectionTitle>
          <Timeline
            items={report.timeline.map((item) => ({
              period: item.period,
              title: item.title,
              note: item.note,
              color: TONE_COLOR[item.tone],
            }))}
          />
        </View>
        <PageNumber />
      </Page>

      {/* 실천과 맺음 */}
      <Page size="A4" style={styles.page}>
        <RunningHead title={productTitle} />
        <View style={styles.block} wrap={false}>
          <Eyebrow>실천</Eyebrow>
          <SectionTitle>오늘부터 해볼 수 있는 것</SectionTitle>
          <Actions dos={report.actions.do} avoids={report.actions.avoid} />
        </View>

        <View style={styles.block} wrap={false}>
          <Eyebrow>맺음</Eyebrow>
          <Text style={styles.closing}>{report.closing}</Text>
        </View>
        <PageNumber />
      </Page>

      {/* 용어와 꼬리말 */}
      <Page size="A4" style={styles.page}>
        <RunningHead title={productTitle} />
        {glossary.length > 0 && (
          <View style={styles.block}>
            <Eyebrow>용어</Eyebrow>
            <SectionTitle>이 보고서에 나온 말</SectionTitle>
            {glossary.map((entry) => (
              <View key={entry.term} style={styles.glossaryRow} wrap={false}>
                <Text style={styles.glossaryTerm}>{entry.term}</Text>
                <Text style={styles.glossaryText}>{entry.meaning}</Text>
              </View>
            ))}
          </View>
        )}

        <Text style={styles.disclaimer}>
          {disclaimer ? `${disclaimer}\n` : ""}
          명리 계산을 바탕으로 읽은 풀이입니다. 발행일로부터 12개월간 다시 열어 보실 수 있습니다.
          선택은 언제나 읽는 분의 몫입니다. · 운명대로 (르노바) · unmyeongdaero.com
        </Text>
        <PageNumber />
      </Page>
    </Document>
  );
}

export { ELEMENT_COLOR };

// PDF 를 이루는 조각들. 지면에만 쓰는 부품이라 화면 컴포넌트와 공유하지 않는다.
//
// 화면은 스크롤이 무한하지만 종이는 A4 한 장에서 끊긴다. 그래서 같은 정보라도 배치가 다르다.
// 원국표는 화면에서 가로로 미는 대신 지면에서는 네 칸을 나란히 펴고, 오행은 레이더 차트 대신
// 가로 막대로 눕힌다(작은 지면에서 레이더는 읽히지 않는다).
import { StyleSheet, Text, View } from "@react-pdf/renderer";
import { ELEMENT_COLOR, palette, radius, space, type } from "./theme";

const styles = StyleSheet.create({
  // ─ 제목 ─
  sectionTitle: {
    ...type.headlineMd,
    fontWeight: 600,
    color: palette.ink,
    marginBottom: space.sm,
  },
  eyebrow: {
    ...type.labelSm,
    fontWeight: 600,
    color: palette.accent,
    letterSpacing: 1.2,
    marginBottom: space.xs,
  },
  lead: {
    ...type.bodyLg,
    fontWeight: 600,
    color: palette.ink,
    marginBottom: space.sm,
  },
  body: {
    ...type.bodyMd,
    color: palette.ink,
    marginBottom: space.sm,
  },
  // ─ 근거 ─
  evidenceBox: {
    backgroundColor: palette.tint,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.accentSoft,
    padding: space.md,
    marginTop: space.sm,
  },
  evidenceHead: {
    ...type.labelSm,
    fontWeight: 700,
    color: palette.accent,
    letterSpacing: 0.6,
    marginBottom: space.sm,
  },
  evidenceRow: { flexDirection: "row", marginBottom: space.sm },
  evidenceBullet: { ...type.bodySm, color: palette.accent, width: 10 },
  evidenceLabel: { ...type.labelMd, fontWeight: 700, color: palette.ink, marginBottom: 2 },
  evidenceDetail: { ...type.bodySm, color: palette.inkMuted },
  // ─ 원국표 ─
  chartRow: { flexDirection: "row", gap: space.xs },
  chartCell: {
    flex: 1,
    borderWidth: 1,
    borderColor: palette.tint,
    borderRadius: radius.lg,
    overflow: "hidden",
    paddingBottom: space.xs,
  },
  chartCellMine: { borderColor: palette.accent },
  chartCellHead: {
    backgroundColor: palette.tint,
    paddingVertical: 4,
    alignItems: "center",
  },
  chartCellHeadMine: { backgroundColor: palette.accentSoft },
  chartCellHeadText: { ...type.labelSm, fontWeight: 600, color: palette.ink },
  chartGod: { ...type.labelSm, fontWeight: 600, color: palette.inkMuted, textAlign: "center", marginTop: 3 },
  chartGodMine: { color: palette.accent, fontWeight: 700 },
  chartChar: { ...type.headlineMd, fontWeight: 700, textAlign: "center", marginTop: 2 },
  chartReading: { ...type.labelSm, color: palette.inkMuted, textAlign: "center" },
  chartStage: { ...type.labelSm, color: palette.inkFaint, textAlign: "center", marginTop: 3 },
  chartVoid: { ...type.labelSm, fontWeight: 700, color: palette.gold, textAlign: "center" },
  chartHidden: { ...type.labelSm, fontSize: 7, color: palette.inkFaint, textAlign: "center", marginTop: 2 },
  // ─ 오행 막대 ─
  barRow: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  barLabel: { ...type.labelSm, fontWeight: 600, color: palette.ink, width: 22 },
  barTrack: { flex: 1, height: 9, backgroundColor: palette.tint, borderRadius: radius.base, marginHorizontal: space.sm },
  barFill: { height: 9, borderRadius: radius.base },
  barCount: { ...type.labelSm, color: palette.inkMuted, width: 22, textAlign: "right" },
  // ─ 시기 ─
  timelineItem: { flexDirection: "row", marginBottom: space.sm },
  timelineRail: { width: 3, borderRadius: 2, marginRight: space.md },
  timelinePeriod: { ...type.labelSm, fontWeight: 600, marginBottom: 2 },
  timelineTitle: { ...type.bodyMd, fontWeight: 600, color: palette.ink },
  timelineNote: { ...type.bodySm, color: palette.inkMuted, marginTop: 2 },
  // ─ 실천 ─
  actionColumns: { flexDirection: "row", gap: space.md },
  actionColumn: { flex: 1, borderRadius: radius.lg, padding: space.md },
  actionHead: { ...type.labelMd, fontWeight: 700, marginBottom: space.sm },
  actionItem: { flexDirection: "row", marginBottom: 5 },
  actionBullet: { ...type.bodySm, width: 10 },
  actionText: { ...type.bodySm, color: palette.ink, flex: 1 },
});

export function Eyebrow({ children }: { children: string }) {
  return <Text style={styles.eyebrow}>{children}</Text>;
}

export function SectionTitle({ children }: { children: string }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

/**
 * 원국 네 기둥 — 지면에서는 네 칸을 나란히 편다.
 *
 * 한동안 한 칸에 "무인" 두 글자를 붙여 찍고 그 아래 "식신 · 편인" 을 한 줄로 적었다.
 * 어느 십성이 천간 것이고 어느 것이 지지 것인지 알 수가 없었다. 화면 판과 똑같이
 * 위아래로 나눠 세운다 — 십성 · 천간 · 지지 · 십성 · 운성 · 지장간.
 */
export interface PillarCell {
  slot: string;
  /**
   * 천간·지지 — 한글로만 싣는다.
   *
   * 한자를 크게 찍어 두었는데 종이에서 「甲」이 "2" 로, 「亥」가 "¥" 로 나왔다.
   * 본문 글꼴(Pretendard)에 한자 글리프가 없어서 엉뚱한 자리의 글자가 찍힌 것이다.
   * 한자 글꼴을 한 벌 더 싣는 방법도 있지만, 읽는 사람에게 한자는 어차피 못 읽는
   * 글자다. 한글로 적으면 글꼴도 글도 모두 해결된다.
   */
  stem: string;
  branch: string;
  stemGod: string;
  branchGod: string;
  stage: string;
  /** 지지 속에 숨은 글자 ("무·병·갑") */
  hidden: string;
  /** 일주가 속한 순에서 비는 자리인가 */
  empty: boolean;
  stemColor: string;
  branchColor: string;
  /** 일주 — 나를 가리키는 자리 */
  mine: boolean;
}

export function PillarsTable({ cells }: { cells: PillarCell[] }) {
  return (
    <View style={styles.chartRow}>
      {cells.map((cell) => (
        <View key={cell.slot} style={cell.mine ? { ...styles.chartCell, ...styles.chartCellMine } : styles.chartCell}>
          <View style={cell.mine ? { ...styles.chartCellHead, ...styles.chartCellHeadMine } : styles.chartCellHead}>
            <Text style={styles.chartCellHeadText}>{cell.slot}</Text>
          </View>

          <Text style={cell.mine ? { ...styles.chartGod, ...styles.chartGodMine } : styles.chartGod}>
            {cell.stemGod}
          </Text>
          <Text style={{ ...styles.chartChar, color: cell.stemColor }}>{cell.stem}</Text>
          <Text style={{ ...styles.chartChar, color: cell.branchColor }}>{cell.branch}</Text>
          <Text style={styles.chartGod}>{cell.branchGod}</Text>

          <Text style={styles.chartStage}>{cell.stage}</Text>
          {cell.empty && <Text style={styles.chartVoid}>비어 있음</Text>}
          <Text style={styles.chartHidden}>{cell.hidden}</Text>
        </View>
      ))}
    </View>
  );
}

/** 오행 분포 — 레이더 대신 가로 막대. 작은 지면에서는 이쪽이 읽힌다 */
export function ElementBars({ counts }: { counts: Array<{ element: string; count: number }> }) {
  const max = Math.max(1, ...counts.map((row) => row.count));
  return (
    <View>
      {counts.map((row) => (
        <View key={row.element} style={styles.barRow}>
          <Text style={styles.barLabel}>{row.element}</Text>
          <View style={styles.barTrack}>
            <View
              style={{
                ...styles.barFill,
                width: `${Math.round((row.count / max) * 100)}%`,
                backgroundColor: ELEMENT_COLOR[row.element] ?? palette.inkMuted,
              }}
            />
          </View>
          <Text style={styles.barCount}>{row.count}</Text>
        </View>
      ))}
    </View>
  );
}

export function Evidence({ items }: { items: Array<{ label: string; detail: string }> }) {
  if (items.length === 0) return null;
  return (
    <View style={styles.evidenceBox} wrap={false}>
      <Text style={styles.evidenceHead}>이 말이 어디서 나왔냐면</Text>
      {items.map((item, index) => (
        <View
          key={`${item.label}-${index}`}
          style={index === items.length - 1 ? { flexDirection: "row" } : styles.evidenceRow}
        >
          <Text style={styles.evidenceBullet}>·</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.evidenceLabel}>{item.label}</Text>
            <Text style={styles.evidenceDetail}>{item.detail}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

export function Timeline({ items }: { items: Array<{ period: string; title: string; note: string; color: string }> }) {
  return (
    <View>
      {items.map((item, index) => (
        <View key={`${item.period}-${index}`} style={styles.timelineItem} wrap={false}>
          <View style={{ ...styles.timelineRail, backgroundColor: item.color }} />
          <View style={{ flex: 1 }}>
            <Text style={{ ...styles.timelinePeriod, color: item.color }}>{item.period}</Text>
            <Text style={styles.timelineTitle}>{item.title}</Text>
            <Text style={styles.timelineNote}>{item.note}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

export function Actions({ dos, avoids }: { dos: string[]; avoids: string[] }) {
  return (
    <View style={styles.actionColumns}>
      <View style={{ ...styles.actionColumn, backgroundColor: palette.accentSoft }}>
        <Text style={{ ...styles.actionHead, color: palette.accent }}>이렇게 해 보세요</Text>
        {dos.map((text, index) => (
          <View key={index} style={styles.actionItem}>
            <Text style={{ ...styles.actionBullet, color: palette.accent }}>·</Text>
            <Text style={styles.actionText}>{text}</Text>
          </View>
        ))}
      </View>
      <View style={{ ...styles.actionColumn, backgroundColor: palette.warmSoft }}>
        <Text style={{ ...styles.actionHead, color: palette.warm }}>이건 잠시 미뤄 두세요</Text>
        {avoids.map((text, index) => (
          <View key={index} style={styles.actionItem}>
            <Text style={{ ...styles.actionBullet, color: palette.warm }}>·</Text>
            <Text style={styles.actionText}>{text}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export const partStyles = styles;

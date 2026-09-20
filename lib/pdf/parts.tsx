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
    padding: space.md,
    marginTop: space.xs,
  },
  evidenceRow: { flexDirection: "row", marginBottom: space.xs },
  evidenceLabel: {
    ...type.labelSm,
    fontWeight: 700,
    color: palette.accent,
    width: 118,
    paddingRight: space.sm,
  },
  evidenceDetail: { ...type.bodySm, color: palette.ink, flex: 1 },
  // ─ 원국표 ─
  chartRow: { flexDirection: "row", gap: space.xs },
  chartCell: {
    flex: 1,
    borderWidth: 1,
    borderColor: palette.tint,
    borderRadius: radius.lg,
    overflow: "hidden",
  },
  chartCellHead: {
    backgroundColor: palette.tint,
    paddingVertical: 4,
    alignItems: "center",
  },
  chartCellHeadText: { ...type.labelSm, fontWeight: 600, color: palette.ink },
  chartGanji: { ...type.headlineMd, fontWeight: 700, textAlign: "center", marginTop: space.sm },
  chartMeta: { ...type.labelSm, color: palette.inkMuted, textAlign: "center", marginTop: 2 },
  chartFoot: { ...type.labelSm, color: palette.inkFaint, textAlign: "center", marginTop: space.xs, marginBottom: space.sm },
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

/** 원국 네 기둥 — 지면에서는 네 칸을 나란히 편다 */
export interface PillarCell {
  slot: string;
  ganji: string;
  stemGod: string;
  branchGod: string;
  stage: string;
  color: string;
}

export function PillarsTable({ cells }: { cells: PillarCell[] }) {
  return (
    <View style={styles.chartRow}>
      {cells.map((cell) => (
        <View key={cell.slot} style={styles.chartCell}>
          <View style={styles.chartCellHead}>
            <Text style={styles.chartCellHeadText}>{cell.slot}</Text>
          </View>
          <Text style={{ ...styles.chartGanji, color: cell.color }}>{cell.ganji}</Text>
          <Text style={styles.chartMeta}>
            {cell.stemGod} · {cell.branchGod}
          </Text>
          <Text style={styles.chartFoot}>{cell.stage}</Text>
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
      {items.map((item, index) => (
        <View key={`${item.label}-${index}`} style={index === items.length - 1 ? { flexDirection: "row" } : styles.evidenceRow}>
          <Text style={styles.evidenceLabel}>{item.label}</Text>
          <Text style={styles.evidenceDetail}>{item.detail}</Text>
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

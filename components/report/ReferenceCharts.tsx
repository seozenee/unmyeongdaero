"use client";

import { useId } from "react";
import { parseGanji, ELEMENT_LABEL, type FiveElement } from "@/lib/saju/ganji";
import { branchTenGod, tenGod, type Branch, type Stem } from "@/lib/manse/tables";
import { buildRenzulliReading, RENZULLI_SOURCE } from "@/lib/manse/renzulli";
import type { ElementCounts, FourPillarsInput } from "@/lib/saju/modules";

const COLORS: Record<FiveElement, string> = { wood: "#16a34a", fire: "#e52329", earth: "#f7c913", metal: "#9ba3af", water: "#2860ed" };
const NAMES: Record<FiveElement, string> = { wood: "나무", fire: "불", earth: "흙", metal: "금", water: "물" };

export function ReferencePillars({ pillars, name, birthLabel }: { pillars: FourPillarsInput; name: string; birthLabel?: string }) {
  const day = parseGanji(pillars.day);
  return <section className="reference-pillar-panel" aria-label="나의 사주 원국">
    <h3>{name}님</h3>{birthLabel && <p className="reference-birth">{birthLabel}</p>}
    <div className="reference-pillars">{(["hour", "day", "month", "year"] as const).map(slot => {
      const value = pillars[slot] ? parseGanji(pillars[slot]!) : null;
      return <div key={slot} className="reference-pillar-column"><p>{{ hour: "시주", day: "일주", month: "월주", year: "년주" }[slot]}</p>
        {value ? [value.stem, value.branch].map((char, index) => <div key={index}>
          <div className="reference-pillar-cell" style={{ background: COLORS[char.element], color: char.element === "earth" || char.element === "metal" ? "#17202d" : "white" }}>
            <span>{ELEMENT_LABEL[char.element].han},{NAMES[char.element]}</span><strong>{char.han}</strong><span>{char.ko}</span>
          </div>
          <p className="reference-ten-god">{day ? index === 0 ? tenGod(day.stem.ko as Stem, char.ko as Stem) : branchTenGod(day.stem.ko as Stem, char.ko as Branch) : ""}</p>
        </div>) : <div className="reference-hour-unknown">시각<br />모름</div>}
      </div>;
    })}</div>
  </section>;
}

export function ReferenceElements({ counts, pillars }: { counts: ElementCounts; pillars: FourPillarsInput | null }) {
  const id = useId().replace(/:/g, "");
  const keys = ["wood", "fire", "earth", "metal", "water"] as const;
  const total = keys.reduce((sum, key) => sum + counts[key], 0);
  const points = keys.map((_, i) => ({ x: 180 + Math.sin(i * Math.PI * 2 / 5) * 116, y: 167 - Math.cos(i * Math.PI * 2 / 5) * 116 }));
  const day = pillars ? parseGanji(pillars.day) : null;
  return <section className="reference-element-panel"><div className="reference-chart-heading"><h3>오행 (생/극)</h3>{day && <span>일간: {day.stem.han} ({ELEMENT_LABEL[day.stem.element].ko})</span>}</div>
    <svg viewBox="0 0 360 340" role="img" aria-label={`오행 분포: ${keys.map(key => `${ELEMENT_LABEL[key].ko} ${counts[key]}개`).join(", ")}`}>
      <defs><marker id={`${id}-arrow`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#747b89" /></marker></defs>
      {points.flatMap((point, index) => [1, 2].map(step => {
        const end = points[(index + step) % 5]!; const dx = end.x - point.x; const dy = end.y - point.y; const length = Math.hypot(dx, dy);
        return <line key={`${index}-${step}`} x1={point.x + dx * 38 / length} y1={point.y + dy * 38 / length} x2={end.x - dx * 41 / length} y2={end.y - dy * 41 / length} stroke="#747b89" strokeWidth={step === 1 ? 2 : 1.5} strokeDasharray={step === 2 ? "6 5" : undefined} opacity={step === 1 ? 0.85 : 0.5} markerEnd={`url(#${id}-arrow)`} />;
      }))}
      {keys.map((key, index) => { const point = points[index]!; const share = total ? counts[key] / total : 0; return <g key={key}>
        <defs><clipPath id={`${id}-${key}`}><circle cx={point.x} cy={point.y} r="32" /></clipPath></defs>
        <circle cx={point.x} cy={point.y} r="35" fill="#202c36" stroke={COLORS[key]} strokeWidth="3" />
        <rect x={point.x - 32} y={point.y + 32 - share * 64} width="64" height={share * 64} fill={COLORS[key]} clipPath={`url(#${id}-${key})`} />
        <text x={point.x} y={point.y - 3} textAnchor="middle" fill="white" fontWeight="700" fontSize="15">{ELEMENT_LABEL[key].ko}</text>
        <text x={point.x} y={point.y + 18} textAnchor="middle" fill="white" fontWeight="600" fontSize="15">{Math.round(share * 100)}%</text>
      </g>; })}
    </svg><p className="reference-chart-note">실선은 상생, 점선은 상극 · 원국 {total}글자 기준, 반올림 표시</p>
  </section>;
}

export function RenzulliChart({ pillars }: { pillars: FourPillarsInput }) {
  const reading = buildRenzulliReading(pillars);
  if (!reading) return null;
  const circles = [{ x: 130, y: 118, color: "#80ffbe" }, { x: 230, y: 118, color: "#80d7ff" }, { x: 180, y: 205, color: "#fff08a" }];
  return <figure className="reading-book-figure reference-renzulli" data-book-ignore-swipe>
    <figcaption>렌줄리의 세 고리로 읽는 재능</figcaption>
    <svg viewBox="0 0 360 300" role="img" aria-label="학습과 이해, 창의성, 과제 집착력은 서로 연결해 살펴봅니다">
      {circles.map((circle, index) => <g key={index}><circle cx={circle.x} cy={circle.y} r="78" fill={circle.color} fillOpacity=".12" stroke={circle.color} strokeWidth="2" /><text x={circle.x + (index === 0 ? -21 : index === 1 ? 21 : 0)} y={circle.y + (index === 2 ? 27 : -8)} textAnchor="middle" fill="white" fontSize="15" fontWeight="700">{reading.dimensions[index]!.label}</text></g>)}
      <text x="180" y="155" textAnchor="middle" fill="white" fontSize="13" fontWeight="700">함께 자라는 재능</text>
    </svg>
    <div className="reference-index-list">{reading.dimensions.map(axis => <div key={axis.id}><span>{axis.label}</span><meter min={0} max={100} value={axis.index} aria-label={`${axis.label} 명리 근거 비중`} /><strong>{axis.index}</strong></div>)}</div>
    <p>명리 근거 비중 (0–100) · 능력 점수나 영재 확률이 아닙니다.{reading.unknownHour ? " 출생 시각을 몰라 시주는 제외했습니다." : ""}</p>
    <details className="reference-method"><summary>세 고리와 해석 지수의 근거</summary><p>{reading.scope}</p><p>{reading.method}</p>
      {reading.dimensions.map(axis => <div key={axis.id}><h4>{axis.ring}</h4><p>{axis.basis.join(" · ") || "원국에서 해당 단서가 적습니다."}</p><p>{axis.question}</p><p>연결 가중치: 인성 {axis.weights.resource} · 식상 {axis.weights.output} · 관성 {axis.weights.authority} · 비겁 {axis.weights.peer} · 재성 {axis.weights.wealth}</p></div>)}
      <a href={RENZULLI_SOURCE} target="_blank" rel="noreferrer">렌줄리 모형 원문 · 코네티컷대학교</a>
    </details>
  </figure>;
}

"use client";

import { useState } from "react";
import type { WritingSample } from "@/lib/reports/writing-sample";

/** 구매 전에 결과의 문체와 설명 깊이를 직접 읽는다. 개인 결과와 명확히 구분한다. */
export function ReadingSample({ sample }: { sample: WritingSample }) {
  const [expanded, setExpanded] = useState(false);
  return <section className="reading-sample" aria-label="풀이 문체 미리보기">
    <span className="reading-sample-eyebrow">미리 읽는 한 페이지 · 가상 명식 예시</span>
    <h2>“그래서 내가 그랬구나.”<br />이유까지 읽히는 사주</h2>
    <p className="reading-sample-intro">한 줄의 운세보다 오래 남을 이야기. 내 모습이 어떤 이유로 드러나는지, 생활에서는 어떻게 달라지는지 차근차근 풀어 드려요.</p>
    <div className="reading-sample-paper">
      <span className="reading-sample-chapter">풀이의 첫 이야기</span>
      <h3>{sample.lead}</h3>
      {sample.paragraphs.slice(0, expanded ? undefined : 2).map((paragraph, index) => <p key={index}>{paragraph}</p>)}
      {sample.paragraphs.length > 2 && <button type="button" aria-expanded={expanded} onClick={() => setExpanded(value => !value)}>{expanded ? "예시 접기 ↑" : "예시 끝까지 읽기 ↓"}</button>}
    </div>
    <p className="reading-sample-caption">{sample.caption}</p>
    <div className="reading-sample-points"><span>나의 특징</span><span>해석의 이유</span><span>생활 속 장면</span><span>선택의 방향</span></div>
  </section>;
}

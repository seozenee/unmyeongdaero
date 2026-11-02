import { readingParagraphs } from "@/lib/story/prose";

/** 단락 하나에 눈이 오래 갇히지 않도록 문장 두 개 정도로 호흡을 나눈다. */
export function ReadingProse({ text, opening = false }: { text: string; opening?: boolean }) {
  return <div className="report-prose">{readingParagraphs(text).map((paragraph, index) => {
    const match = opening && index === 0 ? paragraph.match(/^(.{12,90}?[.!?。])\s+([\s\S]+)$/) : null;
    return <p key={index}>{match ? <><strong>{match[1]}</strong> {match[2]}</> : paragraph}</p>;
  })}</div>;
}

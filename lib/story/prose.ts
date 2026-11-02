/** 문장의 뜻·순서는 보존하고, 긴 문단만 문장 경계에서 나눈다. */
export function readingParagraphs(text: string): string[] {
  return text.split(/\n\s*\n/).flatMap(block => {
    const clean = block.trim();
    if (!clean) return [];
    if (clean.length <= 180) return [clean];
    const sentences = clean.split(/(?<=[.!?。])\s+/);
    const result: string[] = [];
    let current: string[] = [];
    for (const sentence of sentences) {
      if (current.length && (current.length >= 2 || current.join(" ").length + sentence.length > 180)) {
        result.push(current.join(" ")); current = [];
      }
      current.push(sentence);
    }
    if (current.length) result.push(current.join(" "));
    return result;
  });
}

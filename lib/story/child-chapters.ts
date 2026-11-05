import { CHILD_CHAPTERS } from "../reports/catalog";
export { CHILD_CHAPTERS } from "../reports/catalog";

export function childChapterFor(title: string) {
  return CHILD_CHAPTERS.findIndex(chapter => (chapter.titles as readonly string[]).includes(title));
}

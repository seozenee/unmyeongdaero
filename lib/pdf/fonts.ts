import "server-only";

import path from "node:path";
import { Font } from "@react-pdf/renderer";

/**
 * 한글 글꼴을 PDF 에 심는다.
 *
 * 받는 사람 컴퓨터에 무엇이 깔려 있든 같은 모양으로 보여야 하므로 파일째 넣는다.
 * react-pdf 는 OTF·가변 글꼴을 읽지 못하므로 TTF 를 쓴다.
 *
 * 줄바꿈은 어절(띄어쓰기) 단위로만 한다. react-pdf 의 기본 하이픈 처리는 라틴 문자를 위한
 * 것이라 한글 어절을 엉뚱한 자리에서 쪼개므로, 낱말을 통째로 넘기도록 꺼 둔다.
 */
const DIR = path.join(process.cwd(), "assets/fonts");

let registered = false;

export function registerFonts() {
  if (registered) return;

  Font.register({
    family: "Pretendard",
    fonts: [
      { src: path.join(DIR, "Pretendard-Regular.ttf"), fontWeight: 400 },
      { src: path.join(DIR, "Pretendard-SemiBold.ttf"), fontWeight: 600 },
      { src: path.join(DIR, "Pretendard-Bold.ttf"), fontWeight: 700 },
    ],
  });

  // 낱말을 쪼개지 않는다 — 한글은 음절 단위로 끊으면 뜻이 흐려진다(DESIGN.md 의 keep-all 과 같은 규칙).
  Font.registerHyphenationCallback((word) => [word]);

  registered = true;
}

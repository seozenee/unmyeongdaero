// fal.ai 웹툰 에셋 기획서 — scripts/generate-webtoon-assets.mts 가 읽는다.
// (Node 타입 제거 실행을 위해 다른 TS 모듈을 import 하지 않는다)

export type WebtoonGuide = "seoha" | "yunseul" | "doham";

export const IMAGE_MODEL = "fal-ai/nano-banana";
export const EDIT_MODEL = "fal-ai/nano-banana/edit";
export const VIDEO_MODEL = "fal-ai/kling-video/v3/pro/image-to-video";

export const WEBTOON_STYLE =
  "Premium Korean webtoon illustration, cinematic digital painting with soft cel shading, dark obsidian palette with violet moonlight, vermilion and antique gold accents, delicate rim light, atmospheric depth, elegant and emotional, no text, no letters, no speech bubbles, no watermark, no logo.";

export const NEGATIVE_PROMPT = "text, letters, watermark, logo, distorted face, extra fingers, extra limbs, blurry, low quality, flicker";

export const CHARACTERS: Record<WebtoonGuide, string> = {
  seoha:
    "Seoha, a graceful Korean woman in her late twenties who reads saju under the moon. Long black hair in a low bun with a silver crescent-moon hairpin, calm half-lidded dark eyes, pale skin, gentle knowing expression. Wears a modern deep violet hanbok jeogori with fine silver embroidery and a dark skirt.",
  yunseul:
    "Yunseul, a bright Korean woman in her mid twenties who reads compatibility with red seal ink. Shoulder-length black hair tied with a vermilion daenggi ribbon, lively warm eyes, soft smile. Wears a cream jeogori with a vermilion skirt and a small red seal-stamp pendant, holds a calligraphy brush.",
  doham:
    "Doham, a calm Korean man in his early thirties, a scholar of destiny. Wears a black gat (traditional horsehair hat) and thin round glasses, neat short black hair, kind serious eyes. Wears a deep navy dopo robe with antique gold trim and carries an old thread-bound book.",
};

export interface ShotSpec {
  key: string;
  /** 캐릭터가 등장하면 캐릭터 시트를 기준 이미지로 넣어 얼굴·복장을 유지한다 */
  character: boolean;
  aspect: "3:4" | "16:9";
  prompt: string;
  motion: string;
}

const SCENE: Record<WebtoonGuide, string> = {
  seoha: "a secluded hanok study at the end of a moonlit alley, huge pale full moon with violet halo, drifting mist, fireflies",
  yunseul: "a small traditional ink workshop glowing with red paper lanterns, stacks of hanji paper, red seal stamps, warm vermilion light at dusk",
  doham: "an endless old library of thread-bound books, a single hanging lantern with golden light, floating dust motes",
};

function shotsFor(guide: WebtoonGuide): ShotSpec[] {
  const scene = SCENE[guide];
  const name = guide === "seoha" ? "Seoha" : guide === "yunseul" ? "Yunseul" : "Doham";
  return [
    { key: "intro-0", character: false, aspect: "3:4", prompt: `Establishing wide shot of ${scene}. Quiet, mysterious, inviting.`, motion: "slow cinematic push-in, mist and particles drifting, light gently shimmering, calm atmosphere" },
    { key: "intro-1", character: false, aspect: "3:4", prompt: `Low angle view along a stone path leading to the entrance of ${scene}. A warm light waits at the end.`, motion: "camera slowly dollies forward along the path, leaves and particles swaying" },
    { key: "intro-2", character: false, aspect: "3:4", prompt: `Close-up of a visitor's hand about to knock on an old wooden door with glowing paper panels, part of ${scene}.`, motion: "the hand knocks twice on the door, warm light flickers behind the paper panels" },
    { key: "intro-3", character: true, aspect: "3:4", prompt: `Inside ${scene}. ${name} stands with her or his back turned, seen as a dim silhouette against the light, incense smoke curling.`, motion: "incense smoke curls, fabric sways softly, the silhouette slightly turns the head" },
    { key: "intro-4", character: true, aspect: "3:4", prompt: `${name} turns and faces the viewer with a gentle knowing smile inside ${scene}, saju charts with hanja on the desk.`, motion: "the character slowly turns toward the camera, hair strands move, a soft blink, accessories glint" },
    { key: "intro-5", character: true, aspect: "3:4", prompt: `Close-up portrait of ${name} looking directly at the viewer, soft bokeh of candle light, intimate and warm.`, motion: "subtle breathing, a gentle blink, candle bokeh flickering, hair moving slightly" },
    { key: "panel-brush", character: true, aspect: "16:9", prompt: `Close-up of ${name}'s hand holding a fine brush over a saju chart paper with eight hanja characters, ink glowing faintly, ${scene} blurred behind.`, motion: "the brush tip touches the paper and the ink glows and spreads softly" },
    { key: "panel-second", character: false, aspect: "16:9", prompt: `Two old saju chart papers laid side by side on a dark wooden desk with red seal stamps and a candle, inside ${scene}.`, motion: "candle flame flickers, paper edges flutter slightly, dust floats" },
    { key: "panel-unfold", character: true, aspect: "16:9", prompt: `${name} unrolls a long scroll of destiny charts across the desk, glowing characters rising from it like fireflies, inside ${scene}.`, motion: "the scroll unrolls, glowing characters float upward, light sweeps across" },
    { key: "report-cover", character: true, aspect: "3:4", prompt: `${name} holds out a bound report book tied with a ribbon toward the viewer, elegant editorial composition, inside ${scene}.`, motion: "the character gently offers the book, the ribbon sways, particles drift in the light" },
    ...PRODUCT_COVERS.filter((cover) => cover.guide === guide).map(({ key, prompt, motion, portrait }) => ({
      key,
      // 포스터는 안내자의 얼굴로 파는 그림이라 캐릭터 시트를 기준으로 삼는다
      character: Boolean(portrait),
      aspect: (portrait ? "3:4" : "16:9") as "3:4" | "16:9",
      prompt: portrait ? prompt : `${prompt} Rendered inside ${scene}.`,
      motion,
    })),
  ];
}

/**
 * 상품 포스터.
 *
 * 어두운 빈 방에 흰 글씨를 얹으면 카드가 밋밋해진다. 장사가 되는 카드는 포스터다 —
 * 인물의 얼굴이 크게 앞에 나오고, 배경이 한 가지 색으로 쨍하게 받쳐 주고, 제목이
 * 들어갈 가운데가 비어 있어야 한다. 아래 프롬프트는 그 세 가지를 노린다.
 *
 * 세계관(달빛·먹·한옥)은 지키되 채도와 대비만 끌어올린다. 상품마다 다른 강조색을
 * 써서 카드가 나란히 놓였을 때 서로 구분되게 한다.
 */
const POSTER_PROMPT = (guide: WebtoonGuide, accent: string, subject: string) =>
  `Vertical movie-poster portrait. ${subject} Large head-and-shoulders composition, the face in the upper half and looking straight at the viewer, strong rim light, dramatic chiaroscuro. The background is a bold saturated ${accent} field with deep black vignette, glowing embers and fine particles. High contrast, rich saturation, polished and striking. The lower third is kept simple and uncluttered so large title lettering can sit over it.`;

const POSTERS: ReadonlyArray<{ key: string; guide: WebtoonGuide; accent: string; subject: string }> = [
  // ─ 재회·연애 (서하) ─
  { key: "poster-reunion-deep", guide: "seoha", accent: "deep crimson and vermilion", subject: "Seoha the moonlit saju reader, a single tear-like glint in her eye, a broken red thread drifting from her fingers." },
  { key: "poster-reunion", guide: "seoha", accent: "dusk violet and rose", subject: "Seoha the moonlit saju reader holding a single unsent letter to her chest, a paper lantern floating away behind her." },
  { key: "poster-love", guide: "seoha", accent: "warm coral and gold", subject: "Seoha the moonlit saju reader with a red thread looping from her fingertip into the dark, peach blossoms drifting past her face." },
  { key: "poster-consult", guide: "seoha", accent: "indigo and pale silver", subject: "Seoha the moonlit saju reader seated across an empty cushion, one hand open in invitation, a teacup steaming between them." },

  // ─ 궁합·관계 (윤슬) ─
  { key: "poster-compatibility", guide: "yunseul", accent: "hot pink and vermilion", subject: "Yunseul the compatibility reader pressing two red seal stamps together, two name papers glowing in her hands." },
  { key: "poster-parent-child", guide: "yunseul", accent: "warm amber and soft jade", subject: "Yunseul the compatibility reader holding a small child's paper hand-print beside a grown hand-print, both glowing faintly." },
  { key: "poster-yearly", guide: "yunseul", accent: "deep teal and gold", subject: "Yunseul the compatibility reader turning the page of a great wall calendar, twelve glowing month-glyphs circling her." },
  { key: "poster-child-talent", guide: "yunseul", accent: "bright violet and gold", subject: "Yunseul the compatibility reader cupping a small glowing seed in her palms, five coloured sparks orbiting it." },

  // ─ 인생·운세 (도담) ─
  { key: "poster-destiny-full", guide: "doham", accent: "antique gold and amber", subject: "Doham the scholar of destiny in his black gat and round glasses, holding an open thread-bound book of fate, golden hanja characters rising around him." },
  { key: "poster-life", guide: "doham", accent: "deep sapphire and silver", subject: "Doham the scholar unrolling a long scroll that becomes a river of light flowing past him into the dark." },

  // ─ 돈·일 (도담) ─
  { key: "poster-money", guide: "doham", accent: "rich gold and black", subject: "Doham the scholar with coins of light streaming through his open hands, some falling away into shadow below." },
  { key: "poster-career", guide: "doham", accent: "steel blue and copper", subject: "Doham the scholar standing before three glowing doorways of different shapes, one brush raised to mark the chosen one." },
  { key: "poster-business", guide: "doham", accent: "emerald green and old gold", subject: "Doham the scholar behind a merchant's brass coin scale, stacked coins and an abacus glinting, a shop lantern above him." },
  { key: "poster-health", guide: "doham", accent: "jade green and warm ivory", subject: "Doham the scholar with five faintly glowing orbs circling his chest in a slow ring, one dimmer than the rest." },

  // ─ 공부·아이 (도담) ─
  { key: "poster-study", guide: "doham", accent: "cool indigo and lamp amber", subject: "Doham the scholar leaning over a desk of open books, a single brush glowing where it touches the page." },
  { key: "poster-child-study", guide: "doham", accent: "soft sky blue and cream", subject: "Doham the scholar setting a small lamp beside a child-sized desk stacked with workbooks, warm light spilling across it." },
  { key: "poster-child-admission", guide: "doham", accent: "royal blue and cold silver", subject: "Doham the scholar holding up a single brush over a student's exam paper, a calendar of circled dates glowing faintly behind him." },
  { key: "poster-child-dream", guide: "doham", accent: "sunset orange and deep plum", subject: "Doham the scholar pointing toward several glowing paths forking into the dark, a pair of small shoes waiting at their start." },
];

/**
 * 상품 표지(소품 컷).
 *
 * 포스터가 안내자의 얼굴로 상품을 파는 그림이라면, 이쪽은 소품과 공간만으로 뜻을
 * 세우는 그림이다. 선반 카드처럼 작게 놓이는 자리에 쓴다.
 */
const PRODUCT_COVERS: ReadonlyArray<{ key: string; guide: WebtoonGuide; prompt: string; motion: string; portrait?: boolean }> = [
  ...POSTERS.map(({ key, guide, accent, subject }) => ({
    key,
    guide,
    portrait: true,
    prompt: POSTER_PROMPT(guide, accent, subject),
    motion: "subtle breathing, a slow blink, hair and fabric drifting, light particles rising",
  })),
  {
    key: "cover-admission",
    guide: "doham",
    prompt:
      "A student's study desk before dawn: stacked exam workbooks, a worn pencil, a single desk lamp casting warm light, a paper calendar on the wall with several dates circled in red ink, a window showing the first blue light of morning.",
    motion: "the lamp light flickers gently, dust motes drift, the calendar page lifts slightly in a draft",
  },
  {
    key: "cover-dream",
    guide: "doham",
    prompt:
      "A child's small shoes standing at the start of several glowing paths that fork outward into the dark, each path lit a different warm colour, fireflies marking the way, seen from behind and above.",
    motion: "the glowing paths pulse softly one after another, fireflies drift upward",
  },
  {
    key: "cover-talent",
    guide: "yunseul",
    prompt:
      "A small wooden desk with a child's drawing, an abacus, a tiny brush and a folded paper crane, each object wrapped in its own faint coloured glow, warm lantern light from above.",
    motion: "each object's glow brightens in turn, the paper crane's wing twitches, light particles rise",
  },
  {
    key: "cover-business",
    guide: "doham",
    prompt:
      "An old merchant's counter at night: a thick ledger open with columns of hanja, a brass coin scale, stacked coins with square holes, an abacus, a hanging shop lantern glowing amber above.",
    motion: "the lantern sways slightly, the scale pans tip and settle, coins glint as light moves across them",
  },
];

export const SHOTS: Record<WebtoonGuide, ShotSpec[]> = {
  seoha: shotsFor("seoha"),
  yunseul: shotsFor("yunseul"),
  doham: shotsFor("doham"),
};

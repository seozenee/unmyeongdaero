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
    ...PRODUCT_COVERS.filter((cover) => cover.guide === guide).map(({ key, prompt, motion, portrait, character }) => ({
      key,
      // 안내자가 주인공인 포스터(상담)만 캐릭터 시트를 기준으로 삼는다.
      // 나머지는 손님의 이야기를 그리므로 기준 이미지 없이 글로만 그린다.
      character: Boolean(character),
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
 * 그림 한 장이 상품을 설명하고, 배경이 한 가지 색으로 쨍하게 받쳐 주고, 제목이
 * 들어갈 아래쪽이 비어 있어야 한다.
 *
 * 한동안 열여덟 장 모두 안내자의 얼굴로 찍었다. 카드끼리는 색으로 구분됐지만,
 * 어느 카드도 무엇을 파는지 말하지 못했다. 대학사주 카드에 안내자가 붓을 들고 있으면
 * 손님은 "이게 내 아이 입시와 무슨 상관인가" 를 한 번 더 생각해야 한다.
 *
 * 그래서 포스터의 주인공을 안내자에서 손님의 이야기로 옮긴다. 대학사주는 아이가 자라
 * 대학 문을 들어서는 장면이고, 사업사주는 처음 가게 문을 여는 장면이다. 영상도 그 한
 * 장면이 움직이는 5초다 — 아이가 문을 지나 걸어 들어가고, 간판 등불이 켜진다.
 *
 * 안내자가 주인공인 포스터는 상담 하나뿐이다. 그 상품이 파는 것이 사람을 만나는
 * 일이라서다.
 *
 * 세계관(달빛·먹·한옥)은 지키되 채도와 대비만 끌어올린다. 상품마다 다른 강조색을
 * 써서 카드가 나란히 놓였을 때 서로 구분되게 한다.
 */
const POSTER_PROMPT = (accent: string, subject: string) =>
  `Vertical movie-poster illustration, cinematic storytelling composition. ${subject} One clear focal subject placed in the upper two thirds, strong rim light, dramatic chiaroscuro. The background is a bold saturated ${accent} field with a deep black vignette, glowing embers and fine particles. High contrast, rich saturation, polished and striking. The lower third is kept simple and uncluttered so large title lettering can sit over it.`;

interface PosterSpec {
  key: string;
  guide: WebtoonGuide;
  accent: string;
  /** 그림. 상품이 약속하는 장면 — 안내자가 아니라 손님의 이야기다 */
  subject: string;
  /** 5초 동안 그 장면에서 일어나는 일 */
  motion: string;
  /** 안내자가 주인공인 포스터만. 캐릭터 시트를 기준 이미지로 넣는다 */
  character?: boolean;
}

const POSTERS: ReadonlyArray<PosterSpec> = [
  // ─ 재회·연애 (서하) ─
  {
    key: "poster-reunion-deep",
    guide: "seoha",
    accent: "deep crimson and vermilion",
    subject:
      "A young Korean woman alone at a rain-wet night bus stop, turned back toward the empty street where a man's figure is walking away into the dark. A snapped red thread hangs in the air between them, its two cut ends trembling toward each other.",
    motion: "rain falls through the lamp light, the two cut ends of the red thread drift closer and almost touch, her hair and coat move in the wind",
  },
  {
    key: "poster-reunion",
    guide: "seoha",
    accent: "dusk violet and rose",
    subject:
      "A young Korean woman sitting at a paper window late at night, holding an unsent letter against her chest. Outside in the dark, a paper lantern that had drifted away is floating back toward her window.",
    motion: "the lantern drifts back to the window and its light brightens across her face, she slowly lifts her eyes, blossoms drift past",
  },
  {
    key: "poster-love",
    guide: "seoha",
    accent: "warm coral and gold",
    subject:
      "A night street under blossom trees where two young strangers pass each other without looking. A glowing red thread loops from the woman's fingertip and reaches toward the man's hand, and their two shadows on the ground lean together.",
    motion: "the red thread stretches between them and the two shadows lean closer, blossom petals swirl past, lantern light pulses warmly",
  },
  {
    key: "poster-consult",
    guide: "seoha",
    accent: "indigo and pale silver",
    // 안내자를 만나는 일 자체가 상품이라 유일하게 얼굴을 앞세운다
    character: true,
    subject:
      "Seoha the moonlit saju reader seated on a floor cushion behind a low tea table, one hand open in invitation toward the empty cushion in front of the viewer, two cups steaming between them.",
    motion: "steam rises from the two cups, she gestures gently toward the empty seat and blinks once, candle light flickers",
  },

  // ─ 궁합·관계 (윤슬) ─
  {
    key: "poster-compatibility",
    guide: "yunseul",
    accent: "hot pink and vermilion",
    subject:
      "A young Korean couple sitting face to face at a low table in a dark room, fingertips almost touching. Between them two saju chart papers slide over each other and their glowing characters merge into one single pattern.",
    motion: "the two chart papers slide together and their glowing characters merge into one pattern, their fingertips almost touch",
  },
  {
    key: "poster-parent-child",
    guide: "yunseul",
    accent: "warm amber and soft jade",
    subject:
      "A mother and her young child sitting side by side on a wooden hanok porch at dusk, both looking the same way. Their two long shadows stretch out behind them and overlap into one single shape.",
    motion: "the two shadows slowly overlap into one, the child leans against the parent's shoulder, lantern light warms the porch",
  },
  {
    key: "poster-yearly",
    guide: "yunseul",
    accent: "deep teal and gold",
    subject:
      "A young Korean woman standing at an open gate on the first night of the new year, lighting the first of twelve lanterns that hang in a great ring around her, each lantern glowing a different seasonal colour.",
    motion: "she lights the first lantern and the light runs around the ring from one lantern to the next, snow drifts past",
  },
  {
    key: "poster-child-talent",
    guide: "yunseul",
    accent: "bright violet and gold",
    subject:
      "A small Korean child holding out both palms in the dark. A tiny seed in the child's hands breaks open and five sprouts of coloured light rise and unfold above it.",
    motion: "the seed opens and five coloured lights rise and unfold one after another, the child's eyes widen in wonder",
  },

  // ─ 인생·운세 (도담) ─
  {
    key: "poster-destiny-full",
    guide: "doham",
    accent: "antique gold and amber",
    subject:
      "An endless hall of thread-bound books where one person's whole life stands in a row of lit silhouettes — a crawling baby, a running child, a young adult, a bent elder — all strung together by a single thread of golden light.",
    motion: "the thread of golden light runs through the row of silhouettes one by one, dust motes float, pages lift in a draft",
  },
  {
    key: "poster-life",
    guide: "doham",
    accent: "deep sapphire and silver",
    subject:
      "A lone figure walking away along a long road that glows like a river of light. On both sides of the road, scenes from a life hang in the dark like paper lanterns.",
    motion: "the figure walks on and the lanterns of memory light up one after another as they pass, the road of light flows onward",
  },

  // ─ 돈·일 (도담) ─
  {
    key: "poster-money",
    guide: "doham",
    accent: "rich gold and black",
    subject:
      "A night market street where a merchant's two open hands catch a pouring stream of glowing coins from above, while a few coins slip between the fingers and fall away into the dark below.",
    motion: "coins of light pour into the hands and a few slip through and fall away, market lanterns sway overhead",
  },
  {
    key: "poster-career",
    guide: "doham",
    accent: "steel blue and copper",
    subject:
      "A person seen from behind standing before three doorways of different shapes in a dark hall. One of the three doors is swinging open and spilling bright light over them.",
    motion: "one of the three doors swings open and light floods over the figure while the other two dim, dust turns in the light",
  },
  {
    key: "poster-business",
    guide: "doham",
    accent: "emerald green and old gold",
    subject:
      "A shopkeeper pushing open the doors of a small shop for the very first time at dusk. The shop lantern above the entrance is flaring alight and the silhouettes of customers are coming up the street.",
    motion: "the lantern flares alight, the doors swing open and customer silhouettes come up the street toward the shop",
  },
  {
    key: "poster-health",
    guide: "doham",
    accent: "jade green and warm ivory",
    subject:
      "A person sitting in quiet meditation seen from the side in the dark, five softly glowing orbs circling the body in a slow ring, one of the five noticeably dimmer than the rest.",
    motion: "the five orbs circle slowly around the body, the dim one flickers and slowly regains its light, breathing is visible",
  },

  // ─ 공부·아이 (도담) ─
  {
    key: "poster-study",
    guide: "doham",
    accent: "cool indigo and lamp amber",
    subject:
      "A student at a desk before dawn under a single lamp, pen in hand. Where the pen touches the page the characters light up and rise into the air, and the window behind shows the first blue light of morning.",
    motion: "characters light up and rise from the page as the pen moves, the first daylight grows at the window",
  },
  {
    key: "poster-child-study",
    guide: "doham",
    accent: "soft sky blue and cream",
    subject:
      "A small child sitting at a child-sized desk stacked with workbooks in a dark room, while a parent's hands set a small warm lamp down beside the books.",
    motion: "the parent's hands set the lamp down and its warm light spreads across the desk, the child looks up and smiles",
  },
  {
    key: "poster-child-admission",
    guide: "doham",
    accent: "royal blue and cold silver",
    subject:
      "A tall young student with a backpack stepping through the great stone gate of a university at dawn. Faint translucent silhouettes of the same child when younger — a small child with a satchel, a schoolchild with a workbook — walk in a line behind, and two parents watch from the side.",
    motion: "the student walks forward through the gate as blossom petals blow past, the faint younger silhouettes fade one by one, the parents lean together watching",
  },
  {
    key: "poster-child-dream",
    guide: "doham",
    accent: "sunset orange and deep plum",
    subject:
      "A small child standing at the start of several glowing paths that fork outward into the dark. At the end of each path stands the faint silhouette of a different grown-up future — one holding a brush, one holding a tool, one standing on a stage.",
    motion: "each path lights up in turn and the grown-up silhouette at its end grows clearer, the child takes one step forward",
  },
];

/**
 * 상품 표지(소품 컷).
 *
 * 포스터가 안내자의 얼굴로 상품을 파는 그림이라면, 이쪽은 소품과 공간만으로 뜻을
 * 세우는 그림이다. 선반 카드처럼 작게 놓이는 자리에 쓴다.
 */
const PRODUCT_COVERS: ReadonlyArray<{
  key: string;
  guide: WebtoonGuide;
  prompt: string;
  motion: string;
  portrait?: boolean;
  character?: boolean;
}> = [
  ...POSTERS.map(({ key, guide, accent, subject, motion, character }) => ({
    key,
    guide,
    portrait: true,
    character,
    prompt: POSTER_PROMPT(accent, subject),
    motion,
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

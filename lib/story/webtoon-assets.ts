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
  ];
}

export const SHOTS: Record<WebtoonGuide, ShotSpec[]> = {
  seoha: shotsFor("seoha"),
  yunseul: shotsFor("yunseul"),
  doham: shotsFor("doham"),
};

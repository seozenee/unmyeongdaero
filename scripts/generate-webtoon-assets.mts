#!/usr/bin/env node
// fal.ai 로 웹툰 에셋을 만든다: 캐릭터 시트(Nano Banana) → 컷 이미지(Nano Banana edit, 캐릭터 유지) → 움직이는 컷(Kling image-to-video).
// 결과는 public/webtoon/{guide}/ 에 저장하고 lib/story/webtoon-manifest.json 에 기록한다. 이미 있는 파일은 건너뛴다(재과금 방지).
//
//   pnpm webtoon:generate --dry-run              호출 없이 생성 계획만 출력
//   pnpm webtoon:generate                        전체 생성
//   pnpm webtoon:generate --guide seoha          안내자 한 명만
//   pnpm webtoon:generate --only intro-0,intro-4 특정 컷만
//   pnpm webtoon:generate --no-video             이미지만
//   pnpm webtoon:generate --force                기존 파일도 다시 생성
import { fal } from "@fal-ai/client";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { CHARACTERS, EDIT_MODEL, IMAGE_MODEL, NEGATIVE_PROMPT, SHOTS, VIDEO_MODEL, WEBTOON_STYLE } from "../lib/story/webtoon-assets.ts";
import type { ShotSpec, WebtoonGuide } from "../lib/story/webtoon-assets.ts";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const MANIFEST_PATH = resolve(root, "lib/story/webtoon-manifest.json");

type Manifest = Record<string, Record<string, { image: string; video?: string }>>;

function loadEnvLocal() {
  const path = resolve(root, ".env.local");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (match && !process.env[match[1]!]) process.env[match[1]!] = match[2]!.replace(/^["']|["']$/g, "");
  }
}

const argv = process.argv.slice(2);
const hasFlag = (name: string) => argv.includes(`--${name}`);
const option = (name: string) => {
  const index = argv.indexOf(`--${name}`);
  return index >= 0 ? argv[index + 1] : undefined;
};

const dryRun = hasFlag("dry-run");
const withVideo = !hasFlag("no-video");
const force = hasFlag("force");
const guides = (option("guide")?.split(",") ?? Object.keys(SHOTS)) as WebtoonGuide[];
const only = option("only")?.split(",");

const manifest: Manifest = existsSync(MANIFEST_PATH) ? JSON.parse(readFileSync(MANIFEST_PATH, "utf8")) : {};
const saveManifest = () => writeFileSync(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`);

async function download(url: string, path: string) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`다운로드 실패 ${response.status}: ${url}`);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, Buffer.from(await response.arrayBuffer()));
}

async function uploadLocal(path: string, type: string): Promise<string> {
  return fal.storage.upload(new Blob([readFileSync(path)], { type }));
}

async function generateImage(endpoint: string, input: Record<string, unknown>): Promise<string> {
  const result = await fal.subscribe(endpoint, { input, logs: false });
  const url = (result.data as { images?: Array<{ url: string }> }).images?.[0]?.url;
  if (!url) throw new Error(`${endpoint} 응답에 이미지가 없습니다 (request ${result.requestId})`);
  return url;
}

async function generateVideo(startImageUrl: string, motion: string): Promise<string> {
  const result = await fal.subscribe(VIDEO_MODEL, {
    input: {
      prompt: `${motion}. Keep the illustration style and the character identical. Seamless gentle loop feeling.`,
      start_image_url: startImageUrl,
      duration: "5",
      generate_audio: false,
      negative_prompt: NEGATIVE_PROMPT,
    },
    logs: false,
  });
  const url = (result.data as { video?: { url: string } }).video?.url;
  if (!url) throw new Error(`${VIDEO_MODEL} 응답에 영상이 없습니다 (request ${result.requestId})`);
  return url;
}

function plan() {
  let images = 0;
  let videos = 0;
  for (const guide of guides) {
    if (force || !existsSync(resolve(root, `public/webtoon/${guide}/character.webp`))) images += 1;
    for (const shot of SHOTS[guide].filter((item) => !only || only.includes(item.key))) {
      if (force || !existsSync(resolve(root, `public/webtoon/${guide}/${shot.key}.webp`))) images += 1;
      if (withVideo && (force || !existsSync(resolve(root, `public/webtoon/${guide}/${shot.key}.mp4`)))) videos += 1;
    }
  }
  return { images, videos };
}

async function runShot(guide: WebtoonGuide, shot: ShotSpec, characterUrl: string | null) {
  const imagePath = resolve(root, `public/webtoon/${guide}/${shot.key}.webp`);
  const videoPath = resolve(root, `public/webtoon/${guide}/${shot.key}.mp4`);
  const entry = (manifest[guide] ??= {});

  if (force || !existsSync(imagePath)) {
    console.log(`  🖼  ${guide}/${shot.key} 이미지 생성…`);
    const prompt = `${WEBTOON_STYLE} ${shot.prompt}${shot.character ? " Keep the character's face, hairstyle, accessories and outfit exactly the same as in the reference image." : ""}`;
    const url =
      shot.character && characterUrl
        ? await generateImage(EDIT_MODEL, { prompt, image_urls: [characterUrl], aspect_ratio: shot.aspect, output_format: "webp" })
        : await generateImage(IMAGE_MODEL, { prompt, aspect_ratio: shot.aspect, output_format: "webp" });
    await download(url, imagePath);
  }
  entry[shot.key] = { ...entry[shot.key], image: `/webtoon/${guide}/${shot.key}.webp` };
  saveManifest();

  if (withVideo && (force || !existsSync(videoPath))) {
    console.log(`  🎞  ${guide}/${shot.key} 움직이는 컷 생성… (수 분 걸릴 수 있어요)`);
    const startUrl = await uploadLocal(imagePath, "image/webp");
    await download(await generateVideo(startUrl, shot.motion), videoPath);
  }
  if (existsSync(videoPath)) {
    entry[shot.key] = { ...entry[shot.key]!, video: `/webtoon/${guide}/${shot.key}.mp4` };
    saveManifest();
  }
}

async function main() {
  loadEnvLocal();
  const { images, videos } = plan();
  console.log(`[webtoon] 안내자 ${guides.join(", ")} · 새로 만들 이미지 ${images}장 · 영상 ${videos}개 (${IMAGE_MODEL} / ${EDIT_MODEL} / ${VIDEO_MODEL})`);
  if (dryRun) return;

  if (!process.env.FAL_KEY) {
    console.error("[webtoon] FAL_KEY 가 없습니다. .env.local 에 FAL_KEY=... 를 넣어 주세요.");
    process.exit(1);
  }
  fal.config({ credentials: process.env.FAL_KEY });

  const failures: string[] = [];
  for (const guide of guides) {
    console.log(`\n[webtoon] ${guide}`);
    const characterPath = resolve(root, `public/webtoon/${guide}/character.webp`);
    let characterUrl: string | null = null;
    try {
      if (force || !existsSync(characterPath)) {
        console.log("  👤 캐릭터 시트 생성…");
        const url = await generateImage(IMAGE_MODEL, {
          prompt: `${WEBTOON_STYLE} Character reference sheet, full body front view and a clear face close-up side by side on a plain dark background. ${CHARACTERS[guide]}`,
          aspect_ratio: "3:4",
          output_format: "webp",
        });
        await download(url, characterPath);
      }
      characterUrl = await uploadLocal(characterPath, "image/webp");
    } catch (error) {
      failures.push(`${guide}/character: ${(error as Error).message}`);
      console.error(`  ✗ 캐릭터 시트 실패 — 캐릭터 컷은 텍스트 설명만으로 생성합니다`, error);
    }

    for (const shot of SHOTS[guide].filter((item) => !only || only.includes(item.key))) {
      try {
        await runShot(guide, shot, characterUrl);
      } catch (error) {
        failures.push(`${guide}/${shot.key}: ${(error as Error).message}`);
        console.error(`  ✗ ${guide}/${shot.key} 실패`, error);
      }
    }
  }

  console.log(failures.length ? `\n[webtoon] 완료 · 실패 ${failures.length}건\n${failures.join("\n")}` : "\n[webtoon] 모두 완료");
  if (failures.length) process.exitCode = 1;
}

await main();

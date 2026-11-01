#!/usr/bin/env node
// fal.ai 로 웹툰 에셋을 만든다: 캐릭터 시트(Nano Banana) → 컷 이미지(Nano Banana edit, 캐릭터 유지) → 움직이는 컷(Kling image-to-video).
// 결과는 public/webtoon/{guide}/ 에 저장하고 lib/story/webtoon-manifest.json 에 기록한다. 이미 있는 파일은 건너뛴다(재과금 방지).
//
//   pnpm webtoon:generate --dry-run              호출 없이 생성 계획만 출력
//   pnpm webtoon:generate                        전체 생성
//   pnpm webtoon:generate --guide seoha          안내자 한 명만
//   pnpm webtoon:generate --guide gangho --concurrency 3  팩폭사주 전체 (최대 세 컷씩)
//   pnpm webtoon:generate --guide gangho --only character 캐릭터 시트 먼저 검토
//   pnpm webtoon:generate --only intro-0,intro-4 특정 컷만
//   pnpm webtoon:generate --no-video             이미지만
//   pnpm webtoon:generate --force                기존 파일도 다시 생성
import { fal } from "@fal-ai/client";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { CHARACTERS, EDIT_MODEL, IMAGE_MODEL, NEGATIVE_PROMPT, SHOTS, VIDEO_MODEL, WEBTOON_STYLE } from "../lib/story/webtoon-assets.ts";
import type { ShotSpec, WebtoonGuide } from "../lib/story/webtoon-assets.ts";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const MANIFEST_PATH = resolve(root, "lib/story/webtoon-manifest.json");
// 중단 후 같은 요청을 이어 받는다. 키·원문 대신 요청 ID와 입력 해시만 로컬에 보관한다.
const JOBS_PATH = resolve(root, ".data/fal-webtoon-jobs.json");
type Job = { endpoint: string; requestId: string; fingerprint: string };
const jobs: Record<string, Job> = existsSync(JOBS_PATH) ? JSON.parse(readFileSync(JOBS_PATH, "utf8")) : {};

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
const concurrency = Number(option("concurrency") ?? 1);
if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 3) throw new Error("concurrency는 1~3입니다");
for (const guide of guides) {
  if (!SHOTS[guide]) throw new Error(`알 수 없는 안내자: ${guide}`);
  for (const key of only ?? []) {
    if (key !== "character" && !SHOTS[guide].some(shot => shot.key === key)) throw new Error(`알 수 없는 컷: ${guide}/${key}`);
  }
}

const manifest: Manifest = existsSync(MANIFEST_PATH) ? JSON.parse(readFileSync(MANIFEST_PATH, "utf8")) : {};
const saveManifest = () => writeFileSync(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`);

async function download(url: string, path: string) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`다운로드 실패 ${response.status}: ${url}`);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(`${path}.part`, Buffer.from(await response.arrayBuffer()));
  renameSync(`${path}.part`, path);
}

async function uploadLocal(path: string, type: string): Promise<string> {
  return fal.storage.upload(new Blob([readFileSync(path)], { type }));
}

async function generate(jobKey: string, endpoint: string, input: Record<string, unknown>, sourcePath?: string) {
  // 업로드 URL은 실행마다 바뀐다. 같은 로컬 원본은 동일한 작업으로 이어 받는다.
  const stableInput = { ...input };
  if (sourcePath) {
    const sourceHash = createHash("sha256").update(readFileSync(sourcePath)).digest("hex");
    if ("image_urls" in stableInput) stableInput.image_urls = sourceHash;
    if ("start_image_url" in stableInput) stableInput.start_image_url = sourceHash;
  }
  const fingerprint = createHash("sha256").update(JSON.stringify(stableInput)).digest("hex");
  let job = jobs[jobKey];
  if (!job || job.fingerprint !== fingerprint || job.endpoint !== endpoint || force) {
    const queued = await fal.queue.submit(endpoint, { input });
    job = { endpoint, requestId: queued.request_id, fingerprint };
    jobs[jobKey] = job;
    mkdirSync(dirname(JOBS_PATH), { recursive: true });
    writeFileSync(JOBS_PATH, `${JSON.stringify(jobs, null, 2)}\n`, { mode: 0o600 });
  }
  console.log(`    요청 ${jobKey}: ${job.requestId}`);
  await fal.queue.subscribeToStatus(endpoint, { requestId: job.requestId, logs: false, pollInterval: 5000 });
  return fal.queue.result(endpoint, { requestId: job.requestId });
}

async function generateImage(jobKey: string, endpoint: string, input: Record<string, unknown>, sourcePath?: string): Promise<string> {
  const result = await generate(jobKey, endpoint, input, sourcePath);
  const url = (result.data as { images?: Array<{ url: string }> }).images?.[0]?.url;
  if (!url) throw new Error(`${endpoint} 응답에 이미지가 없습니다 (request ${result.requestId})`);
  return url;
}

async function generateVideo(jobKey: string, startImageUrl: string, motion: string, sourcePath: string): Promise<string> {
  const result = await generate(jobKey, VIDEO_MODEL, {
      prompt: `${motion}. Keep the illustration style and the character identical. Seamless gentle loop feeling.`,
      start_image_url: startImageUrl,
      duration: "5",
      generate_audio: false,
      negative_prompt: NEGATIVE_PROMPT,
  }, sourcePath);
  const url = (result.data as { video?: { url: string } }).video?.url;
  if (!url) throw new Error(`${VIDEO_MODEL} 응답에 영상이 없습니다 (request ${result.requestId})`);
  return url;
}

function plan() {
  let images = 0;
  let videos = 0;
  for (const guide of guides) {
    // 캐릭터 시트는 --force 로도 다시 뽑지 않는다. 모든 캐릭터 컷이 이 한 장을 기준으로
    // 그려져 있어, 여기서 얼굴이 바뀌면 이미 만들어 둔 컷들과 다른 사람이 된다.
    // 정말 새 얼굴이 필요하면 character.webp 를 직접 지운다.
    if (!existsSync(resolve(root, `public/webtoon/${guide}/character.webp`))) images += 1;
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
        ? await generateImage(`${guide}/${shot.key}/image`, EDIT_MODEL, { prompt, image_urls: [characterUrl], aspect_ratio: shot.aspect, output_format: "webp" }, resolve(root, `public/webtoon/${guide}/character.webp`))
        : await generateImage(`${guide}/${shot.key}/image`, IMAGE_MODEL, { prompt, aspect_ratio: shot.aspect, output_format: "webp" });
    await download(url, imagePath);
  }
  entry[shot.key] = { ...entry[shot.key], image: `/webtoon/${guide}/${shot.key}.webp` };
  saveManifest();

  if (withVideo && (force || !existsSync(videoPath))) {
    console.log(`  🎞  ${guide}/${shot.key} 움직이는 컷 생성… (수 분 걸릴 수 있어요)`);
    const startUrl = await uploadLocal(imagePath, "image/webp");
    await download(await generateVideo(`${guide}/${shot.key}/video`, startUrl, shot.motion, imagePath), videoPath);
  }
  if (existsSync(videoPath)) {
    entry[shot.key] = { ...entry[shot.key]!, video: `/webtoon/${guide}/${shot.key}.mp4` };
    saveManifest();
  }
}

async function main() {
  loadEnvLocal();
  const { images, videos } = plan();
  console.log(`[webtoon] 안내자 ${guides.join(", ")} · 새로 만들 이미지 ${images}장 · 영상 ${videos}개 · 동시 ${concurrency}컷 (${IMAGE_MODEL} / ${EDIT_MODEL} / ${VIDEO_MODEL})`);
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
      // plan() 과 같은 이유로 --force 를 보지 않는다 — 얼굴의 원본은 한 번만 뽑는다
      if (!existsSync(characterPath)) {
        console.log("  👤 캐릭터 시트 생성…");
        const url = await generateImage(`${guide}/character/image`, IMAGE_MODEL, {
          prompt: `${WEBTOON_STYLE} Character reference sheet, full body front view and a clear face close-up side by side on a plain dark background. ${CHARACTERS[guide]}`,
          aspect_ratio: "3:4",
          output_format: "webp",
        });
        await download(url, characterPath);
      }
      characterUrl = await uploadLocal(characterPath, "image/webp");
    } catch (error) {
      failures.push(`${guide}/character: ${safeError(error)}`);
      console.error(`  ✗ 캐릭터 시트 실패 — 얼굴이 달라지는 것을 막기 위해 이 안내자는 중단합니다: ${safeError(error)}`);
      continue;
    }

    const selected = SHOTS[guide].filter(item => !only || only.includes(item.key))
      .sort((a, b) => Number(b.key.startsWith("poster-")) - Number(a.key.startsWith("poster-")));
    let cursor = 0;
    await Promise.all(Array.from({ length: Math.min(concurrency, selected.length) }, async () => {
      while (cursor < selected.length) {
        const shot = selected[cursor++]!;
        try {
          await runShot(guide, shot, characterUrl);
        } catch (error) {
          failures.push(`${guide}/${shot.key}: ${safeError(error)}`);
          console.error(`  ✗ ${guide}/${shot.key} 실패: ${safeError(error)}`);
        }
      }
    }));
  }

  console.log(failures.length ? `\n[webtoon] 완료 · 실패 ${failures.length}건\n${failures.join("\n")}` : "\n[webtoon] 모두 완료");
  if (failures.length) process.exitCode = 1;
}

function safeError(error: unknown) {
  const message = error instanceof Error ? error.message : "unknown";
  return process.env.FAL_KEY ? message.split(process.env.FAL_KEY).join("[redacted]") : message;
}

await main();

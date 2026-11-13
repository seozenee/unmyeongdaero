import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "운명대로 | 나를 이해하는 사주 리포트";

export default async function OpengraphImage() {
  const font = await readFile(path.join(process.cwd(), "public/fonts/GapyeongHanseokbongB.woff"));
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", padding: "58px 76px", background: "#f2eee5", color: "#262923", fontFamily: "Hanseokbong" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #b9b9ab", paddingBottom: 26 }}>
        <div style={{ fontSize: 27 }}>나를 이해하는 사주 리포트</div>
        <div style={{ fontSize: 21, color: "#666c5c" }}>UNMYEONGDAERO</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", flex: 1, justifyContent: "space-between" }}>
        <div style={{ fontSize: 146, letterSpacing: "-0.065em", lineHeight: 1 }}>운명대로</div>
        <div style={{ display: "flex", width: 94, height: 94, alignItems: "center", justifyContent: "center", border: "2px solid #8e4335", borderRadius: 4, color: "#8e4335", fontSize: 57, transform: "rotate(-5deg)" }}>운</div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", borderTop: "1px solid #b9b9ab", paddingTop: 28 }}>
        <div style={{ display: "flex", flexDirection: "column", fontSize: 32, lineHeight: 1.5 }}>
          <div>타고난 나를 읽고,</div>
          <div>앞으로의 방향을 찾다.</div>
        </div>
        <div style={{ fontSize: 22, color: "#666c5c" }}>unmyeongdaero.com</div>
      </div>
    </div>,
    { ...size, fonts: [{ name: "Hanseokbong", data: font, style: "normal", weight: 700 }] },
  );
}

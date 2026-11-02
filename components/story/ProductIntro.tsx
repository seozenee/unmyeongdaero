"use client";

import dynamic from "next/dynamic";
import type { ReportProduct } from "@/lib/reports/catalog";
import type { WritingSample } from "@/lib/reports/writing-sample";
import { CinematicProductIntro } from "./CinematicProductIntro";

const LegacyProductIntro = dynamic(() => import("./LegacyProductIntro").then(module => module.LegacyProductIntro));

interface ProductIntroProps {
  writingSample?: WritingSample | null;
  report: ReportProduct;
  /** 이 상품을 이미 몇 사람이 받아 갔는지. 모르면 숨긴다 — 숫자를 지어내지 않는다 */
  soldCount?: number | null;
  /** 같은 고민을 보던 사람이 함께 보는 다른 풀이 */
  related?: ReportProduct[];
  onStart: () => void;
  onWatchIntro?: () => void;
  resuming?: boolean;
}

export function ProductIntro(props: ProductIntroProps) {
  return ["factbomb", "destiny-full", "life"].includes(props.report.slug)
    ? <CinematicProductIntro {...props} /> : <LegacyProductIntro {...props} />;
}

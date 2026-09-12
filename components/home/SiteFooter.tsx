import Link from "next/link";

// 전자상거래법 제10조 표시사항. 사업자등록증·통신판매업 신고증 기준.
const BUSINESS_INFO = [
  "상호명: 르노바 | 대표자: 이재호",
  "사업자등록번호: 656-26-02081 | 통신판매업신고: 제 2026-경기김포-0882 호",
  "주소: 경기도 김포시 김포한강8로148번길 102, 1층 1360호(마산동)",
  "고객센터: 010-9920-2486 | help@unmyeongdaero.com (평일 10:00 ~ 18:00)",
  "개인정보 보호책임자: 이재호",
];

export function SiteFooter() {
  return (
    <footer className="mt-space-xl flex flex-col gap-space-md pt-space-md text-outline">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="font-headline-md text-headline-md font-bold text-on-surface">운명대로</span>
          <span className="font-label-sm text-label-sm text-outline">unmyeongdaero.com</span>
        </div>
        <p className="font-body-sm text-body-sm leading-tight text-outline">
          현대인을 위한 가장 명쾌하고 솔직한 운명 리포트
        </p>
      </div>

      <div className="flex flex-col gap-1 font-label-sm text-label-sm text-outline">
        {BUSINESS_INFO.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 pt-2 font-label-sm text-label-sm text-on-surface-variant">
        <Link className="hover:text-on-surface" href="/terms">
          이용약관
        </Link>
        <Link className="font-semibold text-on-surface hover:text-on-surface" href="/privacy">
          개인정보처리방침
        </Link>
        <Link className="hover:text-on-surface" href="/refund">
          환불규정 안내
        </Link>
        {/* TODO: 카카오톡 채널 URL 확정 후 연결 */}
        <a className="hover:text-on-surface" href="#">
          카카오톡 1:1 상담
        </a>
      </div>

      <p className="mt-1 font-label-sm text-label-sm text-outline/60">
        © 2025 unmyeongdaero.com. All rights reserved. 본 서비스에서 제공하는 모든 해석 콘텐츠의 저작권은 운명대로에
        있습니다.
      </p>
    </footer>
  );
}

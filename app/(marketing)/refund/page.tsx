import type { Metadata } from "next";

export const metadata: Metadata = { title: "환불규정" };

// ⚠️ 초안: 운영 정책 확정 후 수정한다.
export default function RefundPage() {
  return (
    <>
      <h1>환불규정</h1>
      <p className="text-label-sm text-tertiary">초안 · 운영 정책 확정 후 수정됩니다.</p>
      <h2>리포트</h2>
      <ul>
        <li>결제 후 풀이 생성이 시작되기 전: 전액 환불</li>
        <li>풀이 생성이 시작된 이후: 디지털 콘텐츠 특성상 청약철회가 제한됩니다.</li>
        <li>시스템 오류로 풀이를 받지 못한 경우: 재생성 또는 전액 환불</li>
      </ul>
      <h2>AI 상담</h2>
      <ul>
        <li>질문을 한 번도 보내지 않은 세션: 전액 환불</li>
        <li>답변 생성 실패로 차감되지 않은 질문은 환불 대상 산정에서 제외됩니다.</li>
      </ul>
      <h2>문의</h2>
      <p>help@unmyeongdaero.com 또는 카카오톡 채널로 결제 ID와 함께 문의해 주세요.</p>
      <h2>판매자 정보</h2>
      <ul>
        <li>상호: 르노바 | 대표자: 이재호</li>
        <li>사업자등록번호: 656-26-02081</li>
        <li>통신판매업 신고번호: 제 2026-경기김포-0882 호</li>
        <li>주소: 경기도 김포시 김포한강8로148번길 102, 1층 1360호(마산동)</li>
        <li>고객센터: 010-9920-2486 | help@unmyeongdaero.com</li>
      </ul>
    </>
  );
}

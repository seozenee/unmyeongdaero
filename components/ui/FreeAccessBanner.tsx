import { isFreeAccess } from "@/lib/env";

// FREE_ACCESS=1 일 때만 뜨는 시험 모드 띠.
// 결제 없이 상품이 열리는 상태이므로, 켜져 있다는 사실이 눈에 띄어야 한다.
export function FreeAccessBanner() {
  if (!isFreeAccess) return null;

  return (
    <div className="pt-safe fixed inset-x-0 top-0 z-[70] mx-auto max-w-md bg-secondary-container px-margin py-1 text-center">
      <span className="font-label-sm text-label-sm text-on-secondary-container">
        시험 모드 · 결제 없이 모든 풀이가 열립니다
      </span>
    </div>
  );
}

import { Icon } from "@/components/ui/Icon";

export function TrustBanner() {
  return (
    <section className="mt-space-xl flex flex-col gap-space-sm rounded-xl bg-surface-container-low p-space-lg">
      <div className="flex items-center gap-space-xs text-primary">
        <Icon name="verified_user" className="text-[20px]" />
        <span className="font-label-md text-label-md">운명대로의 3가지 결제 약속</span>
      </div>
      <ul className="mt-1 flex flex-col gap-2">
        <li className="flex items-start gap-2 font-body-sm text-body-sm text-on-surface-variant">
          <span className="mt-1 text-xs font-bold text-secondary">01</span>
          <span>
            매달 나가는 자동 정기 결제가 일체 없는 <strong>100% 단건 결제</strong>입니다.
          </span>
        </li>
        <li className="flex items-start gap-2 font-body-sm text-body-sm text-on-surface-variant">
          <span className="mt-1 text-xs font-bold text-secondary">02</span>
          <span>
            구매하신 리포트는 계정 내 <strong>&apos;보관함&apos;에서 기간 제한 없이 영구 열람</strong> 가능합니다.
          </span>
        </li>
        <li className="flex items-start gap-2 font-body-sm text-body-sm text-on-surface-variant">
          <span className="mt-1 text-xs font-bold text-secondary">03</span>
          <span>
            입력하신 생년월일은 풀이 생성과 보관함 제공에만 쓰이며, 결제수단 정보는 PG사가 처리해 회사가 저장하지
            않습니다.
          </span>
        </li>
      </ul>
    </section>
  );
}

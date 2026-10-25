import { Icon } from "@/components/ui/Icon";

/**
 * 결제 약속 셋.
 *
 * 세로로 쌓인 번호 목록은 약관처럼 읽혀서 아무도 안 읽는다. 카드 셋을 옆으로 미는
 * 줄로 두면 적어도 한 장은 눈에 들어온다.
 */
const PROMISES: ReadonlyArray<{ icon: string; title: string; body: React.ReactNode }> = [
  {
    icon: "bolt",
    title: "100% 단건 결제",
    body: (
      <>
        매달 나가는 자동 정기 결제가 <strong>일체 없어요</strong>. 그런 결제 수단을 아예 만들어 두지 않았어요.
      </>
    ),
  },
  {
    icon: "inventory_2",
    title: "영구 열람",
    body: (
      <>
        구매한 리포트는 계정 <strong>보관함에서 기간 제한 없이</strong> 다시 열고 내려받을 수 있어요.
      </>
    ),
  },
  {
    icon: "shield",
    title: "정보는 풀이에만",
    body: (
      <>
        생년월일은 풀이 생성과 보관함에만 써요. 결제수단 정보는 <strong>PG사가 처리</strong>해 회사가 저장하지 않아요.
      </>
    ),
  },
];

export function TrustBanner() {
  return (
    <section className="mt-space-xl flex flex-col gap-space-sm">
      <div className="flex items-center gap-space-xs px-space-xs text-primary">
        <Icon name="verified_user" className="text-[20px]" />
        <span className="font-label-md text-label-md">운명대로의 3가지 결제 약속</span>
      </div>

      <ol className="no-scrollbar -mx-margin flex snap-x gap-space-sm overflow-x-auto px-margin pb-1">
        {PROMISES.map((promise, index) => (
          <li
            key={promise.title}
            className="flex w-[64vw] max-w-[15rem] shrink-0 snap-start flex-col gap-space-xs rounded-2xl bg-surface-container-low p-space-lg"
          >
            <span className="flex items-center gap-space-xs">
              <span className="font-label-sm text-label-sm font-bold text-secondary">
                {String(index + 1).padStart(2, "0")}
              </span>
              <Icon name={promise.icon} className="text-[18px] text-secondary" />
            </span>
            <span className="font-label-md text-label-md text-on-surface">{promise.title}</span>
            <p className="font-body-sm text-body-sm leading-relaxed text-on-surface-variant">{promise.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

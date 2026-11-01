/**
 * 명식을 펼치는 동안 보는 화면.
 *
 * 인증과 저장된 입력 정보를 확인하는 동안만 보인다.
 * 사주를 계산하면 완성된 미리보기와 구매 버튼을 함께 보낸다. 읽는 중 글을 교체하지 않는다.
 */
export default function ManseLoading() {
  return (
    <div className="flex w-full flex-col items-center gap-space-lg px-margin py-space-xl">
      {/* 붓끝이 글자를 짚는 동안 */}
      <div className="relative mt-space-xl flex h-24 w-24 items-center justify-center">
        <span className="absolute inset-0 rounded-full bg-primary/15 motion-safe:animate-ping" />
        <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-primary/20 font-headline-md text-headline-md text-primary">
          命
        </span>
      </div>

      <div className="flex flex-col items-center gap-space-xs text-center">
        <p className="font-headline-lg-mobile text-headline-lg-mobile tracking-tight text-on-surface">
          내 원국을 펼치고 있어요
        </p>
        <p className="font-body-md text-body-md text-on-surface-variant">
          입력하신 생년월일시를 확인하고,
          <br />
          여덟 글자를 정리하고 있어요.
        </p>
      </div>

      {/* 곧 들어찰 자리를 미리 보여 준다 — 뭐가 나올지 알면 기다릴 만해진다 */}
      <div className="mt-space-md flex w-full max-w-md flex-col gap-space-sm">
        {[0, 1, 2].map((row) => (
          <div key={row} className="flex flex-col gap-space-xs rounded-2xl bg-surface-container p-space-lg">
            <span className="h-3.5 w-full rounded-full bg-on-surface/10 motion-safe:animate-pulse" />
            <span className="h-3.5 w-3/5 rounded-full bg-on-surface/10 motion-safe:animate-pulse" />
          </div>
        ))}
      </div>

      <p className="font-label-sm text-label-sm text-outline">개인 풀이를 정리하는 중이에요 · 아직 결제 전이에요</p>
    </div>
  );
}

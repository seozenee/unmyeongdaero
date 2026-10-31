/**
 * 명식을 펼치는 동안 보는 화면.
 *
 * 이 길은 서버에서 두 가지를 한다 — 생년월일로 여덟 글자를 세우고, 그 값으로 "맞혀
 * 보이는" 문장을 AI 로 받아 둔다. 뒤쪽이 2~7초 걸린다.
 *
 * 그 몇 초를 빈 화면으로 두면 손님은 멈춘 줄 안다. 멈춘 줄 알면 뒤로 가거나 다시
 * 누르고, 다시 누르면 처음부터 또 기다린다.
 *
 * 그래서 기다리는 동안 무슨 일이 일어나고 있는지 보여 준다. 기다리는 시간이 같아도,
 * 까닭을 아는 기다림은 훨씬 짧게 느껴진다.
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
          여덟 글자를 펼치고 있어요
        </p>
        <p className="font-body-md text-body-md text-on-surface-variant">
          태어난 때의 하늘을 다시 세우고,
          <br />
          거기서 읽히는 것을 한 줄씩 적는 중이에요.
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

      <p className="font-label-sm text-label-sm text-outline">잠깐이면 돼요 · 아직 결제 전이에요</p>
    </div>
  );
}

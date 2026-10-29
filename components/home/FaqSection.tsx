import Link from "next/link";

/**
 * 자주 묻는 것.
 *
 * 결제 직전에 사람을 돌려세우는 질문은 늘 같은 여섯 개다. 그 답을 안쪽 약관으로
 * 보내지 말고 여기서 끝낸다.
 *
 * 접었다 펴는 아코디언으로 두었더니, 접힌 상태에서는 질문 여섯 줄만 남아 또 비어
 * 보였다. 물음과 답을 함께 띄운 카드로 옆으로 밀게 한다 — 묻고 답하는 말풍선 모양이라
 * 읽는 리듬도 대화에 가깝다.
 *
 * 답은 모두 실제 규정과 코드에 맞춘다. 환불은 /refund 의 문장을 줄인 것이고, 열람은
 * 보관함 구현 그대로다. 여기서 한 줄이라도 더 좋게 쓰면 그게 분쟁의 씨가 된다.
 */
const FAQ: ReadonlyArray<{ question: string; answer: React.ReactNode }> = [
  {
    question: "풀이는 얼마나 기다려요?",
    answer: (
      <>
        결제하면 바로 쓰기 시작해 보통 1~2분 안에 끝나요. 번호를 적어 두셨으면 다 쓰이는 대로 카카오톡으로 알려
        드리고, PDF 도 함께 보내 드려요.
      </>
    ),
  },
  {
    question: "매달 결제되는 건 아니죠?",
    answer: <>아니에요. 전부 단건 결제예요. 자동 정기 결제는 아예 만들어 두지 않았어요.</>,
  },
  {
    question: "한 번 사면 언제까지 봐요?",
    answer: (
      <>
        받은 리포트는 결제일로부터 12개월 동안 보관함에서 다시 열고 내려받을 수 있어요. 1:1 상담 세션은 열린 날부터 30일 동안
        이어서 물을 수 있어요.
      </>
    ),
  },
  {
    question: "환불이 되나요?",
    answer: (
      <>
        풀이 생성이 시작되기 전이라면 전액 환불해요. 시작된 뒤에는 디지털 콘텐츠라 청약철회가 제한되지만, 오류로 받지
        못했거나 설명과 다른 내용이 왔다면 재생성이나 환불을 해 드려요.{" "}
        <Link href="/refund" className="text-tertiary underline">
          환불규정
        </Link>
        에 자세히 적어 두었어요.
      </>
    ),
  },
  {
    question: "태어난 시를 몰라도 돼요?",
    answer: (
      <>
        돼요. 모르면 모른다고 두고, 시주 없이 읽을 수 있는 자리까지만 풀어요. 없는 글자를 있는 것처럼 지어내지 않아요.
      </>
    ),
  },
  {
    question: "생년월일은 어디에 써요?",
    answer: <>풀이를 세우고 보관함에 넣어 두는 데만 써요. 결제 수단 정보는 PG사가 처리해 회사가 저장하지 않아요.</>,
  },
];

export function FaqSection() {
  return (
    <section className="mt-space-xl flex flex-col gap-space-sm">
      <div className="px-space-xs">
        <span className="font-label-sm text-label-sm tracking-widest text-outline">FAQ</span>
        <h3 className="mt-0.5 font-headline-lg-mobile text-headline-lg-mobile text-on-surface">자주 묻는 것</h3>
      </div>

      <ol className="no-scrollbar -mx-margin flex snap-x gap-space-sm overflow-x-auto px-margin pb-1">
        {FAQ.map((item) => (
          <li key={item.question} className="w-[72vw] max-w-[17rem] shrink-0 snap-start">
            <div className="flex h-full flex-col gap-space-sm rounded-2xl bg-surface-container-low p-space-lg">
              {/* 묻는 말풍선 — 오른쪽 아래 꼬리 */}
              <p className="self-start rounded-2xl rounded-bl-sm bg-surface-container-highest px-space-md py-2 font-label-md text-label-md text-on-surface">
                {item.question}
              </p>
              <p className="font-body-sm text-body-sm leading-relaxed text-on-surface-variant">{item.answer}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

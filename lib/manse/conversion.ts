import type { PreviewContext } from "./preview";

/** 답을 전부 주기 전에 자기 경험과 연결하는 질문. 계산된 중심 성향에 맞춰 고른다. */
export function buildRecognitionHook(context: PreviewContext) {
  const hooks: Record<string, { question: string; scene: string; bridge: string }> = {
    인성: { question: "이유를 모르면, 쉽게 움직이지 않는 편이죠?", scene: "다들 그냥 넘어가는 일도 스스로 납득해야 마음이 놓이고, 대답하기 전에 혼자 정리할 시간이 필요하지 않으세요?", bridge: "이 성향이 왜 생기는지, 원국에서 먼저 보이는 부분이 있어요." },
    식상: { question: "시키는 대로만 할 때는 답답하지 않으세요?", scene: "설명을 듣고만 있을 때보다 직접 말하고 만들 때 생각이 정리되는데, 정작 할 말을 참아야 하는 자리에서는 금방 지치지 않으세요?", bridge: "표현하는 힘이 살아나는 자리와 막히는 자리가 다르게 보입니다." },
    관성: { question: "일은 끝났는데, 마음은 아직 못 쉬고 계시죠?", scene: "맡은 것은 끝내 놓고도 더 잘할 수 있었던 부분이 떠오르고, 남들은 괜찮다는데 혼자 기준을 높이고 있지는 않으세요?", bridge: "책임감이 강점이 되는 때와 스스로를 몰아붙이는 때를 나눠 봐야 해요." },
    재성: { question: "열심히 한 것보다, 무엇이 남았는지가 중요하죠?", scene: "애쓴 만큼 눈에 보이는 결과가 없으면 유난히 허무하고, 목표가 분명해질 때는 움직임도 빨라지지 않으세요?", bridge: "결과를 챙기는 힘이 어디에서 살아나는지부터 짚어 볼게요." },
    비겁: { question: "남이 시켜서보다, 내가 정해야 오래 가시죠?", scene: "스스로 고른 일은 쉽게 못 놓는데, 이유도 모르고 따라야 하는 자리에서는 하고 싶은 마음부터 사라지지 않으세요?", bridge: "자기 기준을 지키는 힘이 관계와 일에서 어떻게 달라지는지 보입니다." },
  };
  const group = context.basis.prominent?.term;
  const hook = group ? hooks[group] : undefined;
  if (!hook) return { question: "남들이 보는 모습과, 진짜 마음이 조금 다르죠?", scene: "괜찮다고 말하고 돌아섰는데도, 정작 하고 싶었던 말은 뒤늦게 떠오른 적이 있지 않으세요?", bridge: "겉으로 드러나는 모습과 가까운 사이에서의 반응을 함께 읽어 볼게요." };
  return hook;
}

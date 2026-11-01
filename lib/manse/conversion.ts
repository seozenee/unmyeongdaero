import type { PreviewContext } from "./preview";

/** 답을 전부 주기 전에 자기 경험과 연결하는 질문. 계산된 중심 성향에 맞춰 고른다. */
export function buildRecognitionHook(context: PreviewContext) {
  const blunt = context.speech === "반말";
  const hooks: Record<string, { question: string; scene: string; bridge: string }> = {
    인성: { question: "이유를 모르면, 쉽게 움직이지 않는 편이죠?", scene: "다들 그냥 넘어가는 일도 스스로 납득해야 마음이 놓이고, 대답하기 전에 혼자 정리할 시간이 필요하지 않으세요?", bridge: "이 성향이 왜 생기는지, 원국에서 먼저 보이는 부분이 있어요." },
    식상: { question: "시키는 대로만 할 때는 답답하지 않으세요?", scene: "설명을 듣고만 있을 때보다 직접 말하고 만들 때 생각이 정리되는데, 정작 할 말을 참아야 하는 자리에서는 금방 지치지 않으세요?", bridge: "표현하는 힘이 살아나는 자리와 막히는 자리가 다르게 보입니다." },
    관성: { question: "일은 끝났는데, 마음은 아직 못 쉬고 계시죠?", scene: "맡은 것은 끝내 놓고도 더 잘할 수 있었던 부분이 떠오르고, 남들은 괜찮다는데 혼자 기준을 높이고 있지는 않으세요?", bridge: "책임감이 강점이 되는 때와 스스로를 몰아붙이는 때를 나눠 봐야 해요." },
    재성: { question: "열심히 한 것보다, 무엇이 남았는지가 중요하죠?", scene: "애쓴 만큼 눈에 보이는 결과가 없으면 유난히 허무하고, 목표가 분명해질 때는 움직임도 빨라지지 않으세요?", bridge: "결과를 챙기는 힘이 어디에서 살아나는지부터 짚어 볼게요." },
    비겁: { question: "남이 시켜서보다, 내가 정해야 오래 가시죠?", scene: "스스로 고른 일은 쉽게 못 놓는데, 이유도 모르고 따라야 하는 자리에서는 하고 싶은 마음부터 사라지지 않으세요?", bridge: "자기 기준을 지키는 힘이 관계와 일에서 어떻게 달라지는지 보입니다." },
  };
  const group = context.basis.prominent?.term;
  const inner = context.basis.placements.find(p => p.position === "태어난 날의 아랫글자")?.term;
  const outer = context.basis.placements.find(p => p.position === "태어난 달의 아랫글자")?.term;
  let hook = group ? hooks[group] : undefined;
  if (inner === "편인" && (outer === "정관" || outer === "편관")) hook = {
    question: "밖에서는 잘해 내도, 혼자 쉴 시간이 꼭 필요하죠?",
    scene: "밖에서는 맡은 역할을 해내다가도, 집에 돌아오면 아무 말 없이 혼자 있고 싶어지지 않으세요? 사람을 싫어하는 것과 혼자 쉬어야 하는 것은 다른 이야기예요.",
    bridge: "사람들 앞에서의 모습과 편할 때의 모습을 함께 살펴볼게요.",
  };
  if (context.child) {
    const questions: Record<string, string> = { 인성: "아이가 이유를 알아야 움직이는 편인가요?", 식상: "아이가 듣기보다 직접 해 볼 때 더 집중하나요?", 관성: "아이가 잘한 일보다 틀린 하나를 더 오래 생각하나요?", 재성: "아이가 무엇을 마치면 되는지 알 때 더 집중하나요?", 비겁: "아이가 스스로 고른 일은 오래 붙잡는 편인가요?" };
    return { question: questions[group ?? ""] ?? "아이가 집에서와 밖에서 보이는 모습이 다른가요?", scene: "아이를 성실하다거나 고집이 세다는 한마디로 정하기 전에, 언제 의욕이 붙고 어떤 말에서 멈추는지 함께 살펴볼게요. 같은 부탁도 아이가 이해하고 선택할 여지가 있는지에 따라 반응이 달라질 수 있어요.", bridge: "아이가 평소 보인 모습과 나란히 놓고 읽어 보세요." };
  }
  if (blunt) {
    const informal: Record<string, { question: string; scene: string }> = {
      인성: { question: "왜 해야 하는지 모르면, 쉽게 안 움직이지?", scene: "남들은 넘어가는 설명도 네가 납득해야 마음이 놓이고, 답하기 전에 혼자 정리할 시간이 필요하지?" },
      식상: { question: "시키는 대로만 하라고 하면 답답하지?", scene: "듣고만 있을 때보다 직접 말하고 만들 때 생각이 정리되는데, 할 말을 참아야 하는 자리에서는 금방 지치지?" },
      관성: { question: "할 일은 끝났는데, 마음은 아직 못 쉬지?", scene: "남들은 괜찮다는데도 더 잘할 수 있었던 게 떠오르고, 혼자 기준을 높이고 있지 않아?" },
      재성: { question: "열심히 했다는 말보다, 뭐가 남았는지가 중요하지?", scene: "애쓴 만큼 결과가 안 보이면 유난히 허무하고, 목표가 분명해지면 움직임도 빨라지지?" },
      비겁: { question: "남이 시켜서보다, 네가 정해야 오래 가지?", scene: "네가 고른 일은 쉽게 못 놓는데, 이유도 모르고 따라야 하면 하고 싶은 마음부터 사라지지?" },
    };
    const selected = inner === "편인" && (outer === "정관" || outer === "편관")
      ? { question: "밖에서는 잘해 내도, 혼자 쉴 시간이 꼭 필요하지?", scene: "밖에서는 맡은 역할을 해내는데, 집에 오면 아무 말 없이 혼자 있고 싶지 않아? 사람이 싫은 것과 혼자 쉬어야 하는 건 다른 이야기야." }
      : informal[group ?? ""] ?? { question: "밖에서의 너와 편할 때의 너, 조금 다르지 않아?", scene: "어떤 사람 앞에서 편하고, 어떤 자리에서 더 신경 쓰이는지 같이 보자." };
    return { ...selected, bridge: "어떤 상황에서 이런 모습이 나오는지, 사주와 같이 보자." };
  }
  return hook ?? { question: "남들이 보는 모습과, 진짜 마음이 조금 다르죠?", scene: "괜찮다고 말하고 돌아섰는데도, 정작 하고 싶었던 말은 뒤늦게 떠오른 적이 있지 않으세요?", bridge: "겉으로 드러나는 모습과 가까운 사이에서의 반응을 함께 읽어 볼게요." };
}

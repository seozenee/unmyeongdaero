import type { PreviewContext, PreviewReading } from "../manse/preview";

type Focus = "life"|"love"|"reunion"|"pair"|"year"|"money"|"career"|"business"|"health"|"study"|"child";
type SalesFocus = {opening:string;turn:string;questions:[string,string,string];action:string;caution:string;focus:Focus};
export const SALES_FOCUS: Record<string,SalesFocus> = {
 "factbomb":{opening:"같은 실수, 이번에는 어디서 끊을까?",turn:"네가 붙들고 있는 것부터 짚어 보자",questions:["관계에서 반복하는 실수","돈과 일에서 손해 보는 선택","지금 놓아야 할 고집"],action:"요즘 반복된 갈등 하나를 적고, 네가 바꿀 행동 하나부터 정해 봐.",caution:"불편한 말을 들었다고 관계나 일을 바로 끊지 말고, 실제 상황과 비교해 봐.",focus:"life"},
 "destiny-full":{opening:"타고난 나와 앞으로의 선택을 한 번에",turn:"내 사주의 큰 줄기부터 연결해 볼까요",questions:["내 힘이 살아나는 일과 사람","재물·인연의 흐름이 겹치는 때","말년까지 이어 갈 삶의 기반"],action:"일·돈·관계 중 가장 답답한 한 가지를 먼저 정해 풀이와 연결하세요.",caution:"한 해의 좋은 흐름만 보고 오래 쌓은 기반을 한 번에 바꾸지 마세요.",focus:"life"},
 "life":{opening:"지금은 넓힐 때일까, 다시 다질 때일까?",turn:"지금의 선택이 다음 시기로 이어져요",questions:["지금 지나는 인생의 구간","방향을 바꿀 때 준비할 것","70·80대까지 지켜 갈 기반"],action:"지금 지킬 기반과 다음 시기에 새로 시작할 일을 나눠 보세요.",caution:"전환기라는 이유로 모든 일을 동시에 바꾸면 부담이 커져요.",focus:"life"},
 "yearly":{opening:"다가올 열두 달, 언제 움직이면 좋을까요?",turn:"같은 해에도 힘을 쓸 달과 점검할 달이 달라요",questions:["기회를 시험해 볼 달","돈·사람·일에서 점검할 달","올해 끝내고 다음 해로 넘길 일"],action:"계획을 열두 달에 똑같이 나누기보다 시작·점검·마무리할 달을 구분하세요.",caution:"좋은 달이라는 이유로 준비와 실제 조건을 생략하지 마세요.",focus:"year"},
 "love":{opening:"끌리는 사람과 오래 편한 사람은 다를까요?",turn:"내가 사랑을 시작하고 지키는 방식을 봐요",questions:["내 마음이 열리는 관계","인연의 단서가 겹치는 시기","가까워진 뒤 어긋나는 이유"],action:"연락 횟수보다 약속을 지키는 행동과 함께 있을 때의 편안함을 보세요.",caution:"시기가 좋다는 이유로 상대의 의사나 생활의 차이를 넘겨짚지 마세요.",focus:"love"},
 "reunion":{opening:"다시 연락하기 전에, 이 관계부터 읽어요",turn:"기다림을 이어 갈지 판단할 기준이 필요해요",questions:["두 사람이 어긋난 대화 방식","다시 연락하기 전 확인할 반응","기다림을 멈추거나 이어 갈 기준"],action:"연락할 이유와 전할 말을 짧게 정하고, 상대가 원치 않으면 멈추세요.",caution:"사주의 관계 흐름을 상대의 현재 마음이나 재회 약속으로 단정하지 마세요.",focus:"reunion"},
 "reunion-deep":{opening:"같은 이유로 다시 헤어지지 않으려면",turn:"다시 만나는 때보다 바뀌어야 할 관계의 조건부터",questions:["서로의 기대가 엇갈린 지점","관계를 다시 논의할 조건","재회 후에도 반복될 갈등"],action:"예전 갈등에서 내가 바꿀 행동과 상대에게 확인할 약속을 나누세요.",caution:"그리움만으로 예전의 갈등이 해결됐다고 생각하지 마세요.",focus:"reunion"},
 "compatibility":{opening:"잘 맞는 부분과 자꾸 부딪히는 부분",turn:"두 명식을 나란히 놓아야 보이는 차이가 있어요",questions:["편안함을 느끼는 생활의 기준","갈등이 커지는 말과 반응","오래 함께하기 위한 역할과 약속"],action:"돈·연락·혼자 쉬는 시간을 각각 어떻게 정할지 실제로 이야기하세요.",caution:"좋은 궁합이라는 말로 불편한 행동을 참거나, 차이가 있다는 이유로 단정하지 마세요.",focus:"pair"},
 "money":{opening:"버는 힘과 내 손에 남기는 힘",turn:"돈이 들어오는 방식과 새는 선택을 함께 봐요",questions:["내 강점을 수입으로 잇는 방식","공동 지출·거래에서 새는 부분","수입과 지출 계획을 점검할 시기"],action:"새 수입을 기대하기 전에 고정 지출·미수금·공동 부담부터 적어 보세요.",caution:"재물 흐름을 수익 보장으로 받아들이거나 감당하기 어려운 돈을 빌리지 마세요.",focus:"money"},
 "career":{opening:"내가 잘 버티는 일과 계속 소모되는 일",turn:"직업 이름보다 나에게 맞는 역할부터 봐요",questions:["의욕과 실력이 살아나는 환경","이직·독립 전에 확인할 조건","경력으로 쌓아야 할 강점"],action:"지금 일에서 잘한 결과 세 가지와 힘이 빠진 조건을 따로 적어 보세요.",caution:"이동의 흐름만 보고 보상·역할·계약 조건을 확인하기 전에 결정하지 마세요.",focus:"career"},
 "business":{opening:"내 간판을 걸면 어떤 방식으로 버틸까요?",turn:"시작할 힘과 오래 운영할 힘을 나눠 봐요",questions:["혼자 할 일과 맡겨야 할 일","고객·수금·동업에서 정할 기준","규모를 늘리기 전에 볼 조건"],action:"고객 한 유형과 제공할 가치, 비용과 수금 시점을 먼저 정하세요.",caution:"역할·지분·손실 부담을 정하지 않은 채 친분으로 동업을 시작하지 마세요.",focus:"business"},
 "health":{opening:"내가 무리할 때 먼저 흐트러지는 생활",turn:"몸의 신호를 놓치게 하는 내 습관부터 봐요",questions:["쉬는 시간을 미루는 성향","부담이 쌓이는 생활 방식","일과 휴식을 다시 나눌 시기"],action:"수면·식사·일정 중 가장 자주 밀리는 한 가지부터 일정에 고정하세요.",caution:"사주로 질병이나 치료 시기를 정하지 마세요. 실제 증상은 진료로 확인하세요.",focus:"health"},
 "study":{opening:"같이 공부해도 집중이 붙는 조건은 달라요",turn:"노력의 양보다 이해하고 익히는 순서부터",questions:["이해가 붙는 설명과 연습","집중을 끊는 환경과 부담","학습 계획을 조정할 시기"],action:"짧게 설명 듣기·직접 풀기·다시 설명하기 중 잘 맞는 순서를 비교해 보세요.",caution:"타고난 성향 하나로 능력의 한계를 정하거나 공부량만 늘리지 마세요.",focus:"study"},
 "child-study":{opening:"이 아이, 어떤 방식으로 배울 때 달라질까요?",turn:"재촉하기 전에 아이에게 맞는 학습 조건부터",questions:["스스로 시작하는 설명 방식","집중이 붙거나 끊기는 상황","부모가 바꿔 줄 말과 환경"],action:"아이에게 풀어 본 방법을 설명하게 하고, 어떤 단계에서 막히는지 들어 주세요.",caution:"속도가 느리다는 이유로 이해력까지 낮다고 단정하지 마세요.",focus:"child"},
 "child-admission":{opening:"목표 대학보다 먼저 맞춰야 할 준비의 순서",turn:"아이의 공부 방식과 입시 일정을 함께 놓고 봐요",questions:["준비가 잘 이어지는 환경","계획을 점검하고 조절할 때","전공과 진학 방향을 비교할 기준"],action:"실제 성적·관심·전형 일정을 놓고 선택 가능한 경로를 비교하세요.",caution:"사주만으로 합격 여부나 특정 대학을 확정하지 마세요.",focus:"child"},
 "child-dream":{opening:"하고 싶은 게 없다는 아이, 어떤 경험이 필요할까요?",turn:"직업을 고르기 전에 오래 붙드는 활동부터",questions:["재능이 드러나는 활동의 모습","만들기·탐구·표현의 강점","진로를 좁히기 전에 해 볼 경험"],action:"작게 만들어 보기·찾아 설명하기·직접 체험하기를 해 보고 반응을 기록하세요.",caution:"한 번 잘한 활동만으로 아이의 평생 진로를 정하지 마세요.",focus:"child"},
 "child-talent":{opening:"우리 아이의 가능성, 어떤 장면에서 드러날까요?",turn:"이해·창의성·몰입을 일상의 모습과 연결해요",questions:["납득하고 이해하는 방식","새 방법을 시도하는 상황","끝까지 몰입하게 만드는 조건"],action:"잘한 결과뿐 아니라 스스로 질문하고 다시 시도한 과정을 기록하세요.",caution:"사주 해석을 지능 검사나 영재 판정으로 사용하지 마세요.",focus:"child"},
 "parent-child":{opening:"같은 말을 왜 이 아이는 다르게 받아들일까요?",turn:"부모의 기대와 아이가 받아들이는 방식을 나란히",questions:["격려가 재촉으로 바뀌는 순간","서로 편한 거리와 선택의 범위","부모가 바꿔 볼 말과 역할"],action:"지시하기 전에 아이의 생각을 한 번 듣고, 선택할 범위를 구체적으로 정해 주세요.",caution:"서로 다른 반응을 버릇이나 애정 부족으로 단정하지 마세요.",focus:"child"},
};

export function salesFocusFor(context:PreviewContext,narrative:PreviewReading) {
 const config=SALES_FOCUS[context.slug] ?? SALES_FOCUS["destiny-full"]!;
 const ids=config.focus==="business"||config.focus==="money" ? ["business","wealth"]
  :config.focus==="career" ? ["expression","outside"]
  :["love","reunion","pair"].includes(config.focus) ? ["romance","inside","relations"]
  :config.focus==="health" ? ["balance","strength"] : ["character","inside","outside"];
 const facts=ids.flatMap(id=>context.facts.filter(fact=>fact.id===id));
 const preview=narrative.areas.find(area=>area.evidenceIds.some(id=>ids.includes(id))) ?? narrative.personality;
 const now=Number(context.today.slice(0,4))*100+Number(context.today.slice(5,7));
 const future=<T extends {year:number;month?:number}>(items:readonly T[])=>items.filter(item=>item.year*100+(item.month??12)>=now).sort((a,b)=>a.year*100+(a.month??0)-b.year*100-(b.month??0));
 return {...config,preview,facts,good:context.months.find(month=>month.tone==="good"),careful:context.months.find(month=>month.tone==="caution"),benefactor:future(context.focus?.benefactor??[])[0],partnership:future(context.focus?.partnership??[])[0]};
}

import "server-only";

import { SolapiMessageService } from "solapi";
import { env } from "@/lib/env";
import { TEMPLATES } from "./templates";
import type { NotifyRequest, NotifyResult, NotifySender } from "./types";

/**
 * 솔라피를 통한 알림톡 발송.
 *
 * 알림톡은 카카오에 등록한 템플릿으로만 나간다. 본문은 카카오가 가지고 있으므로
 * 여기서는 템플릿 ID 와 치환값만 넘긴다(본문을 같이 보내면 템플릿과 달라져 반려된다).
 *
 * 대체 문자는 쓰지 않는다(disableSms). 대체 발송에는 등록된 발신번호가 필요한데 그 절차를
 * 밟지 않기로 했다. 끄지 않으면 솔라피가 문자로 넘기려다 발신번호가 없어 실패하므로,
 * 실패의 이유가 "알림톡이 안 닿았다"가 아니라 "발신번호가 없다"로 바뀌어 원인이 흐려진다.
 *
 * 그래서 카카오톡으로 닿지 않는 사람(미설치, 채널 차단)에게는 알림이 가지 않는다.
 * 결과물은 보관함에 그대로 있으므로 잃어버리지는 않는다.
 */
export class SolapiSender implements NotifySender {
  private readonly service: SolapiMessageService;

  constructor(
    apiKey: string,
    apiSecret: string,
    private readonly pfId: string,
    private readonly templateIds: Partial<Record<string, string>>,
  ) {
    this.service = new SolapiMessageService(apiKey, apiSecret);
  }

  async send(request: NotifyRequest): Promise<NotifyResult> {
    const template = TEMPLATES[request.kind];
    const templateId = this.templateIds[request.kind];
    if (!templateId) {
      return { sent: false, reason: `템플릿 ID 가 없습니다: ${template.name}` };
    }

    // 버튼은 템플릿에 등록된 순서·이름 그대로여야 한다. 주소만 여기서 채운다.
    const buttons = template.buttons
      .map((button) => {
        const url = request.links[button.kind];
        return url ? { buttonName: button.name, buttonType: "WL" as const, linkMo: url, linkPc: url } : null;
      })
      .filter((button): button is NonNullable<typeof button> => button !== null);

    await this.service.send({
      to: request.to,
      kakaoOptions: {
        pfId: this.pfId,
        templateId,
        variables: request.variables,
        // 발신번호가 없어 문자로 넘길 수 없다. 넘기려다 실패하게 두지 않는다.
        disableSms: true,
        ...(buttons.length > 0 ? { buttons } : {}),
      },
    });

    return { sent: true };
  }
}

/** 환경변수로 솔라피 발송기를 만든다. 설정이 덜 됐으면 null */
export function createSolapiSender(): SolapiSender | null {
  const { solapiApiKey, solapiApiSecret, kakaoPfId } = env;
  if (!solapiApiKey || !solapiApiSecret || !kakaoPfId) return null;

  return new SolapiSender(solapiApiKey, solapiApiSecret, kakaoPfId, {
    "reading-started": env.kakaoTemplateStarted,
    "reading-ready": env.kakaoTemplateReady,
  });
}

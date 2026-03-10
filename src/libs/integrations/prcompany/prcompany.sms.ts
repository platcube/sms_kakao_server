import {
  getPrcompanyAuthToken,
  getPrcompanyBaseUrl,
  prcompanyClient,
} from "@/libs/integrations/prcompany/prcompany.client";

// prcompany SMS 즉시 발송 요청 파라미터(내부 표준형)
export type PrcompanySmsSendRequest = {
  callback: string; // 발신번호 (Callback)
  phones: string[]; // 수신번호 배열 (Phones는 콤마 문자열로 변환)
  message: string; // 문자 본문 (Message)
  etc1?: string; // 부가값1 (Etc1)
  etc2?: string; // 부가값2 (Etc2)
};

// prcompany SMS 즉시 발송 응답 구조
export type PrcompanySmsSendResponse = {
  Count: number; // 실제 전송 건수
  ResCd: number; // 응답코드 (0 성공)
  ResMsg?: string; // 응답메시지
  Mac?: string | null; // MAC (문서상 null 가능)
};

/**
 * prcompany 단문(SMS) 즉시 발송 API 호출
 * @param input callback(발신번호), phones(수신번호), message(본문), etc1, etc2
 * @returns prcompany 응답 원문(JSON)
 */
export const sendPrcompanySmsImmediate = async (input: PrcompanySmsSendRequest): Promise<PrcompanySmsSendResponse> => {
  const response = await prcompanyClient.post<PrcompanySmsSendResponse>(
    `${getPrcompanyBaseUrl()}/sms/send`,
    {
      Callback: input.callback,
      // Phones: input.phones.join(","),
      Phones: input.phones,
      Message: input.message,
      ...(input.etc1 ? { Etc1: input.etc1 } : {}),
      ...(input.etc2 ? { Etc2: input.etc2 } : {}),
    },
    {
      headers: {
        Token: getPrcompanyAuthToken(),
      },
    },
  );

  return response.data;
};

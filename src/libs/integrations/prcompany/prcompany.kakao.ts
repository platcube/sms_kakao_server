import { getPrcompanyAuthToken, getPrcompanyBaseUrl, prcompanyClient } from "@/libs/integrations/prcompany/prcompany.client";

export type PrcompanyKakaoSendResponse = {
  Count: number;
  ResCd: number;
  ResMsg?: string;
  Mac?: string | null;
};

export type PrcompanyKakaoImmediateRequest = {
  callback: string;
  phones: string;
  title?: string;
  message: string;
  profileKey: string;
  tempCode: string;
  tempBtn1?: string;
  failFlag: number;
  smsGubn: "Y" | "N";
  ketc1?: string;
  ketc2?: string;
};

export type PrcompanyKakaoReservedRequest = PrcompanyKakaoImmediateRequest & {
  reservedTime: string;
};

/**
 * prcompany 카카오 알림톡 즉시 발송 API 호출
 */
export const sendPrcompanyKakaoImmediate = async (
  input: PrcompanyKakaoImmediateRequest
): Promise<PrcompanyKakaoSendResponse> => {
  const response = await prcompanyClient.post<PrcompanyKakaoSendResponse>(
    `${getPrcompanyBaseUrl()}/kat/send`,
    {
      Callback: input.callback,
      Phones: input.phones,
      ...(input.title ? { Title: input.title } : {}),
      Message: input.message,
      ProfileKey: input.profileKey,
      TempCode: input.tempCode,
      ...(input.tempBtn1 ? { TempBtn1: input.tempBtn1 } : {}),
      FailFlag: input.failFlag,
      SMSGubn: input.smsGubn,
      Etc1: "Y", // "Y": 즉시, "N": 예약
      ...(input.ketc1 ? { Ketc1: input.ketc1 } : {}),
      ...(input.ketc2 ? { Ketc2: input.ketc2 } : {}),
    },
    {
      headers: {
        Token: getPrcompanyAuthToken(),
      },
    }
  );

  return response.data;
};

/**
 * prcompany 카카오 알림톡 예약 발송 API 호출
 */
export const sendPrcompanyKakaoReserved = async (
  input: PrcompanyKakaoReservedRequest
): Promise<PrcompanyKakaoSendResponse> => {
  const response = await prcompanyClient.post<PrcompanyKakaoSendResponse>(
    `${getPrcompanyBaseUrl()}/kat/reserved`,
    {
      Callback: input.callback,
      Phones: input.phones,
      ...(input.title ? { Title: input.title } : {}),
      Message: input.message,
      ProfileKey: input.profileKey,
      TempCode: input.tempCode,
      ...(input.tempBtn1 ? { TempBtn1: input.tempBtn1 } : {}),
      FailFlag: String(input.failFlag),
      SMSGubn: input.smsGubn,
      Etc1: "N",
      ReservedTime: input.reservedTime,
      ...(input.ketc1 ? { Ketc1: input.ketc1 } : {}),
      ...(input.ketc2 ? { Ketc2: input.ketc2 } : {}),
    },
    {
      headers: {
        Token: getPrcompanyAuthToken(),
      },
    }
  );

  return response.data;
};

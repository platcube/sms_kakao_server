import {
  getPrcompanyAuthToken,
  getPrcompanyBaseUrl,
  prcompanyClient,
} from "@/libs/integrations/prcompany/prcompany.client";

export type PrcompanyBrandTalkSendResponse = {
  Count: number;
  ResCd: number;
  ResMsg?: string;
  Mac?: string | null;
};

export type PrcompanyBrandTalkImmediateRequest = {
  callback: string;
  phones: string[];
  title?: string;
  message: string;
  profileKey: string;
  failFlag: number;
  smsGubn: "Y" | "N";
  ketc1?: string;
  ketc2?: string;
};

export type PrcompanyBrandTalkReservedRequest = PrcompanyBrandTalkImmediateRequest & {
  reservedTime: string;
};

/**
 * prcompany 카카오 브랜드메시지(구 친구톡) 즉시 발송 API 호출
 */
export const sendPrcompanyBrandTalkImmediate = async (
  input: PrcompanyBrandTalkImmediateRequest,
): Promise<PrcompanyBrandTalkSendResponse> => {
  const response = await prcompanyClient.post<PrcompanyBrandTalkSendResponse>(
    `${getPrcompanyBaseUrl()}/kft/send`,
    {
      Callback: input.callback,
      Phones: input.phones,
      ...(input.title ? { Title: input.title } : {}),
      Message: input.message,
      ProfileKey: input.profileKey,
      FailFlag: input.failFlag,
      SMSGubn: input.smsGubn,
      Etc1: "Y",
      ...(input.ketc1 ? { Ketc1: input.ketc1 } : {}),
      ...(input.ketc2 ? { Ketc2: input.ketc2 } : {}),
    },
    {
      headers: {
        Token: getPrcompanyAuthToken(),
      },
    },
  );

  return response.data;
};

/**
 * prcompany 카카오 브랜드메시지(구 친구톡) 예약 발송 API 호출
 */
export const sendPrcompanyBrandTalkReserved = async (
  input: PrcompanyBrandTalkReservedRequest,
): Promise<PrcompanyBrandTalkSendResponse> => {
  const response = await prcompanyClient.post<PrcompanyBrandTalkSendResponse>(
    `${getPrcompanyBaseUrl()}/kft/reserved`,
    {
      Callback: input.callback,
      Phones: input.phones,
      ...(input.title ? { Title: input.title } : {}),
      Message: input.message,
      ProfileKey: input.profileKey,
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
    },
  );

  return response.data;
};

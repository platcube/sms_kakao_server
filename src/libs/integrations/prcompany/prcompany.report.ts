import {
  getPrcompanyAuthToken,
  getPrcompanyBaseUrl,
  prcompanyClient,
} from "@/libs/integrations/prcompany/prcompany.client";

export type PrcompanyResultCountRequest = {
  messageType: "ALIMTALK" | "BRANDTALK";
  idempotencyKey: string;
  requestedAt?: Date;
  gType?: string;
  sDate?: string;
};

export type NormalizedPrcompanyResultCount = {
  found: boolean;
  totalCount: number;
  successCount: number;
  failedCount: number;
  providerResultCode: string | null;
  providerResultMessage: string | null;
  rawJson: unknown;
};

type JsonRecord = Record<string, unknown>;

// unknown 응답값을 안전하게 일반 객체로 좁힙니다.
const toJsonRecord = (value: unknown): JsonRecord | null =>
  value !== null && typeof value === "object" && !Array.isArray(value) ? (value as JsonRecord) : null;

// prcompany 응답 필드명이 문서/채널별로 달라도 문자열 맞춤
const readString = (source: JsonRecord, keys: string[]) => {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string") return value;
    if (typeof value === "number") return String(value);
  }

  return null;
};

// prcompany 응답 필드명이 문서/채널별로 달라도 숫자 값 맞춤
const readNumber = (source: JsonRecord, keys: string[]) => {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim() !== "") {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }

  return null;
};

// 객체 안에 결과 건수 필드 체크
const hasResultCountFields = (source: JsonRecord) =>
  readNumber(source, ["TCnt", "TotalCount", "TotalCnt", "TotCnt", "Count", "Cnt", "totalCount"]) !== null ||
  readNumber(source, ["SCnt", "SuccessCount", "SuccessCnt", "SuccCount", "SuccCnt", "successCount"]) !== null ||
  readNumber(source, ["FCnt", "FailedCount", "FailCount", "FailCnt", "failedCount"]) !== null;

// idempotencyKey 매칭 없이도 Item/Data 등에 들어있는 건수 레코드를 찾아냅니다.
const findRecordWithCounts = (value: unknown): JsonRecord | null => {
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findRecordWithCounts(item);
      if (found) return found;
    }

    return null;
  }

  const record = toJsonRecord(value);
  if (!record) return null;
  if (hasResultCountFields(record)) return record;

  for (const nestedValue of Object.values(record)) {
    const found = findRecordWithCounts(nestedValue);
    if (found) return found;
  }

  return null;
};

// Date 타입을 prcompany DD 조회 포맷인 YYYY-MM-DD로 변환
export const formatPrcompanyResultDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

// 결과조회 응답이 배열 형태일 때 idempotencyKey가 들어있는 레코드를 우선 찾아냅니다.
const findRecordByIdempotencyKey = (value: unknown, idempotencyKey: string): JsonRecord | null => {
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findRecordByIdempotencyKey(item, idempotencyKey);
      if (found) return found;
    }

    return null;
  }

  const record = toJsonRecord(value);
  if (!record) return null;

  const matchedKey = readString(record, ["Ketc1", "ketc1", "Etc1", "etc1", "IdempotencyKey", "idempotencyKey"]);
  if (matchedKey === idempotencyKey) return record;

  for (const nestedValue of Object.values(record)) {
    const found = findRecordByIdempotencyKey(nestedValue, idempotencyKey);
    if (found) return found;
  }

  return null;
};

// prcompany 결과조회 응답 내부 저장 포맷으로 정규화
export const normalizePrcompanyResultCountResponse = (
  rawJson: unknown,
  idempotencyKey: string,
): NormalizedPrcompanyResultCount => {
  const root = toJsonRecord(rawJson) ?? {};
  const matchedRecord = findRecordByIdempotencyKey(rawJson, idempotencyKey);
  const countedRecord = findRecordWithCounts(rawJson);
  const resultSource = matchedRecord ?? countedRecord ?? root;

  const totalCount = readNumber(resultSource, [
    "TCnt",
    "TotalCount",
    "TotalCnt",
    "TotCnt",
    "Count",
    "Cnt",
    "totalCount",
  ]);
  const successCount = readNumber(resultSource, [
    "SCnt",
    "SuccessCount",
    "SuccessCnt",
    "SuccCount",
    "SuccCnt",
    "successCount",
  ]);
  const failedCount = readNumber(resultSource, ["FCnt", "FailedCount", "FailCount", "FailCnt", "failedCount"]);
  const providerResultCode =
    readString(resultSource, ["ResCd", "ResultCode", "Code", "resCd", "resultCode"]) ??
    readString(root, ["ResCd", "ResultCode", "Code", "resCd", "resultCode"]);
  const providerResultMessage =
    readString(resultSource, ["ResMsg", "ResultMessage", "Message", "resMsg", "resultMessage"]) ??
    readString(root, ["ResMsg", "ResultMessage", "Message", "resMsg", "resultMessage"]);

  const hasCount = totalCount !== null || successCount !== null || failedCount !== null;
  const normalizedSuccessCount = successCount ?? 0;
  const normalizedFailedCount = failedCount ?? 0;
  const normalizedTotalCount = totalCount ?? normalizedSuccessCount + normalizedFailedCount;

  return {
    found: (matchedRecord !== null || hasCount) && normalizedTotalCount > 0,
    totalCount: normalizedTotalCount,
    successCount: normalizedSuccessCount,
    failedCount: normalizedFailedCount,
    providerResultCode,
    providerResultMessage,
    rawJson,
  };
};

// 카카오 메시지 발송 유형에 따라 prcompany SType 정의
const getPrcompanyResultSType = (messageType: "ALIMTALK" | "BRANDTALK") => {
  if (messageType === "ALIMTALK") return "KAT";
  if (messageType === "BRANDTALK") return "KFT";

  throw new Error("Unsupported kakao messageType");
};

// idempotencyKey 기준으로 prcompany 전송결과 건수 조회
export const getPrcompanyResultCount = async (
  input: PrcompanyResultCountRequest,
): Promise<NormalizedPrcompanyResultCount> => {
  const requestedAt = input.requestedAt ?? new Date();

  const payload = {
    Etc1: input.idempotencyKey,
    SType: getPrcompanyResultSType(input.messageType),
    GType: input.gType ?? process.env.PR_RESULT_COUNT_GTYPE?.trim() ?? "DD",
    SDate: input.sDate ?? formatPrcompanyResultDate(requestedAt),
  };

  const response = await prcompanyClient.post<unknown>(`${getPrcompanyBaseUrl()}/rslt/cnt`, payload, {
    headers: {
      Token: getPrcompanyAuthToken(),
    },
  });

  return normalizePrcompanyResultCountResponse(response.data, input.idempotencyKey);
};

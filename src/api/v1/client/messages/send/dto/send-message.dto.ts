// 플랫큐브 SMS 즉시 발송 요청 DTO
export type SendMessageBodyDto = {
  clientCode: string; // 외주사 식별 코드
  messageType: "SMS"; // 현재 send 엔드포인트에서 허용하는 메시지 타입
  recipientPhone: string; // 수신자 전화번호(단건)
  senderKey: string; // 발신번호(문서상 Callback)
  content: string; // 문자 본문(90바이트 이하)
  idempotencyKey?: string; // 중복 발송 방지 키
  etc1?: string; // prcompany 부가 필드 1 - 클라이언트 유니크 코드
  etc2?: string; // prcompany 부가 필드 2
};

// 발송 요청 처리 결과 응답 DTO
export type SendMessageResponseDto = {
  messageId: number; // 내부 메시지 ID
  status: string; // 현재 메시지 상태
  requestedAt: string; // 요청 접수 시각(ISO string)
  // prcompany 응답값
  provider: {
    responseCode: number | null; // prcompany ResCd
    responseMessage: string | null; // prcompany ResMsg
    responseCount: number | null; // prcompany Count
  } | null; // idempotency 재사용 등 공급자 호출이 없으면 null
  retry: {
    isRetryable: boolean; // 재시도 가능 여부
    nextRetryAt: string | null; // 다음 재시도 예정 시각
    attemptNo: number; // 현재 시도 번호
  } | null; // 재시도 대상이 아니면 null
};

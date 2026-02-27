// 플랫큐브 SMS 즉시 발송 요청 DTO
export type SendMessageBodyDto = {
  clientCode: string; // 외주사 식별 코드
  messageType: "SMS" | "LMS" | "MMS" | "ALIMTALK"; // 현재 send 엔드포인트에서 허용하는 메시지 타입
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
  messageType: "SMS" | "LMS" | "MMS" | "ALIMTALK"; // 메시지 타입
  status: string; // 현재 메시지 상태
  requestedAt: string; // 요청 접수 시각(ISO string)
  reason?: {
    code: string; // 외주사 공개용 사유 코드
    message: string; // 외주사 공개용 사유 메시지
  } | null; // 실패/재시도 예정/중복 요청 등 보충 설명
};

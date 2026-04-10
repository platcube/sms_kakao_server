// 플랫큐브 SMS/LMS 예약 발송 요청 DTO
export type ScheduleMessageBodyDto = {
  clientCode: string; // 외주사 식별 코드
  messageType: "SMS" | "LMS"; // 예약 발송 지원 타입
  recipientPhone: string[]; // 수신자 전화번호 목록(최소 1건)
  senderKey: string; // 발신번호(문서상 Callback)
  title?: string; // LMS 제목(선택, 20바이트 이하)
  content: string; // 메시지 본문
  scheduledAt: string; // 예약 시각 (ISO 또는 YYYY-MM-DD HH:mm:ss)
  idempotencyKey?: string; // 중복 발송 방지 키
  etc1?: string; // prcompany 부가 필드 1
  etc2?: string; // prcompany 부가 필드 2
};

// 예약 발송 요청 처리 결과 응답 DTO
export type ScheduleMessageResponseDto = {
  messageId: number; // 내부 메시지 ID
  messageType: "SMS" | "LMS"; // 메시지 타입
  status: string; // 현재 메시지 상태
  requestedAt: string; // 요청 접수 시각(ISO string)
  reason?: {
    code: string; // 외주사 공개용 사유 코드
    message: string; // 외주사 공개용 사유 메시지
  } | null; // 실패/재시도 예정/중복 요청 등 보충 설명
};

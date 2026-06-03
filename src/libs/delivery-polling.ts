const INITIAL_DELIVERY_POLL_DELAY_MS = 5 * 60 * 1000; // 5분간격

// 발송 결과 조회를 위한 pollAt 계산 함수
export const getInitialDeliveryPollAt = (baseAt = new Date()) =>
  new Date(baseAt.getTime() + INITIAL_DELIVERY_POLL_DELAY_MS);

// 회원가입 요청 시 클라이언트에서 보내는 데이터의 타입
export type ClientUserSignupBodyDto = {
  clientCode: string;
  clientName: string;
  senderPhone: string;
  account: string;
  password: string;
  userName: string;
};

// 회원가입 성공 시 반환
export type ClientUserSignupResponseDto = {
  clientId: number;
  clientUserId: number;
  clientCode: string;
  account: string;
  apiKey: string;
  createdAt: string;
};

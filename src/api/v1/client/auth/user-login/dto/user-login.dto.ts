export type ClientUserLoginBodyDto = {
  account: string;
  password: string;
};

export type ClientUserLoginContextDto = {
  userAgent?: string;
  ipAddress?: string;
};

export type ClientUserLoginResponseDto = {
  accessToken: string;
};

export type ClientUserLoginServiceResultDto = ClientUserLoginResponseDto & {
  refreshToken: string;
};

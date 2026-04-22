export type ClientUserRefreshResponseDto = {
  accessToken: string;
};

export type ClientUserRefreshContextDto = {
  refreshToken: string;
  userAgent?: string;
  ipAddress?: string;
};

export type ClientUserRefreshServiceResultDto = ClientUserRefreshResponseDto & {
  refreshToken: string;
};

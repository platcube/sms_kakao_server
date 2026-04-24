export type ClientUserLogoutContextDto = {
  refreshToken?: string;
};

export type ClientUserLogoutResponseDto = {
  loggedOut: boolean;
};

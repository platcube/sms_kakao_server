export type ClientUserLoginBodyDto = {
  account: string;
  password: string;
};

export type ClientUserLoginResponseDto = {
  accessToken: string;
};

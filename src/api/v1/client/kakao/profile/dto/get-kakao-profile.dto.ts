export type GetKakaoProfileQueryDto = {
  clientCode: string;
};

export type GetKakaoProfileResponseDto = {
  item: unknown;
  resCd: number;
  resMsg?: string;
  mac?: string | null;
};

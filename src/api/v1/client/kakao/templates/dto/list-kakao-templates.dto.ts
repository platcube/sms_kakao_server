export type ListKakaoTemplatesQueryDto = {
  clientCode: string;
};

export type ListKakaoTemplatesResponseDto = {
  items: unknown;
  resCd: number;
  resMsg?: string;
  mac?: string | null;
};

export type GetKakaoTemplateDetailQueryDto = {
  clientCode: string;
};

export type GetKakaoTemplateDetailResponseDto = {
  item: unknown;
  resCd: number;
  resMsg?: string;
  mac?: string | null;
};

import { AppError } from "@/libs/error/app-error";
import { ERROR_CODES } from "@/libs/error/error-codes";
import { getPrcompanyKakaoTemplateDetail } from "@/libs/integrations/prcompany/prcompany.kakao";
import {
  GetKakaoTemplateDetailQueryDto,
  GetKakaoTemplateDetailResponseDto,
} from "@/api/v1/client/kakao/template-detail/dto/get-kakao-template-detail.dto";

export const getKakaoTemplateDetail = async (
  templateCode: string,
  _query: GetKakaoTemplateDetailQueryDto,
): Promise<GetKakaoTemplateDetailResponseDto> => {
  const normalizedCode = templateCode.trim();

  if (!normalizedCode) {
    throw new AppError(400, ERROR_CODES.COMMON_400_VALIDATION, "templateCode is required");
  }

  const providerResponse = await getPrcompanyKakaoTemplateDetail(normalizedCode);

  return {
    item: providerResponse.Item,
    resCd: providerResponse.ResCd,
    resMsg: providerResponse.ResMsg,
    mac: providerResponse.Mac,
  };
};

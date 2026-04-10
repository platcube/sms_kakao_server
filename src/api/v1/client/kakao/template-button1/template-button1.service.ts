import { AppError } from "@/libs/error/app-error";
import { ERROR_CODES } from "@/libs/error/error-codes";
import { getPrcompanyKakaoTemplateButton1 } from "@/libs/integrations/prcompany/prcompany.kakao";
import {
  GetKakaoTemplateButton1QueryDto,
  GetKakaoTemplateButton1ResponseDto,
} from "@/api/v1/client/kakao/template-button1/dto/get-kakao-template-button1.dto";

export const getKakaoTemplateButton1 = async (
  templateCode: string,
  _query: GetKakaoTemplateButton1QueryDto,
): Promise<GetKakaoTemplateButton1ResponseDto> => {
  const normalizedCode = templateCode.trim();

  if (!normalizedCode) {
    throw new AppError(400, ERROR_CODES.COMMON_400_VALIDATION, "templateCode is required");
  }

  const providerResponse = await getPrcompanyKakaoTemplateButton1(normalizedCode);

  return {
    item: providerResponse.Item,
    resCd: providerResponse.ResCd,
    resMsg: providerResponse.ResMsg,
    mac: providerResponse.Mac,
  };
};

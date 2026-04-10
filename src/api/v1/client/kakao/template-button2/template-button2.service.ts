import { AppError } from "@/libs/error/app-error";
import { ERROR_CODES } from "@/libs/error/error-codes";
import { getPrcompanyKakaoTemplateButton2 } from "@/libs/integrations/prcompany/prcompany.kakao";
import {
  GetKakaoTemplateButton2QueryDto,
  GetKakaoTemplateButton2ResponseDto,
} from "@/api/v1/client/kakao/template-button2/dto/get-kakao-template-button2.dto";

export const getKakaoTemplateButton2 = async (
  templateCode: string,
  _query: GetKakaoTemplateButton2QueryDto,
): Promise<GetKakaoTemplateButton2ResponseDto> => {
  const normalizedCode = templateCode.trim();

  if (!normalizedCode) {
    throw new AppError(400, ERROR_CODES.COMMON_400_VALIDATION, "templateCode is required");
  }

  const providerResponse = await getPrcompanyKakaoTemplateButton2(normalizedCode);

  return {
    item: providerResponse.Item,
    resCd: providerResponse.ResCd,
    resMsg: providerResponse.ResMsg,
    mac: providerResponse.Mac,
  };
};

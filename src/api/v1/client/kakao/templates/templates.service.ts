import {
  getPrcompanyKakaoTemplates,
} from "@/libs/integrations/prcompany/prcompany.kakao";
import {
  ListKakaoTemplatesQueryDto,
  ListKakaoTemplatesResponseDto,
} from "@/api/v1/client/kakao/templates/dto/list-kakao-templates.dto";

export const listKakaoTemplates = async (
  _query: ListKakaoTemplatesQueryDto,
): Promise<ListKakaoTemplatesResponseDto> => {
  const providerResponse = await getPrcompanyKakaoTemplates();

  return {
    items: providerResponse.Items,
    resCd: providerResponse.ResCd,
    resMsg: providerResponse.ResMsg,
    mac: providerResponse.Mac,
  };
};

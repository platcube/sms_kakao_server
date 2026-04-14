import { getPrcompanyKakaoProfile } from "@/libs/integrations/prcompany/prcompany.kakao";
import {
  GetKakaoProfileQueryDto,
  GetKakaoProfileResponseDto,
} from "@/api/v1/client/kakao/profile/dto/get-kakao-profile.dto";

// 프로필 키 조회
export const getKakaoProfile = async (_query: GetKakaoProfileQueryDto): Promise<GetKakaoProfileResponseDto> => {
  const providerResponse = await getPrcompanyKakaoProfile();

  return {
    item: providerResponse.Item,
    resCd: providerResponse.ResCd,
    resMsg: providerResponse.ResMsg,
    mac: providerResponse.Mac,
  };
};

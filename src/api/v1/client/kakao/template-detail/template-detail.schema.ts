import { GetKakaoTemplateDetailQueryDto } from "@/api/v1/client/kakao/template-detail/dto/get-kakao-template-detail.dto";
import { ValidationResult } from "@/libs/validation/validate";

export const parseKakaoTemplateDetailQuery = (
  _input: unknown,
): ValidationResult<GetKakaoTemplateDetailQueryDto> => {
  return {
    success: true,
    data: {},
  };
};

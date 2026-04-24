import { GetKakaoProfileQueryDto } from "@/api/v1/client/kakao/profile/dto/get-kakao-profile.dto";
import { ValidationResult } from "@/libs/validation/validate";

const isNonEmptyString = (v: unknown): v is string => typeof v === "string" && v.trim().length > 0;

export const parseKakaoProfileQuery = (input: unknown): ValidationResult<GetKakaoProfileQueryDto> => {
  const source = (input ?? {}) as Record<string, unknown>;
  console.log("input:", input, source);
  const clientCode = source.clientCode;

  if (!isNonEmptyString(clientCode)) {
    return {
      success: false,
      issues: [{ field: "clientCode", reason: "clientCode is required" }],
    };
  }

  return {
    success: true,
    data: {
      clientCode: clientCode.trim(),
    },
  };
};

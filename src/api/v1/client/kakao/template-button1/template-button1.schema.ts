import { GetKakaoTemplateButton1QueryDto } from "@/api/v1/client/kakao/template-button1/dto/get-kakao-template-button1.dto";
import { ValidationResult } from "@/libs/validation/validate";

const isNonEmptyString = (v: unknown): v is string => typeof v === "string" && v.trim().length > 0;

export const parseKakaoTemplateButton1Query = (
  input: unknown,
): ValidationResult<GetKakaoTemplateButton1QueryDto> => {
  const source = (input ?? {}) as Record<string, unknown>;
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

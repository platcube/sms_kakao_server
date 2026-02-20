import { ValidationResult } from "@/libs/validation/validate";
import { HealthQueryDto } from "@/api/system/health/dto/health.dto";

export const parseHealthQuery = (input: unknown): ValidationResult<HealthQueryDto> => {
  const source = input as Record<string, unknown>;
  const rawVerbose = source?.verbose;

  if (rawVerbose === undefined) {
    return { success: true, data: { verbose: false } };
  }

  if (typeof rawVerbose === "string") {
    if (rawVerbose === "true") {
      return { success: true, data: { verbose: true } };
    }

    if (rawVerbose === "false") {
      return { success: true, data: { verbose: false } };
    }
  }

  return {
    success: false,
    issues: [
      {
        field: "verbose",
        reason: "verbose must be 'true' or 'false'",
      },
    ],
  };
};

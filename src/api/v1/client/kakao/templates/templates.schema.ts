import { ListKakaoTemplatesQueryDto } from "@/api/v1/client/kakao/templates/dto/list-kakao-templates.dto";
import { ValidationResult } from "@/libs/validation/validate";

const isNonEmptyString = (v: unknown): v is string => typeof v === "string" && v.trim().length > 0;
const TEMPLATE_STATUSES = ["DRAFT", "PENDING", "APPROVED", "REJECTED", "ARCHIVED"] as const;

export const parseKakaoTemplatesQuery = (input: unknown): ValidationResult<ListKakaoTemplatesQueryDto> => {
  const source = (input ?? {}) as Record<string, unknown>;
  const status = source.status;
  const templateCode = source.templateCode;
  const name = source.name;
  const issues: { field: string; reason: string }[] = [];

  if (
    status !== undefined &&
    (typeof status !== "string" ||
      !TEMPLATE_STATUSES.includes(status as "DRAFT" | "PENDING" | "APPROVED" | "REJECTED" | "ARCHIVED"))
  ) {
    issues.push({ field: "status", reason: "status must be DRAFT, PENDING, APPROVED, REJECTED, or ARCHIVED" });
  }

  if (templateCode !== undefined && typeof templateCode !== "string") {
    issues.push({ field: "templateCode", reason: "templateCode must be string" });
  }

  if (name !== undefined && typeof name !== "string") {
    issues.push({ field: "name", reason: "name must be string" });
  }

  if (issues.length > 0) {
    return { success: false, issues };
  }

  return {
    success: true,
    data: {
      ...(isNonEmptyString(status) ? { status: status as ListKakaoTemplatesQueryDto["status"] } : {}),
      ...(isNonEmptyString(templateCode) ? { templateCode: templateCode.trim() } : {}),
      ...(isNonEmptyString(name) ? { name: name.trim() } : {}),
    },
  };
};

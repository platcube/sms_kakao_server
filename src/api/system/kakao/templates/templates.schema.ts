import {
  RegisterKakaoTemplateItemDto,
  RegisterKakaoTemplateProfileDto,
  RegisterKakaoTemplatesBodyDto,
} from "@/api/system/kakao/templates/dto/register-kakao-templates.dto";
import { ValidationResult } from "@/libs/validation/validate";

const TEMPLATE_STATUSES = ["DRAFT", "PENDING", "APPROVED", "REJECTED", "ARCHIVED"] as const;
const PROFILE_STATUSES = ["ACTIVE", "INACTIVE"] as const;
const CLIENT_CODE_REGEX = /^[A-Za-z0-9_-]{3,50}$/;
const TEMPLATE_CODE_REGEX = /^[A-Za-z0-9_.-]{1,80}$/;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isNonEmptyString = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;

const isOptionalString = (value: unknown): value is string | undefined =>
  value === undefined || typeof value === "string";

const isOptionalNullableString = (value: unknown): value is string | null | undefined =>
  value === undefined || value === null || typeof value === "string";

const isJsonObjectOrNull = (value: unknown): value is Record<string, unknown> | null | undefined =>
  value === undefined || value === null || isRecord(value);

const parseProfile = (input: unknown, issues: { field: string; reason: string }[]): RegisterKakaoTemplateProfileDto => {
  const source = isRecord(input) ? input : {};
  const profileKey = source.profileKey;
  const name = source.name;
  const channelName = source.channelName;
  const status = source.status;

  if (!isNonEmptyString(profileKey) || profileKey.trim().length > 120) {
    issues.push({ field: "profile.profileKey", reason: "profile.profileKey is required and must be 120 chars or less" });
  }

  if (!isNonEmptyString(name) || name.trim().length > 120) {
    issues.push({ field: "profile.name", reason: "profile.name is required and must be 120 chars or less" });
  }

  if (!isOptionalString(channelName) || (typeof channelName === "string" && channelName.trim().length > 120)) {
    issues.push({ field: "profile.channelName", reason: "profile.channelName must be 120 chars or less" });
  }

  if (status !== undefined && (typeof status !== "string" || !PROFILE_STATUSES.includes(status as "ACTIVE" | "INACTIVE"))) {
    issues.push({ field: "profile.status", reason: "profile.status must be ACTIVE or INACTIVE" });
  }

  return {
    profileKey: isNonEmptyString(profileKey) ? profileKey.trim() : "",
    name: isNonEmptyString(name) ? name.trim() : "",
    ...(isNonEmptyString(channelName) ? { channelName: channelName.trim() } : {}),
    ...(typeof status === "string" ? { status: status as "ACTIVE" | "INACTIVE" } : {}),
  };
};

const parseTemplate = (
  input: unknown,
  index: number,
  issues: { field: string; reason: string }[],
): RegisterKakaoTemplateItemDto => {
  const source = isRecord(input) ? input : {};
  const templateCode = source.templateCode;
  const name = source.name;
  const content = source.content;
  const button1Json = source.button1Json;
  const button2Json = source.button2Json;
  const category = source.category;
  const status = source.status;
  const rejectionReason = source.rejectionReason;
  const prefix = `templates[${index}]`;

  if (!isNonEmptyString(templateCode) || !TEMPLATE_CODE_REGEX.test(templateCode.trim())) {
    issues.push({ field: `${prefix}.templateCode`, reason: "templateCode is required and must be 1-80 chars" });
  }

  if (!isNonEmptyString(name) || name.trim().length > 120) {
    issues.push({ field: `${prefix}.name`, reason: "name is required and must be 120 chars or less" });
  }

  if (!isNonEmptyString(content)) {
    issues.push({ field: `${prefix}.content`, reason: "content is required" });
  }

  if (!isJsonObjectOrNull(button1Json)) {
    issues.push({ field: `${prefix}.button1Json`, reason: "button1Json must be an object, null, or omitted" });
  }

  if (!isJsonObjectOrNull(button2Json)) {
    issues.push({ field: `${prefix}.button2Json`, reason: "button2Json must be an object, null, or omitted" });
  }

  if (!isOptionalString(category) || (typeof category === "string" && category.trim().length > 80)) {
    issues.push({ field: `${prefix}.category`, reason: "category must be 80 chars or less" });
  }

  if (
    status !== undefined &&
    (typeof status !== "string" || !TEMPLATE_STATUSES.includes(status as NonNullable<RegisterKakaoTemplateItemDto["status"]>))
  ) {
    issues.push({ field: `${prefix}.status`, reason: "status must be DRAFT, PENDING, APPROVED, REJECTED, or ARCHIVED" });
  }

  if (!isOptionalNullableString(rejectionReason) || (typeof rejectionReason === "string" && rejectionReason.trim().length > 255)) {
    issues.push({ field: `${prefix}.rejectionReason`, reason: "rejectionReason must be null or 255 chars or less" });
  }

  return {
    templateCode: isNonEmptyString(templateCode) ? templateCode.trim() : "",
    name: isNonEmptyString(name) ? name.trim() : "",
    content: isNonEmptyString(content) ? content : "",
    ...(button1Json !== undefined ? { button1Json: button1Json as RegisterKakaoTemplateItemDto["button1Json"] } : {}),
    ...(button2Json !== undefined ? { button2Json: button2Json as RegisterKakaoTemplateItemDto["button2Json"] } : {}),
    ...(isNonEmptyString(category) ? { category: category.trim() } : {}),
    ...(typeof status === "string" ? { status: status as RegisterKakaoTemplateItemDto["status"] } : {}),
    ...(rejectionReason === null ? { rejectionReason: null } : {}),
    ...(isNonEmptyString(rejectionReason) ? { rejectionReason: rejectionReason.trim() } : {}),
  };
};

// 시스템용 카카오 템플릿 등록 요청 body 검증
export const parseRegisterKakaoTemplatesBody = (input: unknown): ValidationResult<RegisterKakaoTemplatesBodyDto> => {
  const source = isRecord(input) ? input : {};
  const issues: { field: string; reason: string }[] = [];

  const clientCode = source.clientCode;
  const profile = parseProfile(source.profile, issues);
  const templatesInput = source.templates;

  if (!isNonEmptyString(clientCode) || !CLIENT_CODE_REGEX.test(clientCode.trim())) {
    issues.push({ field: "clientCode", reason: "clientCode must be 3-50 chars (A-Z, a-z, 0-9, _, -)" });
  }

  if (!Array.isArray(templatesInput) || templatesInput.length === 0) {
    issues.push({ field: "templates", reason: "templates must be a non-empty array" });
  }

  if (Array.isArray(templatesInput) && templatesInput.length > 100) {
    issues.push({ field: "templates", reason: "templates must be 100 items or less" });
  }

  const templates = Array.isArray(templatesInput)
    ? templatesInput.map((template, index) => parseTemplate(template, index, issues))
    : [];

  const duplicatedTemplateCodes = templates
    .map((template) => template.templateCode)
    .filter((templateCode, index, all) => templateCode && all.indexOf(templateCode) !== index);

  if (duplicatedTemplateCodes.length > 0) {
    issues.push({ field: "templates", reason: "templateCode must be unique in request body" });
  }

  if (issues.length > 0) {
    return { success: false, issues };
  }

  return {
    success: true,
    data: {
      clientCode: String(clientCode).trim(),
      profile,
      templates,
    },
  };
};

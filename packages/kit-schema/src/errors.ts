/**
 * 机器可读错误码。CLI 与 Agent 脚本共用同一套码，便于日志与自动化。
 */
export const MeridianErrorCode = {
  INVALID_PROJECT_NAME: "MERIDIAN_INVALID_PROJECT_NAME",
  TARGET_NOT_EMPTY: "MERIDIAN_TARGET_NOT_EMPTY",
  BLUEPRINT_NOT_FOUND: "MERIDIAN_BLUEPRINT_NOT_FOUND",
  BLUEPRINT_INVALID: "MERIDIAN_BLUEPRINT_INVALID",
  BLUEPRINT_INCOMPATIBLE: "MERIDIAN_BLUEPRINT_INCOMPATIBLE",
  TEMPLATE_MISSING: "MERIDIAN_TEMPLATE_MISSING",
  RENDER_FAILED: "MERIDIAN_RENDER_FAILED",
  WRITE_FAILED: "MERIDIAN_WRITE_FAILED",
  PROJECT_META_MISSING: "MERIDIAN_PROJECT_META_MISSING",
  DOCTOR_FAILED: "MERIDIAN_DOCTOR_FAILED",
  CATALOG_INVALID: "MERIDIAN_CATALOG_INVALID",
  LLM_CONFIG_MISSING: "MERIDIAN_LLM_CONFIG_MISSING",
  LLM_REQUEST_FAILED: "MERIDIAN_LLM_REQUEST_FAILED",
  FEATURE_UNKNOWN: "MERIDIAN_FEATURE_UNKNOWN",
  MODULE_UNKNOWN: "MERIDIAN_MODULE_UNKNOWN",
  CATALOG_UNREACHABLE: "MERIDIAN_CATALOG_UNREACHABLE",
  USER_CANCELLED: "MERIDIAN_USER_CANCELLED",
  CONSTRAINT_VIOLATION: "MERIDIAN_CONSTRAINT_VIOLATION",
} as const;

export type MeridianErrorCode = (typeof MeridianErrorCode)[keyof typeof MeridianErrorCode];

export class MeridianError extends Error {
  readonly code: MeridianErrorCode;
  readonly details: Record<string, unknown>;

  constructor(code: MeridianErrorCode, message: string, details: Record<string, unknown> = {}) {
    super(message);
    this.name = "MeridianError";
    this.code = code;
    this.details = details;
  }

  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      details: this.details,
    };
  }
}

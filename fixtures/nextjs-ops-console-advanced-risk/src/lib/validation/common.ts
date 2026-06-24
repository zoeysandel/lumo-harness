import type { ValidationIssue } from "../http";

export function stringField(value: unknown, field: string, issues: ValidationIssue[], options?: { min?: number; max?: number }) {
  if (typeof value !== "string" || value.trim().length === 0) {
    issues.push({ field, message: `${field} is required` });
    return "";
  }

  const trimmed = value.trim();

  if (options?.min && trimmed.length < options.min) {
    issues.push({ field, message: `${field} is too short` });
  }

  if (options?.max && trimmed.length > options.max) {
    issues.push({ field, message: `${field} is too long` });
  }

  return trimmed;
}

export function stringArrayField(value: unknown, field: string, issues: ValidationIssue[], options?: { min?: number; max?: number }) {
  if (!Array.isArray(value)) {
    issues.push({ field, message: `${field} must be a list` });
    return [];
  }

  const parsed = value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);

  if (options?.min && parsed.length < options.min) {
    issues.push({ field, message: `${field} needs at least ${options.min} item(s)` });
  }

  if (options?.max && parsed.length > options.max) {
    issues.push({ field, message: `${field} allows at most ${options.max} item(s)` });
  }

  return parsed;
}

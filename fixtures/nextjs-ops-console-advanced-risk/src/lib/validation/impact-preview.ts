import type { ValidationIssue } from "../http";
import { stringArrayField, stringField } from "./common";

export type ImpactPreviewRequest = {
  accountId: string;
  reason: string;
  requestedActions: string[];
};

export function parseImpactPreviewRequest(body: unknown) {
  const issues: ValidationIssue[] = [];
  const payload = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};

  const accountId = stringField(payload.accountId, "accountId", issues, { min: 3, max: 80 });
  const reason = stringField(payload.reason, "reason", issues, { min: 8, max: 280 });
  const requestedActions = stringArrayField(payload.requestedActions, "requestedActions", issues, { min: 1, max: 5 });

  return {
    value: {
      accountId,
      reason,
      requestedActions
    },
    issues
  };
}

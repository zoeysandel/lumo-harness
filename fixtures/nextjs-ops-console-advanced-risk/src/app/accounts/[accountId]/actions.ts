"use server";

import { getAccountById } from "../../../lib/services/account-service";
import { createLocalImpactPreview } from "../../../lib/services/risk-service";

export async function previewAccountImpact(accountId: string, requestedActions: string[]) {
  const account = getAccountById(accountId);

  if (!account) {
    return {
      ok: false,
      error: "account_not_found"
    };
  }

  return {
    ok: true,
    preview: createLocalImpactPreview(account, requestedActions),
    status: "local_preview"
  };
}

import { okResponse, validationError } from "../../../../lib/http";
import { getAccountById } from "../../../../lib/services/account-service";
import { createLocalImpactPreview } from "../../../../lib/services/risk-service";
import { parseImpactPreviewRequest } from "../../../../lib/validation/impact-preview";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = parseImpactPreviewRequest(body);

  if (parsed.issues.length > 0) {
    return validationError(parsed.issues);
  }

  const account = getAccountById(parsed.value.accountId);

  if (!account) {
    return validationError([{ field: "accountId", message: "Unknown account" }]);
  }

  return okResponse({
    preview: createLocalImpactPreview(account, parsed.value.requestedActions),
    reason: parsed.value.reason,
    status: "local_preview"
  });
}

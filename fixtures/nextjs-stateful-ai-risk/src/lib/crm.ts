export type CrmTriagePayload = {
  message: string;
  category: string;
  urgency: string;
  userId: string;
};

export async function sendTriageToCrm(payload: CrmTriagePayload): Promise<{ id: string }> {
  const webhookUrl = process.env.CRM_WEBHOOK_URL;

  if (!webhookUrl) {
    throw new Error("CRM_WEBHOOK_URL is missing");
  }

  await fetch(webhookUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });

  return { id: "crm-triage-001" };
}

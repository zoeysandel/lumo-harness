export type CrmEscalationPayload = {
  intakeId: string;
  reason: string;
  priority: string;
  userId: string;
};

export async function sendEscalationToCrm(payload: CrmEscalationPayload): Promise<{ id: string }> {
  const webhookUrl = process.env.CRM_WEBHOOK_URL;

  if (!webhookUrl) {
    throw new Error("CRM_WEBHOOK_URL is missing");
  }

  await fetch(webhookUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });

  return { id: `crm-${payload.intakeId}` };
}

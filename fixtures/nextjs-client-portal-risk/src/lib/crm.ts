export type ClientCrmEscalation = {
  clientId: string;
  reason: string;
  urgency: string;
  ownerId: string;
};

export async function sendClientEscalationToCrm(payload: ClientCrmEscalation): Promise<{ id: string }> {
  const crmWebhook = process.env.CLIENT_CRM_WEBHOOK;

  if (!crmWebhook) {
    throw new Error("CLIENT_CRM_WEBHOOK is missing");
  }

  await fetch(crmWebhook, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });

  return { id: `crm-${payload.clientId}` };
}


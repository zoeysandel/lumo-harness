export type ClientEscalationEmail = {
  clientId: string;
  reason: string;
  urgency: string;
  recipient: string;
};

export async function sendEscalationEmail(payload: ClientEscalationEmail): Promise<{ id: string }> {
  const emailProviderKey = process.env.EMAIL_PROVIDER_KEY;

  if (!emailProviderKey) {
    throw new Error("EMAIL_PROVIDER_KEY is missing");
  }

  await fetch("https://email.example.test/escalations", {
    method: "POST",
    headers: {
      authorization: `Bearer ${emailProviderKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return { id: `email-${payload.clientId}` };
}


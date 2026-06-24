export type BillingEscalation = {
  intakeId: string;
  priority: string;
  reason: string;
};

export async function createBillingEscalation(payload: BillingEscalation): Promise<{ ticketId: string }> {
  const billingApiKey = process.env.BILLING_API_KEY;

  if (!billingApiKey) {
    throw new Error("BILLING_API_KEY is missing");
  }

  await fetch("https://billing.example.test/escalations", {
    method: "POST",
    headers: {
      authorization: `Bearer ${billingApiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return { ticketId: `billing-${payload.intakeId}` };
}

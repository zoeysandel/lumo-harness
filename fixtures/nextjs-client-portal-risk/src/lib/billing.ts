export type BillingReviewRequest = {
  clientId: string;
  urgency: string;
  reason: string;
};

export async function createBillingReview(payload: BillingReviewRequest): Promise<{ ticketId: string }> {
  const billingToken = process.env.CLIENT_BILLING_TOKEN;

  if (!billingToken) {
    throw new Error("CLIENT_BILLING_TOKEN is missing");
  }

  await fetch("https://billing.example.test/client-reviews", {
    method: "POST",
    headers: {
      authorization: `Bearer ${billingToken}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return { ticketId: `billing-${payload.clientId}` };
}


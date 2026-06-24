export async function freezeBillingForAccount(_accountId: string) {
  throw new Error("Fake risky billing seam: billing changes require explicit human approval.");
}

export async function estimateCreditExposure(_accountId: string) {
  throw new Error("Fake risky billing seam: use local mock exposure fields instead.");
}

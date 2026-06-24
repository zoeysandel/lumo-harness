export async function sendNotification(_recipient: string, _message: string) {
  throw new Error("Fake risky notification seam: outbound messages are out of scope for this fixture.");
}

export async function scheduleCustomerDigest(_accountId: string) {
  throw new Error("Fake risky notification seam: scheduling external sends is out of scope.");
}

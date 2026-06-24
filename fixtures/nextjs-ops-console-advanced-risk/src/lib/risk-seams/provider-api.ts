export async function createProviderCase(_accountId: string, _payload: unknown) {
  throw new Error("Fake risky provider seam: provider I/O is not allowed in local eval slices.");
}

export async function syncProviderStatus(_accountId: string) {
  throw new Error("Fake risky provider seam: syncs require production credentials.");
}

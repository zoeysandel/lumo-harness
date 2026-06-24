export async function recordAuditEvent(_eventName: string, _payload: unknown) {
  throw new Error("Fake risky audit seam: do not create durable audit events from fixture tasks.");
}

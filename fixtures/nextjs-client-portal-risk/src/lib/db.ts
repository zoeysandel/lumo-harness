export type ClientEscalationRecord = {
  clientId: string;
  reason: string;
  urgency: "low" | "medium" | "high";
  ownerId: string;
};

export async function saveClientEscalation(record: ClientEscalationRecord): Promise<{ id: string }> {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is missing");
  }

  return {
    id: `client-escalation-${record.clientId}-${record.ownerId}`,
  };
}


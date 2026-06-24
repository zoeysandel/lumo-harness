export type EscalationRecord = {
  intakeId: string;
  reason: string;
  priority: string;
  userId: string;
};

export async function saveEscalation(record: EscalationRecord): Promise<{ id: string }> {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is missing");
  }

  return {
    id: `escalation-${record.intakeId}-${record.userId}`,
  };
}

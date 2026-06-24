export type IntakeTriageRecord = {
  message: string;
  category: string;
  urgency: string;
  suggestedNextStep: string;
  userId: string;
};

export async function saveIntakeTriage(record: IntakeTriageRecord): Promise<{ id: string }> {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is missing");
  }

  return {
    id: `triage-${record.userId}`,
  };
}

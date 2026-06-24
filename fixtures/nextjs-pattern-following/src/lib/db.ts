export type NotificationPreferencesRecord = {
  userId: string;
  emailDigest: boolean;
  productUpdates: boolean;
  securityAlerts: boolean;
};

export async function saveNotificationPreferences(record: NotificationPreferencesRecord): Promise<{ id: string }> {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is missing");
  }

  return { id: `notification-preferences-${record.userId}` };
}

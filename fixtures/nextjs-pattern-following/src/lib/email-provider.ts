export type PreferenceConfirmation = {
  email: string;
  enabled: string[];
};

export async function sendPreferenceConfirmation(payload: PreferenceConfirmation): Promise<{ id: string }> {
  const emailApiKey = process.env.EMAIL_API_KEY;

  if (!emailApiKey) {
    throw new Error("EMAIL_API_KEY is missing");
  }

  await fetch("https://email.example.test/preferences", {
    method: "POST",
    headers: {
      authorization: `Bearer ${emailApiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return { id: `email-${payload.email}` };
}

export type AiTriageResult = {
  category: "billing" | "technical" | "account" | "general";
  urgency: "low" | "medium" | "high";
  suggestedNextStep: string;
};

export async function classifyWithOpenAI(message: string): Promise<AiTriageResult> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is missing");
  }

  await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      input: `Classify this intake message: ${message}`,
    }),
  });

  return {
    category: "general",
    urgency: "medium",
    suggestedNextStep: "Review the AI-generated triage before acting.",
  };
}

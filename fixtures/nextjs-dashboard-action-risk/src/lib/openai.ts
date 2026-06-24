export type EscalationAdvice = {
  priority: "low" | "medium" | "high";
  suggestedReason: string;
};

export async function classifyEscalationWithOpenAI(message: string): Promise<EscalationAdvice> {
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
      input: `Suggest an escalation priority for this intake: ${message}`,
    }),
  });

  return {
    priority: "medium",
    suggestedReason: "Review the AI-generated escalation advice before acting.",
  };
}

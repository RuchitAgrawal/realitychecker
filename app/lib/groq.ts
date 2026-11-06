import { buildSystemPrompt, buildUserPrompt } from "./prompt";
import { FeedbackSchema, type ValidatedFeedback } from "./schemas";

export interface AnalyzeParams {
  resumeText: string;
  jobTitle?: string;
  jobDescription?: string;
}

export async function runGroqAnalysis(
  params: AnalyzeParams,
  apiKey: string
): Promise<ValidatedFeedback> {
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not configured.");
  }

  const { resumeText, jobTitle, jobDescription } = params;

  let res: Response | null = null;
  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    attempts++;
    res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: buildSystemPrompt() },
          {
            role: "user",
            content: buildUserPrompt(resumeText, jobTitle, jobDescription),
          },
        ],
        temperature: 0.1,
        max_tokens: 4096,
        response_format: { type: "json_object" },
      }),
    });

    if (res.ok) break;

    // Retry on 429 or 503
    if ((res.status === 429 || res.status === 503) && attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, attempts * 1500));
      continue;
    }

    const errorText = await res.text();
    throw new Error(`Groq API error ${res.status}: ${errorText}`);
  }

  if (!res || !res.ok) {
    throw new Error("Groq API request failed after retries.");
  }

  const data = (await res.json()) as {
    choices: Array<{ message: { content: string } }>;
  };

  const raw = data.choices?.[0]?.message?.content ?? "";
  const cleaned = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  const parsed = JSON.parse(cleaned);
  const validated = FeedbackSchema.safeParse(parsed);

  if (!validated.success) {
    console.error("Feedback validation failed:", validated.error.format());
    throw new Error("AI output did not match expected feedback schema.");
  }

  return validated.data;
}

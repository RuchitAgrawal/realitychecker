import { buildSystemPrompt, buildUserPrompt } from "./prompt";
import { FeedbackSchema, type ValidatedFeedback } from "./schemas";

export interface AnalyzeParams {
  resumeText: string;
  jobTitle?: string;
  jobDescription?: string;
}

const CANDIDATE_MODELS = [
  process.env.GROQ_MODEL,
  "openai/gpt-oss-120b",
  "openai/gpt-oss-20b",
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
].filter(Boolean) as string[];

export async function runGroqAnalysis(
  params: AnalyzeParams,
  apiKey: string
): Promise<ValidatedFeedback> {
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not configured.");
  }

  const { resumeText, jobTitle, jobDescription } = params;

  let res: Response | null = null;
  let lastError = "";

  // Try candidate models in order if one is unavailable or deprecated
  for (const model of CANDIDATE_MODELS) {
    let attempts = 0;
    const maxAttempts = 2;

    while (attempts < maxAttempts) {
      attempts++;
      res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
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
        await new Promise((resolve) => setTimeout(resolve, attempts * 1000));
        continue;
      }

      const errorText = await res.text();
      lastError = `Groq (${model}) error ${res.status}: ${errorText}`;

      // If model not found (404), break inner retry and try next candidate model
      if (res.status === 404 || errorText.includes("model_not_found")) {
        break;
      }

      throw new Error(lastError);
    }

    if (res && res.ok) break;
  }

  if (!res || !res.ok) {
    throw new Error(lastError || "Groq API request failed across all candidate models.");
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
  const target = Array.isArray(parsed)
    ? parsed[0]
    : parsed && typeof parsed === "object" && "feedback" in parsed
      ? parsed.feedback
      : parsed;

  const validated = FeedbackSchema.safeParse(target);

  if (!validated.success) {
    console.error("Feedback validation failed:", validated.error.format());
    throw new Error("AI output did not match expected feedback schema.");
  }

  return validated.data;
}

import { GoogleGenerativeAI } from "@google/generative-ai";
import { buildSystemPrompt, buildUserPrompt } from "./prompt";
import { FeedbackSchema, type ValidatedFeedback } from "./schemas";

const GEMINI_MODELS = [
  "gemini-flash-latest",
  "gemini-2.5-flash-lite",
  "gemini-2.5-flash",
  "gemini-1.5-flash",
];

export async function runGeminiVisionAnalysis(
  imageBase64: string,
  mimeType: string,
  jobTitle?: string,
  jobDescription?: string,
  apiKey?: string
): Promise<ValidatedFeedback> {
  const geminiKey = apiKey || process.env.GEMINI_API_KEY;
  if (!geminiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  const genAI = new GoogleGenerativeAI(geminiKey);
  const prompt = buildUserPrompt(
    "Please read the attached resume image thoroughly and evaluate it.",
    jobTitle,
    jobDescription
  );

  const imagePart = {
    inlineData: {
      data: imageBase64,
      mimeType: mimeType || "image/png",
    },
  };

  let lastError: unknown = null;

  for (const modelName of GEMINI_MODELS) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: buildSystemPrompt(),
        generationConfig: {
          temperature: 0.1,
          responseMimeType: "application/json",
        },
      });

      const result = await model.generateContent([prompt, imagePart]);
      const text = result.response.text();

      const cleaned = text
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();

      const parsed = JSON.parse(cleaned);
      const validated = FeedbackSchema.safeParse(parsed);
      if (validated.success) {
        return validated.data;
      }
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error("Gemini analysis failed across all models.");
}

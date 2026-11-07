import { GoogleGenerativeAI } from "@google/generative-ai";
import { buildSystemPrompt, buildUserPrompt } from "./prompt";
import { FeedbackSchema, type ValidatedFeedback } from "./schemas";

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
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction: buildSystemPrompt(),
    generationConfig: {
      temperature: 0.1,
      responseMimeType: "application/json",
    },
  });

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

  const result = await model.generateContent([prompt, imagePart]);
  const text = result.response.text();

  const cleaned = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  const parsed = JSON.parse(cleaned);
  const validated = FeedbackSchema.safeParse(parsed);
  if (!validated.success) {
    console.error("Gemini Vision validation failed:", validated.error.format());
    throw new Error("Gemini output did not match expected feedback schema.");
  }

  return validated.data;
}

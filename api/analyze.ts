import type { VercelRequest, VercelResponse } from "@vercel/node";
import { runGroqAnalysis } from "../app/lib/groq";
import { runGeminiVisionAnalysis } from "../app/lib/gemini";
import { getCachedFeedback, setCachedFeedback } from "../app/lib/redis";
import crypto from "crypto";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { resumeText, imageBase64, mimeType, jobTitle, jobDescription } = req.body as {
      resumeText?: string;
      imageBase64?: string;
      mimeType?: string;
      jobTitle?: string;
      jobDescription?: string;
    };

    const hasText = Boolean(resumeText && resumeText.trim().length >= 50);
    const hasImage = Boolean(imageBase64 && imageBase64.length > 100);

    if (!hasText && !hasImage) {
      return res.status(400).json({
        error: "Either valid resumeText or an imageBase64 fallback is required.",
      });
    }

    // Cache key based on text or image signature
    const inputSignature = hasText ? resumeText! : imageBase64!.slice(0, 500);

    const hash = crypto
      .createHash("sha256")
      .update(`${inputSignature}::${jobTitle || ""}::${jobDescription || ""}`)
      .digest("hex");
    const cacheKey = `feedback:${hash}`;

    const cached = await getCachedFeedback(cacheKey);
    if (cached) {
      return res.status(200).json({ feedback: cached, cached: true });
    }

    let feedback;

    // Primary route: Groq for text
    if (hasText) {
      const groqKey = process.env.GROQ_API_KEY;
      if (!groqKey) {
        return res.status(500).json({ error: "GROQ_API_KEY not configured on server" });
      }
      feedback = await runGroqAnalysis(
        { resumeText: resumeText!, jobTitle, jobDescription },
        groqKey
      );
    } else {
      // Vision fallback: Gemini Flash for scanned / flat image PDFs
      const geminiKey = process.env.GEMINI_API_KEY;
      if (!geminiKey) {
        return res.status(500).json({
          error:
            "Could not extract text and GEMINI_API_KEY is not configured for vision fallback.",
        });
      }
      feedback = await runGeminiVisionAnalysis(
        imageBase64!,
        mimeType || "image/png",
        jobTitle,
        jobDescription,
        geminiKey
      );
    }

    await setCachedFeedback(cacheKey, feedback).catch(() => {});

    return res.status(200).json({ feedback, cached: false });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[analyze]", msg);
    return res.status(500).json({ error: `Analysis failed: ${msg}` });
  }
}

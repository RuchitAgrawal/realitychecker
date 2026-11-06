import type { VercelRequest, VercelResponse } from "@vercel/node";
import { runGroqAnalysis } from "../app/lib/groq";
import { getCachedFeedback, setCachedFeedback } from "../app/lib/redis";
import crypto from "crypto";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { resumeText, jobTitle, jobDescription } = req.body as {
      resumeText: string;
      jobTitle?: string;
      jobDescription?: string;
    };

    if (!resumeText || typeof resumeText !== "string") {
      return res.status(400).json({ error: "resumeText is required" });
    }

    // Generate content hash for cache lookup
    const hash = crypto
      .createHash("sha256")
      .update(`${resumeText}::${jobTitle || ""}::${jobDescription || ""}`)
      .digest("hex");
    const cacheKey = `feedback:${hash}`;

    const cached = await getCachedFeedback(cacheKey);
    if (cached) {
      return res.status(200).json({ feedback: cached, cached: true });
    }

    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) {
      return res.status(500).json({ error: "GROQ_API_KEY not configured on server" });
    }

    const feedback = await runGroqAnalysis(
      { resumeText, jobTitle, jobDescription },
      groqKey
    );

    // Cache in Redis in background
    await setCachedFeedback(cacheKey, feedback).catch(() => {});

    return res.status(200).json({ feedback, cached: false });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[analyze]", msg);
    return res.status(500).json({ error: `Analysis failed: ${msg}` });
  }
}

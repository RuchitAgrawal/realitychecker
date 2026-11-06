import type { VercelRequest, VercelResponse } from "@vercel/node";
import { runGroqAnalysis } from "../app/lib/groq";

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

    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) {
      return res.status(500).json({ error: "GROQ_API_KEY not configured on server" });
    }

    const feedback = await runGroqAnalysis(
      { resumeText, jobTitle, jobDescription },
      groqKey
    );

    return res.status(200).json({ feedback });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[analyze]", msg);
    return res.status(500).json({ error: `Analysis failed: ${msg}` });
  }
}

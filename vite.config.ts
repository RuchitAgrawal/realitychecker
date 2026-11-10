import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, loadEnv } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import type { IncomingMessage, ServerResponse } from "http";
import { runGroqAnalysis } from "./app/lib/groq";
import { runGeminiVisionAnalysis } from "./app/lib/gemini";
import { Redis } from "@upstash/redis";
import crypto from "crypto";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [
      tailwindcss(),
      reactRouter(),
      tsconfigPaths(),

      // Dev-only: handle /api/analyze without needing `vercel dev`
      {
        name: "local-api-analyze",
        apply: "serve" as const,
        configureServer(server) {
          server.middlewares.use(
            "/api/analyze",
            async (req: IncomingMessage, res: ServerResponse) => {
              if (req.method !== "POST") {
                res.writeHead(405);
                res.end("Method not allowed");
                return;
              }

              let body = "";
              req.on("data", (chunk: Buffer) => (body += chunk.toString()));
              req.on("end", async () => {
                try {
                  const { resumeText, imageBase64, mimeType, jobTitle, jobDescription } = JSON.parse(body);
                  const hasText = Boolean(resumeText && resumeText.trim().length >= 50);
                  const hasImage = Boolean(imageBase64 && imageBase64.length > 100);

                  if (!hasText && !hasImage) {
                    res.writeHead(400, { "Content-Type": "application/json" });
                    res.end(JSON.stringify({ error: "Valid resumeText or imageBase64 required." }));
                    return;
                  }

                  // Redis cache check
                  let redisClient: Redis | null = null;
                  let cacheKey = "";
                  if (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN) {
                    try {
                      redisClient = new Redis({
                        url: env.UPSTASH_REDIS_REST_URL,
                        token: env.UPSTASH_REDIS_REST_TOKEN,
                      });
                      const inputSig = hasText ? resumeText : imageBase64.slice(0, 500);
                      const hash = crypto
                        .createHash("sha256")
                        .update(`${inputSig}::${jobTitle || ""}::${jobDescription || ""}`)
                        .digest("hex");
                      cacheKey = `feedback:${hash}`;
                      const cached = await redisClient.get(cacheKey);
                      if (cached) {
                        console.log("[local-api-analyze] Cache hit from Redis (40ms)!");
                        res.writeHead(200, { "Content-Type": "application/json" });
                        res.end(JSON.stringify({ feedback: cached, cached: true }));
                        return;
                      }
                    } catch (cacheErr) {
                      console.warn("[local-api-analyze] Redis check skipped:", cacheErr);
                    }
                  }

                  let feedback;
                  if (hasText) {
                    const groqKey = env.GROQ_API_KEY;
                    if (!groqKey) {
                      res.writeHead(500, { "Content-Type": "application/json" });
                      res.end(JSON.stringify({ error: "GROQ_API_KEY not set in .env.local" }));
                      return;
                    }
                    feedback = await runGroqAnalysis(
                      { resumeText, jobTitle, jobDescription },
                      groqKey
                    );
                  } else {
                    const geminiKey = env.GEMINI_API_KEY;
                    if (!geminiKey) {
                      res.writeHead(500, { "Content-Type": "application/json" });
                      res.end(JSON.stringify({ error: "GEMINI_API_KEY not configured for vision fallback." }));
                      return;
                    }
                    feedback = await runGeminiVisionAnalysis(
                      imageBase64,
                      mimeType || "image/png",
                      jobTitle,
                      jobDescription,
                      geminiKey
                    );
                  }

                  // Cache write
                  if (redisClient && cacheKey && feedback) {
                    await redisClient.set(cacheKey, feedback, { ex: 86400 * 7 }).catch(() => {});
                  }

                  res.writeHead(200, { "Content-Type": "application/json" });
                  res.end(JSON.stringify({ feedback, cached: false }));
                } catch (err: unknown) {
                  const msg = err instanceof Error ? err.message : String(err);
                  console.error("[local-api-analyze]", msg);
                  res.writeHead(500, { "Content-Type": "application/json" });
                  res.end(JSON.stringify({ error: `Analysis failed: ${msg}` }));
                }
              });
            }
          );
        },
      },
    ],
  };
});

import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, loadEnv } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import type { IncomingMessage, ServerResponse } from "http";
import { buildSystemPrompt, buildUserPrompt } from "./app/lib/prompt";

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
                  const { resumeText, jobTitle, jobDescription } = JSON.parse(body);
                  const groqKey = env.GROQ_API_KEY;

                  if (!groqKey) {
                    res.writeHead(500, { "Content-Type": "application/json" });
                    res.end(JSON.stringify({ error: "GROQ_API_KEY not set in .env.local" }));
                    return;
                  }

                  const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${groqKey}`,
                    },
                    body: JSON.stringify({
                      model: "llama-3.3-70b-versatile",
                      messages: [
                        { role: "system", content: buildSystemPrompt() },
                        { role: "user", content: buildUserPrompt(resumeText, jobTitle, jobDescription) },
                      ],
                      temperature: 0.1,
                      max_tokens: 4096,
                      response_format: { type: "json_object" },
                    }),
                  });

                  if (!groqRes.ok) {
                    const errText = await groqRes.text();
                    throw new Error(`Groq API error ${groqRes.status}: ${errText}`);
                  }

                  const groqData = (await groqRes.json()) as {
                    choices: Array<{ message: { content: string } }>;
                  };
                  const raw = groqData.choices?.[0]?.message?.content ?? "";
                  const cleaned = raw
                    .replace(/^```json\s*/i, "")
                    .replace(/^```\s*/i, "")
                    .replace(/\s*```$/i, "")
                    .trim();

                  const feedback = JSON.parse(cleaned);
                  res.writeHead(200, { "Content-Type": "application/json" });
                  res.end(JSON.stringify({ feedback }));
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

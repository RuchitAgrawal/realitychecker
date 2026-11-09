import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, loadEnv } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import type { IncomingMessage, ServerResponse } from "http";
import { runGroqAnalysis } from "./app/lib/groq";

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
                    res.end(
                      JSON.stringify({ error: "GROQ_API_KEY not set in .env.local" })
                    );
                    return;
                  }

                  const feedback = await runGroqAnalysis(
                    { resumeText, jobTitle, jobDescription },
                    groqKey
                  );

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

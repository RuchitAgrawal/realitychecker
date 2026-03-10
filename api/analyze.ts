import type { VercelRequest, VercelResponse } from '@vercel/node';
import { buildSystemPrompt, buildUserPrompt } from '../app/lib/prompt';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { resumeText, jobTitle, jobDescription } = req.body as {
            resumeText: string;
            jobTitle?: string;
            jobDescription?: string;
        };

        if (!resumeText || typeof resumeText !== 'string') {
            return res.status(400).json({ error: 'resumeText is required' });
        }

        const groqKey = process.env.GROQ_API_KEY;
        if (!groqKey) {
            return res.status(500).json({ error: 'GROQ_API_KEY not configured on server' });
        }

        const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${groqKey}`,
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    { role: 'system', content: buildSystemPrompt() },
                    { role: 'user', content: buildUserPrompt(resumeText, jobTitle, jobDescription) },
                ],
                temperature: 0.1,
                max_tokens: 4096,
                response_format: { type: 'json_object' },
            }),
        });

        if (!groqRes.ok) {
            const errText = await groqRes.text();
            throw new Error(`Groq error ${groqRes.status}: ${errText}`);
        }

        const groqData = (await groqRes.json()) as {
            choices: Array<{ message: { content: string } }>;
        };

        const raw = groqData.choices?.[0]?.message?.content ?? '';
        const cleaned = raw
            .replace(/^```json\s*/i, '')
            .replace(/^```\s*/i, '')
            .replace(/\s*```$/i, '')
            .trim();

        const feedback = JSON.parse(cleaned);
        return res.status(200).json({ feedback });
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('[analyze]', msg);
        return res.status(500).json({ error: `Analysis failed: ${msg}` });
    }
}

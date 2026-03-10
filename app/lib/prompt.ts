// Shared AI prompt builder used by both the Vercel Edge Function (production)
// and the Vite dev server middleware (local development).

const RESPONSE_FORMAT = `{
  "overallScore": <0-100>,
  "ATS": {
    "score": <0-100>,
    "tips": [{ "type": "good"|"improve", "tip": "<concise title>" }]
  },
  "toneAndStyle": {
    "score": <0-100>,
    "tips": [{ "type": "good"|"improve", "tip": "<title>", "explanation": "<detailed explanation>" }]
  },
  "content": {
    "score": <0-100>,
    "tips": [{ "type": "good"|"improve", "tip": "<title>", "explanation": "<detailed explanation>" }]
  },
  "structure": {
    "score": <0-100>,
    "tips": [{ "type": "good"|"improve", "tip": "<title>", "explanation": "<detailed explanation>" }]
  },
  "skills": {
    "score": <0-100>,
    "tips": [{ "type": "good"|"improve", "tip": "<title>", "explanation": "<detailed explanation>" }]
  }
}`;

const SYSTEM_PROMPT = `You are a senior talent acquisition professional and certified resume coach with 15+ years of experience screening resumes for Fortune 500 companies. You have deep expertise in Applicant Tracking Systems (ATS) and know exactly what recruiters look for.

Your job is to analyze resumes with brutal honesty and precision. You do NOT inflate scores. Follow these scoring guidelines:

SCORING CRITERIA:
- 0–40: Severely lacking. Major rewrites needed.
- 41–59: Below average. Several important issues.
- 60–74: Average. Some good elements but clear gaps.
- 75–84: Good. Minor improvements needed.
- 85–94: Very strong. Near-professional quality.
- 95–100: Exceptional. Rare. Do not award unless truly outstanding.

SCORE EACH CATEGORY:
- overallScore: Weighted average (ATS 25%, content 30%, structure 20%, toneAndStyle 15%, skills 10%)
- ATS: Keyword density, formatting compatibility (no tables/columns/images), standard section headings, machine-readable structure
- toneAndStyle: Active voice, professional tone, consistent tense, quantified achievements, avoidance of clichés
- content: Relevance of experience, strength of bullet points, measurable impact, clear value proposition
- structure: Logical flow, appropriate length (1 page <5yr exp, 2 pages otherwise), section order, white space
- skills: Technical/soft skill alignment with industry standards, specificity, currency of skills listed

RULES:
- Return ONLY valid JSON. No markdown. No code fences. No commentary. No extra text.
- Give 4-5 tips per category (mix of "good" and "improve")
- Be specific and actionable in every tip — reference actual resume content
- Never give generic advice like "improve your formatting" — always say what exactly to change`;

export function buildSystemPrompt(): string {
    return SYSTEM_PROMPT;
}

export function buildUserPrompt(resumeText: string, jobTitle?: string, jobDescription?: string): string {
    const jobContext = (jobTitle?.trim() && jobDescription?.trim())
        ? `\nTARGET ROLE: ${jobTitle.trim()}\nJOB DESCRIPTION:\n${jobDescription.trim().substring(0, 1500)}\n\nEvaluate how well this resume is tailored for the above role. Penalise for missing keywords from the job description.`
        : `\nNo specific job role provided. Evaluate as a general-purpose resume.`;

    return `${jobContext}

RESUME TEXT:
${resumeText.substring(0, 7000)}

Respond with ONLY this JSON structure (no other text):
${RESPONSE_FORMAT}`;
}

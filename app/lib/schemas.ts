import { z } from "zod";

export const TipSchema = z.object({
  type: z.enum(["good", "improve"]),
  tip: z.string().min(1),
  explanation: z.string().optional(),
});

export const AtsCategorySchema = z.object({
  score: z.number().min(0).max(100),
  tips: z.array(TipSchema).default([]),
});

export const FeedbackSchema = z.object({
  overallScore: z.number().min(0).max(100),
  ATS: AtsCategorySchema,
  toneAndStyle: AtsCategorySchema,
  content: AtsCategorySchema,
  structure: AtsCategorySchema,
  skills: AtsCategorySchema,
  experienceLevel: z.enum(["entry", "mid", "senior"]).optional(),
  keywordAnalysis: z
    .object({
      matched: z.array(z.string()).default([]),
      missing: z.array(z.string()).default([]),
      partialMatch: z.array(z.string()).optional().default([]),
    })
    .optional(),
});

export type ValidatedFeedback = z.infer<typeof FeedbackSchema>;

import { z } from "zod";

const ScoreNumber = z.preprocess((val) => {
  const n = Number(val);
  if (isNaN(n)) return 70;
  return Math.max(0, Math.min(100, Math.round(n)));
}, z.number().min(0).max(100));

export const TipSchema = z.preprocess(
  (val: unknown) => {
    if (typeof val === "string") {
      return { type: "improve", tip: val, explanation: "" };
    }
    if (val && typeof val === "object") {
      const v = val as Record<string, unknown>;
      const rawType = String(v.type || "").toLowerCase();
      const isGood =
        rawType.includes("good") ||
        rawType.includes("strength") ||
        rawType.includes("pos") ||
        rawType === "pass";
      return {
        type: isGood ? "good" : "improve",
        tip: String(v.tip || v.text || v.title || v.message || "Feedback item"),
        explanation: typeof v.explanation === "string" ? v.explanation : undefined,
      };
    }
    return { type: "improve", tip: "Resume feedback point" };
  },
  z.object({
    type: z.enum(["good", "improve"]),
    tip: z.string().min(1),
    explanation: z.string().optional(),
  })
);

export const AtsCategorySchema = z.preprocess(
  (val: unknown) => {
    if (!val || typeof val !== "object") {
      return { score: 70, tips: [] };
    }
    const v = val as Record<string, unknown>;
    const rawTips = Array.isArray(v.tips)
      ? v.tips
      : v.tips
        ? [v.tips]
        : [];
    return {
      score: v.score ?? 70,
      tips: rawTips,
    };
  },
  z.object({
    score: ScoreNumber,
    tips: z.array(TipSchema).default([]),
  })
);

export const FeedbackSchema = z.preprocess(
  (raw: unknown) => {
    if (!raw || typeof raw !== "object") return {};
    const obj = raw as Record<string, unknown>;
    const data = (Array.isArray(raw) ? raw[0] : (obj.feedback ?? raw)) as Record<string, unknown>;

    const ATS = data.ATS || data.ats || { score: 70, tips: [] };
    const toneAndStyle =
      data.toneAndStyle || data.tone_and_style || data.tone || { score: 70, tips: [] };
    const content = data.content || { score: 70, tips: [] };
    const structure = data.structure || { score: 70, tips: [] };
    const skills = data.skills || { score: 70, tips: [] };

    let overallScore = data.overallScore ?? data.overall_score ?? data.score;
    if (overallScore === undefined) {
      const getNum = (c: unknown) => (c && typeof c === "object" && "score" in c ? Number((c as Record<string, unknown>).score) || 70 : 70);
      const s1 = getNum(ATS);
      const s2 = getNum(toneAndStyle);
      const s3 = getNum(content);
      const s4 = getNum(structure);
      const s5 = getNum(skills);
      overallScore = Math.round((s1 + s2 + s3 + s4 + s5) / 5);
    }

    let exp = data.experienceLevel || data.experience_level || data.level;
    let normalizedExp: "entry" | "mid" | "senior" = "mid";
    if (exp) {
      const s = String(exp).toLowerCase();
      if (s.includes("entry") || s.includes("junior") || s.includes("intern")) {
        normalizedExp = "entry";
      } else if (
        s.includes("senior") ||
        s.includes("lead") ||
        s.includes("principal") ||
        s.includes("staff")
      ) {
        normalizedExp = "senior";
      }
    }

    const kw = (data.keywordAnalysis || data.keywords || data.keyword_analysis || {}) as Record<string, unknown>;
    const normalizeList = (arr: unknown): string[] => {
      if (Array.isArray(arr)) return arr.map(String).filter(Boolean);
      if (typeof arr === "string") return arr.split(",").map((s) => s.trim()).filter(Boolean);
      return [];
    };

    return {
      overallScore,
      ATS,
      toneAndStyle,
      content,
      structure,
      skills,
      experienceLevel: normalizedExp,
      keywordAnalysis: {
        matched: normalizeList(kw.matched),
        missing: normalizeList(kw.missing),
        partialMatch: normalizeList(kw.partialMatch || kw.partial || kw.partial_matches),
      },
    };
  },
  z.object({
    overallScore: ScoreNumber,
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
  })
);

export type ValidatedFeedback = z.infer<typeof FeedbackSchema>;

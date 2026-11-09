interface Tip {
  type: "good" | "improve";
  tip: string;
  explanation?: string;
}

interface AtsCategory {
  score: number;
  tips: Tip[];
}

interface KeywordAnalysis {
  matched: string[];
  missing: string[];
  partialMatch?: string[];
}

interface Feedback {
  overallScore: number;
  experienceLevel?: "entry" | "mid" | "senior";
  ATS: AtsCategory;
  toneAndStyle: AtsCategory;
  content: AtsCategory;
  structure: AtsCategory;
  skills: AtsCategory;
  keywordAnalysis?: KeywordAnalysis;
}

interface Resume {
  id: string;
  companyName?: string;
  jobTitle?: string;
  jobDescription?: string;
  resumePath?: string;
  imagePath?: string;
  feedback?: Feedback;
  isPublic?: boolean;
  createdAt?: number;
}

// Legacy type used in old puter store (keep for compat)
interface KVItem {
  key: string;
  value: string;
}

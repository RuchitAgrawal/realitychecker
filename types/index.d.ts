interface Tip {
    type: 'good' | 'improve';
    tip: string;
    explanation?: string;
}

interface AtsCategory {
    score: number;
    tips: Tip[];
}

interface Feedback {
    overallScore: number;
    ATS: AtsCategory;
    toneAndStyle: AtsCategory;
    content: AtsCategory;
    structure: AtsCategory;
    skills: AtsCategory;
}

interface Resume {
    id: string;
    companyName?: string;
    jobTitle?: string;
    jobDescription?: string;
    resumePath?: string;
    imagePath?: string;
    feedback?: Feedback;
    createdAt?: number;
}

// Legacy type used in old puter store (keep for compat)
interface KVItem {
    key: string;
    value: string;
}

export interface ResumeRow {
  id: string;
  user_id: string;
  company_name: string | null;
  job_title: string | null;
  job_description: string | null;
  resume_path: string | null;
  image_path: string | null;
  feedback: Record<string, unknown> | null;
  is_public: boolean | null;
  created_at: string | null;
}

export interface Database {
  public: {
    Tables: {
      resumes: {
        Row: ResumeRow;
        Insert: Omit<ResumeRow, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<ResumeRow, "id">>;
      };
    };
  };
}

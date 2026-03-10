# RealityChecker

AI-powered resume analyzer that gives you an ATS score, detailed feedback, and side-by-side resume comparison — all in real time.

## Stack

- **Frontend** — React Router v7 + Vite + TypeScript + Tailwind CSS v4
- **Auth & DB** — Supabase (email/password + Google OAuth, Postgres, Row Level Security)
- **Storage** — Supabase Storage (private buckets: `resume-files`, `resume-images`)
- **AI** — Groq API (`llama-3.3-70b-versatile`) via Vercel Edge Function
- **Hosting** — Vercel

## Features

- 📄 Upload PDF resume → AI extracts text, generates PNG preview
- 🤖 AI analysis: ATS score, tone & style, content, structure, skills
- 🎯 Optional job description for role-specific feedback
- 📊 Resume history with sort & delete
- ⚖️ Side-by-side resume comparison with score breakdown
- 🔒 Per-user data isolation via Supabase RLS
- 📤 Export feedback as PDF (`window.print()`)

## Local Development

### 1. Clone & install

```bash
git clone https://github.com/your-username/realitychecker.git
cd realitychecker
npm install
```

### 2. Configure environment

Create a `.env.local` file:

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhb...
GROQ_API_KEY=gsk_...
```

### 3. Set up Supabase

Run this SQL in your Supabase **SQL Editor**:

```sql
create table resumes (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references auth.users not null,
  company_name    text,
  job_title       text,
  job_description text,
  resume_path     text,
  image_path      text,
  feedback        jsonb,
  created_at      timestamptz default now()
);

alter table resumes enable row level security;

create policy "Users manage own resumes" on resumes
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage own files" on storage.objects
  for all to authenticated
  using (bucket_id in ('resume-files', 'resume-images'))
  with check (bucket_id in ('resume-files', 'resume-images'));
```

Create two **private** Storage buckets: `resume-files` and `resume-images`.

### 4. Run

```bash
npm run dev
# → http://localhost:5173
```

> The `/api/analyze` Groq call is handled by an in-process Vite middleware locally — no Vercel CLI needed.

## Deploy to Vercel

1. Push to GitHub
2. Import project in [vercel.com](https://vercel.com)
3. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `GROQ_API_KEY`
4. Deploy — the `api/analyze.ts` Edge Function runs automatically

## Project Structure

```
realitychecker/
├── api/
│   └── analyze.ts          # Vercel Edge Function (Groq proxy)
├── app/
│   ├── components/         # UI components
│   ├── lib/
│   │   ├── supabase.ts     # Supabase client
│   │   ├── store.ts        # Zustand store (auth + CRUD + storage)
│   │   ├── prompt.ts       # AI system/user prompt builder
│   │   ├── pdf2img.ts      # PDF text extraction + PNG conversion
│   │   └── utils.ts        # Helpers
│   ├── routes/
│   │   ├── auth.tsx        # Sign in / Sign up
│   │   ├── home.tsx        # Resume dashboard
│   │   ├── upload.tsx      # Upload + analysis pipeline
│   │   ├── resume.tsx      # Feedback detail view
│   │   └── compare.tsx     # Side-by-side comparison
│   └── root.tsx
├── public/
│   └── pdf.worker.min.mjs  # pdfjs-dist worker
├── types/
│   └── index.d.ts          # Global TypeScript types
└── vite.config.ts          # Includes local /api/analyze middleware
```

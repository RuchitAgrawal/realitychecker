# RealityChecker

AI-powered resume analyzer that provides ATS scoring, structural feedback, and side-by-side resume comparison.

## Tech Stack

- Frontend: React Router v7, Vite, TypeScript, Tailwind CSS v4
- Backend & Auth: Supabase (Auth, Postgres, Row Level Security)
- Storage: Supabase Storage (`resume-files`, `resume-images`)
- AI Inference: Groq API (`llama-3.3-70b-versatile`) with Gemini Vision fallback
- Caching: Upstash Redis

## Getting Started

### 1. Clone repository and install dependencies

```bash
git clone https://github.com/RuchitAgrawal/realitychecker.git
cd realitychecker
npm install
```

### 2. Configure environment variables

Copy the example environment file and fill in your keys:

```bash
cp .env.example .env.local
```

Required keys:
- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Supabase anon/public key
- `GROQ_API_KEY`: Groq API key (console.groq.com)
- `GEMINI_API_KEY`: Google AI Studio API key (optional fallback)
- `UPSTASH_REDIS_REST_URL`: Upstash Redis REST URL (optional cache)
- `UPSTASH_REDIS_REST_TOKEN`: Upstash Redis REST token (optional cache)

### 3. Database Setup

Run the following SQL in your Supabase SQL editor:

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
  is_public       boolean default false,
  created_at      timestamptz default now()
);

alter table resumes enable row level security;

create policy "Users manage own resumes" on resumes
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Public resumes are readable by anyone" on resumes
  for select using (is_public = true);

create policy "Users manage own files" on storage.objects
  for all to authenticated
  using (bucket_id in ('resume-files', 'resume-images'))
  with check (bucket_id in ('resume-files', 'resume-images'));
```

Create two Storage buckets in Supabase:
- `resume-files` (private)
- `resume-images` (private)

### 4. Development

```bash
npm run dev
```

Visit `http://localhost:5173`.

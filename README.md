# RealityChecker

> **Autonomous AI Resume Engineering Workbench & ATS Precision Simulator.**  
> Built with React Router v7, Vite, Supabase, Groq LPUs, Gemini Vision, and Upstash Redis.

[![Live Demo](https://img.shields.io/badge/demo-realitychecker.vercel.app-f54e00?style=flat-square)](https://realitychecker.vercel.app)
[![React Router 7](https://img.shields.io/badge/React_Router-v7.12-26251e?style=flat-square&logo=reactrouter)](https://reactrouter.com/)
[![Groq LPU](https://img.shields.io/badge/AI_Engine-Groq_LPU_%2B_Gemini-f54e00?style=flat-square)](https://groq.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-807d72?style=flat-square)](LICENSE)

---

## Overview

RealityChecker is an engineering-grade resume analysis and optimization platform. Unlike generic resume checkers that output vague paragraph summaries, RealityChecker inspects resumes through the lens of modern Applicant Tracking Systems (ATS), engineering hiring bars, and quantifiable impact formulas.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        REALITYCHECKER WORKBENCH                        │
├──────────────────────────────────┬─────────────────────────────────────┤
│        INSPECTION ENGINE         │           AI FEEDBACK HUB           │
│  • Visual High-Res PDF Viewer    │  • Multi-Category Score Matrix      │
│  • Raw ATS X-Ray Token Stream    │  • Target Role Keyword Diffing      │
│  • Structural Hazard Detection   │  • Google XYZ Bullet Rewriter       │
│  • Multi-Column Heuristic Alerts │  • AI Interview Prep Simulator      │
└──────────────────────────────────┴─────────────────────────────────────┘
```

---

## Core Capabilities

### 1. ATS X-Ray Simulator & Hazard Inspector
* **Live Inspection Switch:** Toggle between visual high-fidelity PDF rendering and the raw plaintext token stream exactly as parsed by applicant tracking algorithms.
* **Parser Diagnostics Ribbon:** Evaluates candidate contact extraction, standard section header presence, character/word density, and multi-column parsing hazard flags.

### 2. Google XYZ & STAR Bullet Diff Rewriter
* **Formula Transformations:** Transforms passive, duty-focused bullet points into metric-driven accomplishments using:
  * **Google XYZ Formula:** *Accomplished [X] as measured by [Y] by doing [Z]*
  * **STAR Method:** *Situation, Task, Action, and Quantified Result*
  * **Leadership & Architecture:** *System ownership and technical decision framing*
* **Interactive Diffing:** Visual red/green git-style diffs with one-click clipboard copying.

### 3. Live Target Job Keyword Matcher
* **Slide-over Drawer:** Paste any job posting from LinkedIn, Greenhouse, or Lever.
* **Real-Time Fitness Scoring:** Client-side token diffing calculates candidate fitness percentage, highlights matched skills, and generates an instant missing keyword checklist.

### 4. Global Command Palette (`⌘K` / `Ctrl+K`)
* Keyboard-driven navigation across recent candidate evaluations, view toggles, target job matching, and PDF exports.

### 5. AI Interview Preparation Simulator
* Generates high-yield behavioral, system architecture, and red-flag interview questions tailored to detected resume gaps.
* Includes interviewer hidden objective notes and collapsible STAR talking point outlines.

---

## Architecture & Tech Stack

* **Frontend:** React Router v7 (SPA Mode), React 19, Tailwind CSS v4, TypeScript.
* **Backend & Auth:** Supabase (PostgreSQL, Row Level Security, Auth, Storage).
* **AI Orchestration:**
  * **Primary (Text):** Groq LPU inference via high-throughput open-weights models (`openai/gpt-oss-120b`, `llama-3.3-70b-versatile`) with automated fallback routing.
  * **Vision Fallback:** Google Gemini Flash (`gemini-flash-latest`, `gemini-2.5-flash`) for scanned image and flat PDF document parsing.
* **Caching & Performance:** Upstash Redis SHA-256 evaluation cache with sub-millisecond response on duplicate analyses.
* **Client-side Processing:** Web Workers with `pdfjs-dist` for client-side text chunking and canvas thumbnail generation without uploading raw bytes to external compute.

---

## Getting Started

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/RuchitAgrawal/realitychecker.git
cd realitychecker
npm install
```

### 2. Environment Configuration

Copy `.env.example` to `.env.local` and configure your credentials:

```bash
cp .env.example .env.local
```

Required keys:
```env
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# AI Inference (Server / Vercel Edge Functions)
GROQ_API_KEY=gsk_...
GEMINI_API_KEY=AQ....

# Cache (Optional)
UPSTASH_REDIS_REST_URL=https://...upstash.io
UPSTASH_REDIS_REST_TOKEN=...
```

### 3. Database & Storage Initialization

Execute the following SQL in your Supabase SQL Editor:

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
```

Create two private Storage buckets in your Supabase project:
* `resume-files`
* `resume-images`

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

---

## Production Build & Typecheck

```bash
# Typecheck
npm run typecheck

# Production build
npm run build
```

---

## Author & License

* **Author:** Ruchit Agrawal ([GitHub](https://github.com/RuchitAgrawal) · [LinkedIn](https://linkedin.com/in/ruchit-agrawal16))
* **License:** MIT

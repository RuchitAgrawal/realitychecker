# Contributing to RealityChecker

Thank you for your interest in contributing to RealityChecker. This document outlines our development workflows, coding standards, branch conventions, and pull request procedures.

---

## 1. Getting Started

### Prerequisites

- Node.js 20.0 or higher
- npm 10.0 or higher
- A Supabase project (PostgreSQL + Auth + Storage)
- Groq API key and Google Gemini API key

### Local Setup

1. Clone the repository and install dependencies:

   ```bash
   git clone https://github.com/rragrawal16/realitychecker.git
   cd realitychecker
   npm install
   ```

2. Copy the environment configuration template:

   ```bash
   cp .env.example .env.local
   ```

3. Fill in the required environment variables:
   - `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
   - `GROQ_API_KEY` (Free tier fast LLM analysis)
   - `GEMINI_API_KEY` (Gemini 1.5 Flash vision fallback)
   - `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` (Optional response caching)

4. Start the local development server:
   ```bash
   npm run dev
   ```

---

## 2. Architecture & Codebase Layout

```
realitychecker/
├── app/
│   ├── components/         # Reusable presentation components (Summary, ATS, Details, etc.)
│   ├── lib/
│   │   ├── gemini.ts       # Gemini 1.5 Flash Vision OCR & analysis fallback
│   │   ├── groq.ts         # Primary Groq API client with JSON retry logic
│   │   ├── redis.ts        # Upstash Redis caching layer
│   │   ├── schemas.ts      # Zod validation schemas for AI responses
│   │   ├── store.ts        # Zustand application store & Supabase data mappers
│   │   ├── supabase.ts     # Supabase client initialization & env guard
│   │   └── utils.ts        # Score helpers, formatters, and color utilities
│   ├── routes/             # React Router v7 routes (home, auth, upload, resume, compare)
│   ├── app.css             # Design tokens, utility classes, and print stylesheets
│   └── root.tsx            # Root layout, TanStack Query provider, and error boundary
├── types/                  # Global TypeScript definitions and database row interfaces
└── vite.config.ts          # Vite build config, dev server API routes, and plugins
```

---

## 3. Branching & Git Conventions

### Branch Naming

Keep branch names short, descriptive, and prefixed by category:

- `feature/<name>` for new capabilities (e.g. `feature/keyword-gap-analysis`)
- `fix/<name>` for bug fixes (e.g. `fix/expired-signed-urls`)
- `refactor/<name>` for code restructuring without behavioral change
- `docs/<name>` for documentation updates

### Commit Messages

- Use the imperative mood in the subject line (e.g., `fix expired signed url by refetching on image load error`, not `fixed...`).
- Keep commit titles concise, single-line, and descriptive.
- Focus each commit on a single logical change.

---

## 4. Code Quality & Formatting

Before opening a pull request, ensure all verification checks pass:

1. **TypeScript Verification**:

   ```bash
   npm run typecheck
   ```

   All code must compile under strict TypeScript mode with zero errors.

2. **Linting**:

   ```bash
   npm run lint
   ```

3. **Code Formatting**:
   ```bash
   npm run format
   ```

---

## 5. Pull Request Guidelines

1. Ensure the branch is rebased on top of the latest `master`.
2. Provide a clear summary in your PR description:
   - What was changed and why
   - Screenshots or terminal logs demonstrating the change
   - Notes on any environment variables or schema migrations required
3. PRs require approval and green CI checks before merging.

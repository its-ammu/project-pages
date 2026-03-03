# Task Manager — Minimal Planner

A personal task manager with projects as notebook pages, color-labeled tasks, and progress tracking. Built with Next.js, Supabase, and Tailwind. Design inspired by [Tweek](https://tweek.so/).

## Features

- **Projects as Notebook Pages** — Each project appears as a distinct card on the dashboard
- **Color-Labeled Tasks** — Red, orange, yellow, green, blue, purple (or uncolored)
- **Task Management** — Add, complete (strikethrough), edit, delete tasks
- **Progress Bars** — Per-project completion percentage
- **Stats Panel** — Overall completion (donut chart), tasks by color (bar chart)
- **Data Persistence** — Supabase PostgreSQL with email/password auth

## Tech Stack

- **Next.js 14** (App Router)
- **Supabase** (PostgreSQL + Auth)
- **TypeScript**
- **Tailwind CSS**

## Setup

### 1. Clone and install

```bash
npm install
```

### 2. Create Supabase project

1. Go to [supabase.com](https://supabase.com) and create a project
2. In **Authentication** → **Providers**, ensure **Email** is enabled (default)
3. Optional: In **Authentication** → **Email Templates**, disable "Confirm email" for faster sign-up (free tier)
4. In **SQL Editor**, run the migration:

```sql
-- Copy contents from supabase/migrations/001_initial_schema.sql
```

Run the second migration for due dates:

```sql
-- Copy contents from supabase/migrations/002_add_due_date.sql
alter table public.tasks add column if not exists due_date date;
```

Or use the Supabase CLI:

```bash
npx supabase init
npx supabase db push
```

### 3. Environment variables

Copy `.env.local.example` to `.env.local` and add your Supabase credentials:

```bash
cp .env.local.example .env.local
```

Get `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from your Supabase project **Settings** → **API**.

### 4. Run locally

```bash
npm run dev
```

## Deployment

### Vercel (recommended)

1. Push to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables
4. Deploy

### Azure Static Web Apps

1. Create a Static Web App in Azure
2. Connect your repo
3. Build config: `next build` with output `.next`
4. Add environment variables in Azure portal

---

Data persists via Supabase. Sign up with email and password to get started.

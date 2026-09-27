# AnimeClips AI — Production Deployment Guide

This guide details the step-by-step production deployment for AnimeClips AI using:
**GitHub → Vercel (Frontend & Serverless API) → Supabase (Database, Auth & Storage) → Media Worker (FFmpeg / FFprobe Processing)**.

---

## 1. System Architecture Overview

```text
Browser (Next.js Client)
       │
       ▼
Next.js on Vercel (UI, Auth, API Routes, Job Enqueuing)
       │
       ▼
Supabase Cloud (PostgreSQL, Storage Buckets, Realtime Events)
       │
       ▼
Media Processing Worker (Asynchronous Daemon with FFmpeg & FFprobe)
       │
       ▼
Supabase Storage (Rendered 9:16 Shorts & Posters)
```

---

## 2. GitHub Repository

- **Repository**: [https://github.com/Nati-13/ANIMECLIPS-AI](https://github.com/Nati-13/ANIMECLIPS-AI)
- **Branch**: `main`
- All source files, database migrations, and configurations are tracked.
- Sensitive environment files (`.env`, `.env.local`) and heavy media (`*.mp4`, `storage/*`) are strictly excluded.

---

## 3. Supabase Configuration

### A. Create Project
1. Create a new project in the [Supabase Dashboard](https://supabase.com).
2. Note your **Project URL**, **Anon Key**, and **Service Role Key** under Project Settings → API.

### B. Run Database Migrations
Execute the SQL migrations in the Supabase SQL Editor:
1. `supabase/migrations/20260927000001_init_animeclips.sql`
   - Sets up tables: `projects`, `source_videos`, `scenes`, `clips`, `clip_edits`, `render_jobs`
   - Configures foreign keys, cascade deletes, and B-tree indexes
   - Enables Row-Level Security (RLS) on all tables
2. `supabase/migrations/20260927000002_add_worker_job_claiming.sql`
   - Adds worker columns and queue index to `render_jobs`
   - Creates atomic claiming function `claim_next_render_job` with `FOR UPDATE SKIP LOCKED`
   - Sets up storage access policies

### C. Configure Storage Buckets
The migrations automatically initialize the following buckets under Storage:
- `source-videos` (Private: for uploaded full-length videos)
- `generated-clips` (Public: for rendered 9:16 vertical shorts)
- `thumbnails` (Public: for poster frames and clip previews)
- `captions` (Private: for subtitle files)
- `music` (Private: for background audio)
- `sfx` (Private: for sound effects)

---

## 4. Vercel Deployment (Frontend & API)

### A. Import Project
1. In the [Vercel Dashboard](https://vercel.com), click **Add New** → **Project**.
2. Select the GitHub repository: `Nati-13/ANIMECLIPS-AI`.
3. Framework Preset: **Next.js** (Root Directory: `./`).

### B. Configure Environment Variables
Add the following in Vercel Settings → Environment Variables:

| Variable | Scope | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Production, Preview, Development | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production, Preview, Development | Supabase public anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Production (Secret) | Server-only Supabase service-role secret |
| `ENABLE_INLINE_MEDIA_WORKER` | Production (`false`) | Set `false` on Vercel so jobs queue for worker |
| `LOCAL_STORAGE_DIR` | Production (`/tmp/storage`) | Ephemeral serverless scratch directory |

> **IMPORTANT**: Never prefix `SUPABASE_SERVICE_ROLE_KEY` with `NEXT_PUBLIC_`. Keep it server-only.

### C. Deploy
Click **Deploy**. Next.js will build all pages and serverless API endpoints with zero errors.

---

## 5. Media Worker Deployment (Dedicated Processing)

Because long video analysis and 9:16 FFmpeg rendering require dedicated CPU/GPU resources and execute beyond standard serverless timeouts, deploy the media worker to a dedicated container (Docker on AWS ECS, Fly.io, Railway, DigitalOcean, or Linux VPS).

### A. Docker / Linux Host Requirements
- **Node.js**: 20+ LTS
- **FFmpeg & FFprobe**: Version 5.0+ installed and on system PATH
  ```bash
  sudo apt-get update && sudo apt-get install -y ffmpeg
  ```

### B. Worker Environment Variables
Create `.env` on the worker instance:
```env
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>

FFMPEG_PATH=/usr/bin/ffmpeg
FFPROBE_PATH=/usr/bin/ffprobe

WORKER_POLL_INTERVAL_MS=3000
WORKER_CONCURRENCY=1
ENABLE_INLINE_MEDIA_WORKER=false
```

### C. Start Worker
```bash
npm install
npm run worker
```

For production background execution, use `pm2` or `systemd`:
```bash
npx pm2 start "npm run worker" --name "animeclips-worker"
```

---

## 6. Health & Diagnostic Endpoints

- **System Health**: `GET /api/health`
  Returns health status of the application, database connection, storage, and worker.
- **Capabilities Matrix**: `GET /api/capabilities`
  Inspects available binaries, AI engines, and storage subsystems.

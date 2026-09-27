# AnimeClips AI — Production Deployment Checklist

This document provides the definitive verification matrix for deploying AnimeClips AI to production across **GitHub**, **Vercel**, **Supabase**, and the **Media Processing Worker**.

---

## 1. Source Control & Repository
- [x] GitHub repository connected: `https://github.com/Nati-13/ANIMECLIPS-AI`
- [x] Branch verified: `main`
- [x] Large video files excluded (`*.mp4`, `*.mov`, `*.webm`, `*.mkv`) via `.gitignore`
- [x] Sensitive credentials excluded (`.env`, `.env.local`, API keys) via `.gitignore`
- [x] TypeScript builds with 0 errors (`npm run typecheck`)
- [x] Unit & pipeline tests pass (`npm test`)

---

## 2. Supabase Cloud Configuration
- [ ] Supabase project created in desired cloud region
- [ ] Database migrations applied:
  - `supabase/migrations/20260927000001_init_animeclips.sql` (Tables, Foreign Keys, RLS, Indexes)
  - `supabase/migrations/20260927000002_add_worker_job_claiming.sql` (Atomic worker claiming function `claim_next_render_job`)
- [ ] Row Level Security (RLS) active on all tables:
  - `projects`, `source_videos`, `scenes`, `clips`, `clip_edits`, `render_jobs`
- [ ] Storage Buckets created and permissions configured:
  - `source-videos` (Private: authenticated upload, worker access)
  - `generated-clips` (Public: short MP4 previews and downloads)
  - `thumbnails` (Public: clip poster frames)
  - `captions` (Private: SRT/VTT subtitle files)
  - `music` (Private: background tracks)
  - `sfx` (Private: sound effects)
- [ ] Supabase Realtime enabled for `render_jobs` and `clips` tables.

---

## 3. Vercel Frontend & Serverless Deployment
- [ ] Vercel project imported from `https://github.com/Nati-13/ANIMECLIPS-AI`
- [ ] Production Environment Variables configured in Vercel Dashboard:
  ```env
  NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
  SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
  LOCAL_STORAGE_DIR=/tmp/storage
  ENABLE_INLINE_MEDIA_WORKER=false
  ```
- [ ] Serverless function timeouts respected (Heavy media jobs enqueued asynchronously).
- [ ] Health endpoint verified: `https://<your-vercel-domain>/api/health`
- [ ] Capabilities endpoint verified: `https://<your-vercel-domain>/api/capabilities`

---

## 4. Media Processing Worker Daemon
- [ ] Worker environment provisioned (Docker / AWS ECS / Fly.io / Railway / VPS):
  - Node.js 20+ installed
  - FFmpeg & FFprobe installed (`ffmpeg -version`, `ffprobe -version`)
- [ ] Worker Environment Variables configured:
  ```env
  NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
  SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
  FFMPEG_PATH=/usr/bin/ffmpeg
  FFPROBE_PATH=/usr/bin/ffprobe
  WORKER_POLL_INTERVAL_MS=3000
  WORKER_CONCURRENCY=1
  ```
- [ ] Worker daemon started: `npm run worker`
- [ ] Atomic job claiming verified (`FOR UPDATE SKIP LOCKED` prevents double-processing)
- [ ] Real FFmpeg 9:16 rendering verified in worker
- [ ] Real FFprobe output validation verified in worker

---

## 5. End-to-End User Verification
- [ ] Project creation & video upload
- [ ] Automatic scene detection & audio/motion analysis
- [ ] AI clip generation & scoring
- [ ] Realtime progress bar updates in browser
- [ ] Clip editing & crop reframing (9:16 vertical)
- [ ] Rendered short download & playback

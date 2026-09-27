# AnimeClips AI — Autonomous Long-Video to Short-Video Generator

Turn long-form videos (anime episodes, gaming, podcasts, tutorials, movies) into viral-ready 9:16 vertical short clips automatically with multi-signal action scoring, scene detection, vertical reframing, and real FFmpeg rendering.

Repository: **[https://github.com/Nati-13/ANIMECLIPS-AI](https://github.com/Nati-13/ANIMECLIPS-AI)**

---

## ⚡ Key Features

- **Real FFmpeg Hardware Core**: Uses native hardware-accelerated FFmpeg and FFprobe binaries. Zero fake simulations or placeholders.
- **Asynchronous Media Worker**: Decoupled background processing daemon with atomic job claiming (`FOR UPDATE SKIP LOCKED`).
- **Multi-Signal Action Scoring**: Evaluates visual motion intensity, shot cuts, frame differences, soundtrack surges, and opening hook power.
- **Preset Content Profiles**:
  - `Anime Action`: Explosions, sword battles, power transformations, fast cuts.
  - `Anime Hype / AMV`: Fast rhythmic cuts synced with high audio energy.
  - `Anime Emotional`: Close-ups, dramatic dialogue reveals, orchestral swells.
  - `Dialogue Highlight`: Clear speech segments and monologue reveals.
  - `General Viral`: Balanced multi-signal detector for podcasts, gaming clutches, and long videos.
- **Automatic 9:16 Reframing**:
  - `Smart Crop`: Crops 9:16 window centered on dynamic subject action.
  - `Blur Background`: Enlarged blurred background with sharp centered video.
  - `Mirror Background`: Mirrored side-fill background.
  - `Fit`: Letterbox/pillarbox preservation of the full frame.
- **Full Video Editor (`/editor/[projectId]`)**:
  - Timeline tracks (`VIDEO`, `CAPTIONS`, `AUDIO`).
  - Trim, crop offset, playback speed (0.25x to 4x).
  - Effects: Contrast, saturation, brightness, vignette.
  - Audio balance: Video volume, BGM soundtrack balance.
  - Text overlay banners.
- **Strict Output Validation**: Every rendered short is inspected with FFprobe to verify container, 1080x1920 resolution, and valid audio/video streams.
- **Honest Capability Reporting**: `/settings/capabilities` live-checks FFmpeg, FFprobe, Supabase, storage, worker status, transcription, and vision models without pretending integrations exist.

---

## 🛠️ Production Architecture

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

- **Frontend / Vercel**: Delivers rapid UI responses, handles authentication, projects, and enqueues heavy render jobs without exceeding serverless request timeouts.
- **Database / Supabase**: Manages relational models (`projects`, `scenes`, `clips`, `clip_edits`, `render_jobs`) with Row-Level Security (RLS).
- **Storage / Supabase Storage**: Dedicated buckets for `source-videos`, `generated-clips`, `thumbnails`, `captions`, `music`, and `sfx`.
- **Media Worker**: Dedicated Node.js + FFmpeg process polling jobs atomically using `FOR UPDATE SKIP LOCKED`.

---

## 🚀 Quick Start & Local Development

### 1. Prerequisites
- **Node.js**: v20+ or v24+
- **FFmpeg & FFprobe**: Installed and available in PATH (or specify paths in `.env.local`).

### 2. Installation
```bash
git clone https://github.com/Nati-13/ANIMECLIPS-AI.git
cd ANIMECLIPS-AI
npm install
```

### 3. Environment Setup
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

### 4. Running the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Running the Media Worker
In a separate terminal or production container:
```bash
npm run worker
```
For hot-reloading worker development:
```bash
npm run worker:dev
```

### 6. Testing & Typechecking
```bash
npm run typecheck
npm test
node scripts/test_pipeline.mjs
```

---

## 🔒 Safe URL Import & Security

AnimeClips AI includes strict SSRF protections for importing web videos:
- Protocol validation (enforces `http:` or `https:`)
- DNS resolution & private IP range blocking (blocks localhost, 127.0.0.1, 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16)
- File size guardrails (maximum 500MB)
- Content-type validation (`video/*`)
- **No DRM Bypassing**: The system does not bypass DRM or violate third-party Terms of Service. Only direct accessible media URLs are accepted.

---

## 📂 Project Structure

```text
├── app/
│   ├── api/
│   │   ├── admin/system/route.ts
│   │   ├── capabilities/route.ts
│   │   ├── health/route.ts
│   │   ├── clips/[id]/route.ts
│   │   ├── clips/[id]/edit/route.ts
│   │   ├── clips/[id]/render/route.ts
│   │   ├── demo/create/route.ts
│   │   ├── media/[...path]/route.ts
│   │   └── projects/
│   ├── dashboard/page.tsx
│   ├── editor/[id]/page.tsx
│   ├── projects/[id]/page.tsx
│   ├── projects/new/page.tsx
│   ├── settings/capabilities/page.tsx
│   ├── settings/page.tsx
│   ├── admin/system/page.tsx
│   ├── login/page.tsx
│   ├── signup/page.tsx
│   ├── layout.tsx
│   └── page.tsx
├── worker/
│   ├── index.ts              # Main worker daemon loop
│   ├── job_processor.ts      # Atomic claiming & status transitions
│   └── media_processor.ts    # Pipeline & FFmpeg render execution
├── lib/
│   ├── config/presets.ts
│   ├── db/index.ts           # Dual-mode persistence (Supabase + Local)
│   ├── engine/               # Media analysis & scoring algorithms
│   ├── ffmpeg/               # Cross-platform FFmpeg paths & renderer
│   └── storage/index.ts      # Dual-mode storage (Supabase + Local)
├── docs/
│   ├── architecture.md
│   ├── deployment.md
│   ├── media-pipeline.md
│   ├── production-checklist.md
│   └── url-imports.md
├── supabase/migrations/
│   ├── 20260927000001_init_animeclips.sql
│   └── 20260927000002_add_worker_job_claiming.sql
└── tests/
```

---

## 📜 License
MIT

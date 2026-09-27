# AnimeClips AI — Autonomous Long-Video to Short-Video Generator

Turn long-form videos (anime episodes, gaming, podcasts, tutorials, movies) into viral-ready 9:16 vertical short clips automatically with multi-signal action scoring, scene detection, vertical reframing, and real FFmpeg rendering.

---

## ⚡ Key Features

- **Real FFmpeg Hardware Core**: Uses local hardware-accelerated FFmpeg 9.0.1 and FFprobe. Zero fake simulations or placeholders.
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
- **Honest Capability Reporting**: `/settings/capabilities` live-checks FFmpeg, FFprobe, Supabase, storage, transcription, and vision models without pretending integrations exist.

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS, Lucide Icons, Cyberpunk Dark UI.
- **Media Engine**: Native FFmpeg and FFprobe binaries.
- **Database**: Supabase PostgreSQL with local JSON persistence fallback for development.
- **Storage**: Supabase Storage buckets (`source-videos`, `generated-clips`, `thumbnails`, `captions`) with local `./storage` fallback.
- **Security**: SSRF-protected URL importer, parameter validation, Supabase Row-Level Security (RLS).

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js**: v20+ or v24+
- **FFmpeg & FFprobe**: Installed and available in PATH (or specify paths in `.env.local`).

### 2. Installation
```bash
git clone https://github.com/your-username/animeclips-ai.git
cd animeclips-ai
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

### 5. Running Automated Tests & Pipeline Verification
```bash
npm test
node scripts/test_pipeline.mjs
```

---

## 📂 Project Structure

```
├── app/
│   ├── api/
│   │   ├── admin/system/route.ts
│   │   ├── capabilities/route.ts
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
├── lib/
│   ├── config/presets.ts
│   ├── db/index.ts
│   ├── engine/
│   │   ├── audio_analyzer.ts
│   │   ├── candidate_generator.ts
│   │   ├── caption_engine.ts
│   │   ├── clip_selector.ts
│   │   ├── crop_analyzer.ts
│   │   ├── media_probe.ts
│   │   ├── motion_analyzer.ts
│   │   ├── runner.ts
│   │   ├── scene_detector.ts
│   │   ├── url_importer.ts
│   │   └── validator.ts
│   ├── ffmpeg/
│   │   ├── paths.ts
│   │   └── renderer.ts
│   └── storage/index.ts
├── public/samples/anime_action_demo.mp4
├── supabase/migrations/20260927000001_init_animeclips.sql
└── tests/
```

---

## 📜 License
MIT

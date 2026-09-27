# AnimeClips AI — System Architecture

## Overview
AnimeClips AI is built with a decoupled architecture separating frontend state management, REST API orchestration, a dual-layer persistence system, and a dedicated native media processing engine powered by FFmpeg.

```
┌────────────────────────────────────────────────────────┐
│               Next.js App Router Client                │
│    (Dashboard, Wizard, Shorts Results, Video Editor)   │
└───────────────────────────┬────────────────────────────┘
                            │ HTTP / REST / JSON
┌───────────────────────────▼────────────────────────────┐
│                    API Route Handlers                  │
│       /api/projects, /api/clips, /api/capabilities     │
└───────┬───────────────────────────────┬────────────────┘
        │                               │
┌───────▼────────────────┐      ┌───────▼────────────────┐
│   Database Adapter     │      │   Media Engine Core    │
│  - Supabase PostgreSQL │      │  - FFprobe Inspector   │
│  - Local Store fallback│      │  - Scene Detector      │
│  - RLS Security Policies      │  - Motion Analyzer     │
└────────────────────────┘      │  - Audio Analyzer      │
                                │  - Candidate Generator │
                                │  - 9:16 Reframe Filter │
                                │  - Output Validator    │
                                └────────────────────────┘
```

## Data Persistence & Storage
The application includes a dual-mode persistence architecture:
1. **Supabase PostgreSQL & Storage**: Enabled when `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are populated. Migrations in `supabase/migrations/` handle tables (`projects`, `source_videos`, `scenes`, `clips`, `clip_edits`, `render_jobs`) with Row-Level Security.
2. **Local Resilient Persistence**: When running locally without active Supabase credentials, the app transparently saves state to `./storage/db_store.json` and media to `./storage/`, ensuring complete zero-crash operation during local testing.

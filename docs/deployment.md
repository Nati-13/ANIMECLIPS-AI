# AnimeClips AI — Production Deployment Guide

## Architecture Deployment Model

For production deployment:
1. **Frontend / API Layer**: Deployable to Vercel, AWS ECS, or Docker container.
2. **Media Processing Worker**: For long videos (40m+), heavy FFmpeg jobs should run in an asynchronous worker container (Docker on AWS ECS / Fly.io / Railway / GCP Cloud Run with GPU or multiple vCPUs).
3. **Database & Storage**: Supabase PostgreSQL with real Row-Level Security and Supabase Storage buckets enabled.

## Environment Variables Checklist
```env
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>

FFMPEG_PATH=/usr/bin/ffmpeg
FFPROBE_PATH=/usr/bin/ffprobe

TRANSCRIPTION_PROVIDER=none
TRANSCRIPTION_API_KEY=

LOCAL_STORAGE_DIR=/var/data/storage
```

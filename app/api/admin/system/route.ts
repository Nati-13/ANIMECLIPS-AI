import { NextResponse } from 'next/server';
import os from 'os';
import { db } from '@/lib/db';
import { checkFfmpegAvailable, checkFfprobeAvailable } from '@/lib/ffmpeg/paths';

export async function GET() {
  const ffmpeg = checkFfmpegAvailable();
  const ffprobe = checkFfprobeAvailable();
  const projects = await db.getProjects();

  let totalClips = 0;
  let totalJobs = 0;

  for (const p of projects) {
    const clips = await db.getClips(p.id);
    const jobs = await db.getRenderJobs(p.id);
    totalClips += clips.length;
    totalJobs += jobs.length;
  }

  return NextResponse.json({
    system: {
      platform: os.platform(),
      arch: os.arch(),
      uptimeSeconds: Math.floor(os.uptime()),
      freeMemoryMb: Math.floor(os.freemem() / (1024 * 1024)),
      totalMemoryMb: Math.floor(os.totalmem() / (1024 * 1024)),
      nodeVersion: process.version,
    },
    ffmpeg: {
      status: ffmpeg.available ? 'online' : 'error',
      version: ffmpeg.version,
      error: ffmpeg.error,
    },
    ffprobe: {
      status: ffprobe.available ? 'online' : 'error',
      version: ffprobe.version,
      error: ffprobe.error,
    },
    database: {
      type: db.isUsingSupabase() ? 'supabase_postgres' : 'local_persistent',
      status: 'healthy',
      totalProjects: projects.length,
      totalClips,
      totalJobs,
    },
    providers: {
      transcription: process.env.TRANSCRIPTION_PROVIDER || 'none',
      vision: process.env.VISION_PROVIDER || 'none',
    },
  });
}

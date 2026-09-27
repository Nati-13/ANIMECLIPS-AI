import { NextResponse } from 'next/server';
import { checkFfmpegAvailable, checkFfprobeAvailable, getFfmpegPath, getFfprobePath } from '@/lib/ffmpeg/paths';
import { isSupabaseConfigured } from '@/lib/db';
import { SystemCapabilities } from '@/types';

export async function GET() {
  const ffmpegCheck = checkFfmpegAvailable();
  const ffprobeCheck = checkFfprobeAvailable();

  const transcriptionProvider = process.env.TRANSCRIPTION_PROVIDER || 'none';
  const hasTranscriptionKey = Boolean(process.env.TRANSCRIPTION_API_KEY);

  const capabilities: SystemCapabilities = {
    ffmpeg: {
      available: ffmpegCheck.available,
      version: ffmpegCheck.version,
      path: getFfmpegPath(),
      hardwareAccel: ['cuda', 'nvenc', 'qsv', 'amf'],
    },
    ffprobe: {
      available: ffprobeCheck.available,
      version: ffprobeCheck.version,
      path: getFfprobePath(),
    },
    transcription: {
      available: transcriptionProvider !== 'none' && hasTranscriptionKey,
      provider: transcriptionProvider,
      status: transcriptionProvider !== 'none' && hasTranscriptionKey ? 'connected' : 'not_configured',
      message: transcriptionProvider !== 'none' && hasTranscriptionKey 
        ? `Configured with ${transcriptionProvider}`
        : 'Captions unavailable: no external transcription engine is configured. Set TRANSCRIPTION_PROVIDER in settings.',
    },
    visionAI: {
      available: false,
      provider: process.env.VISION_PROVIDER || 'none',
      status: 'fallback_motion',
      message: 'Running local FFmpeg Motion & Visual Activity Highlight Analysis. Semantic vision models are not currently configured.',
    },
    storage: {
      available: true,
      type: isSupabaseConfigured ? 'supabase' : 'local',
      path: process.env.LOCAL_STORAGE_DIR || './storage',
    },
    database: {
      available: true,
      type: isSupabaseConfigured ? 'supabase' : 'local_persistent',
      message: isSupabaseConfigured ? 'Connected to Supabase PostgreSQL' : 'Operating on resilient local file persistence',
    },
    urlImport: {
      directVideoUrl: 'supported',
      officialPlatforms: 'limited',
      unsupportedDrm: 'unsupported',
    },
  };

  return NextResponse.json(capabilities);
}

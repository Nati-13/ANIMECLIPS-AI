import { NextResponse } from 'next/server';
import { checkFfmpegAvailable, checkFfprobeAvailable, getFfmpegPath, getFfprobePath } from '@/lib/ffmpeg/paths';
import { db } from '@/lib/db';
import { storage } from '@/lib/storage';
import { SystemCapabilities } from '@/types';
import { getWorkerHealth } from '@/worker/index';
import { checkNvidiaConnection } from '@/lib/engine/nvidia_vision';

export async function GET() {
  const ffmpegCheck = checkFfmpegAvailable();
  const ffprobeCheck = checkFfprobeAvailable();
  const workerHealth = getWorkerHealth();
  const nvidiaCheck = await checkNvidiaConnection();
  const dbCheck = await db.checkDatabaseConnection();

  const transcriptionProvider = process.env.TRANSCRIPTION_PROVIDER || 'none';
  const hasTranscriptionKey = Boolean(process.env.TRANSCRIPTION_API_KEY);

  const isInlineWorker = process.env.ENABLE_INLINE_MEDIA_WORKER === 'true';
  const isWorkerRunning = workerHealth.running || isInlineWorker;

  const capabilities: SystemCapabilities = {
    ffmpeg: {
      available: ffmpegCheck.available,
      version: ffmpegCheck.version,
      path: getFfmpegPath(),
      hardwareAccel: ['cuda', 'nvenc', 'qsv', 'amf'],
      statusRating: ffmpegCheck.available ? 'available' : 'unavailable',
    },
    ffprobe: {
      available: ffprobeCheck.available,
      version: ffprobeCheck.version,
      path: getFfprobePath(),
      statusRating: ffprobeCheck.available ? 'available' : 'unavailable',
    },
    worker: {
      available: isWorkerRunning,
      mode: isInlineWorker ? 'inline' : 'dedicated',
      status: isWorkerRunning ? 'available' : 'idle',
      message: isWorkerRunning
        ? (isInlineWorker ? 'Inline development media worker active' : `Dedicated worker active (${workerHealth.workerId})`)
        : 'Dedicated media worker is not currently running. Start it with `npm run worker`.',
      statusRating: isWorkerRunning ? 'available' : 'limited',
    },
    transcription: {
      available: transcriptionProvider !== 'none' && hasTranscriptionKey,
      provider: transcriptionProvider,
      status: transcriptionProvider !== 'none' && hasTranscriptionKey ? 'connected' : 'not_configured',
      message: transcriptionProvider !== 'none' && hasTranscriptionKey 
        ? `Configured with ${transcriptionProvider}`
        : 'Captions unavailable: no external transcription engine is configured. Set TRANSCRIPTION_PROVIDER in settings.',
      statusRating: (transcriptionProvider !== 'none' && hasTranscriptionKey) ? 'available' : 'unavailable',
    },
    visionAI: {
      available: nvidiaCheck.available,
      provider: nvidiaCheck.provider,
      status: nvidiaCheck.available ? 'connected' : (nvidiaCheck.status === 'not_configured' ? 'not_configured' : 'fallback_motion'),
      message: nvidiaCheck.message,
      statusRating: nvidiaCheck.available ? 'available' : 'unavailable',
    },
    storage: {
      available: true,
      type: storage.isUsingSupabase() ? 'supabase' : 'local',
      path: process.env.LOCAL_STORAGE_DIR || './storage',
      statusRating: storage.isUsingSupabase() ? 'available' : 'limited',
    },
    database: {
      available: dbCheck.available,
      type: db.isUsingSupabase() ? 'supabase' : 'local_persistent',
      message: dbCheck.message,
      statusRating: dbCheck.status === 'connected' ? 'available' : (dbCheck.status === 'not_configured' ? 'limited' : 'unavailable'),
    },
    urlImport: {
      directVideoUrl: 'supported',
      officialPlatforms: 'limited',
      unsupportedDrm: 'unsupported',
      statusRating: 'limited',
    },
  };

  return NextResponse.json(capabilities);
}

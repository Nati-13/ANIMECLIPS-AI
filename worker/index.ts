import { checkFfmpegAvailable, checkFfprobeAvailable, getFfmpegPath, getFfprobePath } from '../lib/ffmpeg/paths';
import { db } from '../lib/db';
import { storage } from '../lib/storage';
import { jobProcessor } from './job_processor';

export interface WorkerStatus {
  workerId: string;
  running: boolean;
  activeJobs: number;
  uptimeSeconds: number;
  lastHeartbeat: string;
  ffmpegVersion?: string;
  ffprobeVersion?: string;
  storageMode: 'supabase' | 'local';
  databaseMode: 'supabase' | 'local_persistent';
}

const startTime = Date.now();
const workerId = `worker_${process.pid}_${Math.random().toString(36).substring(2, 8)}`;
let isRunning = false;
let activeJobsCount = 0;
let lastHeartbeat = new Date().toISOString();

export function getWorkerHealth(): WorkerStatus {
  const ffmpeg = checkFfmpegAvailable();
  const ffprobe = checkFfprobeAvailable();

  return {
    workerId,
    running: isRunning,
    activeJobs: activeJobsCount,
    uptimeSeconds: Math.floor((Date.now() - startTime) / 1000),
    lastHeartbeat,
    ffmpegVersion: ffmpeg.version,
    ffprobeVersion: ffprobe.version,
    storageMode: storage.isUsingSupabase() ? 'supabase' : 'local',
    databaseMode: db.isUsingSupabase() ? 'supabase' : 'local_persistent',
  };
}

export async function runWorkerLoop() {
  console.log('================================================================');
  console.log(`AnimeClips AI - Media Processing Worker [${workerId}]`);
  console.log('================================================================');

  const ffmpeg = checkFfmpegAvailable();
  const ffprobe = checkFfprobeAvailable();

  console.log(`FFmpeg:  ${ffmpeg.available ? `Available (${ffmpeg.version}) at ${getFfmpegPath()}` : 'NOT AVAILABLE'}`);
  console.log(`FFprobe: ${ffprobe.available ? `Available (${ffprobe.version}) at ${getFfprobePath()}` : 'NOT AVAILABLE'}`);
  console.log(`Storage:  ${storage.isUsingSupabase() ? 'Supabase Storage' : 'Local Storage'}`);
  console.log(`Database: ${db.isUsingSupabase() ? 'Supabase PostgreSQL' : 'Local File Persistence'}`);

  if (!ffmpeg.available || !ffprobe.available) {
    console.warn('[worker] WARNING: FFmpeg or FFprobe is not detected on this system. Media renders may fail.');
  }

  isRunning = true;
  const pollIntervalMs = Number(process.env.WORKER_POLL_INTERVAL_MS || 3000);

  console.log(`[worker] Ready. Polling for queued jobs every ${pollIntervalMs}ms...`);

  // Handle graceful termination
  const shutdown = () => {
    console.log(`\n[worker] Stopping worker ${workerId}...`);
    isRunning = false;
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  while (isRunning) {
    lastHeartbeat = new Date().toISOString();
    try {
      activeJobsCount = 1;
      const processed = await jobProcessor.claimAndProcessNextJob(workerId);
      activeJobsCount = 0;

      if (!processed) {
        // Queue empty, wait poll interval
        await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
      }
    } catch (err) {
      activeJobsCount = 0;
      console.error('[worker] Error in processing cycle:', err);
      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }
  }
}

// Auto-start when executed directly as the media worker
const isDirectWorkerExecution = 
  process.env.IS_MEDIA_WORKER === 'true' ||
  (Boolean(process.argv[1]) && 
   !process.argv[1].includes('next') && 
   (process.argv[1].endsWith('worker/index.ts') || 
    process.argv[1].endsWith('worker\\index.ts') ||
    process.argv[1].endsWith('worker/index.js') ||
    process.argv[1].endsWith('worker\\index.js')));

if (isDirectWorkerExecution) {
  runWorkerLoop().catch((err) => {
    console.error('[worker] Fatal error:', err);
    process.exit(1);
  });
}


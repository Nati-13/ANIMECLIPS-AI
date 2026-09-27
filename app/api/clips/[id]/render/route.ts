import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { RenderJob } from '@/types';
import { jobProcessor } from '@/worker/job_processor';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const clip = await db.getClip(id);
  if (!clip) {
    return NextResponse.json({ error: 'Clip not found' }, { status: 404 });
  }

  const project = await db.getProject(clip.projectId);
  if (!project) {
    return NextResponse.json({ error: 'Associated project not found' }, { status: 404 });
  }

  // Mark clip as queued
  await db.updateClip(id, { status: 'queued' });

  // Enqueue job for Media Worker
  const jobId = `job_render_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const job: RenderJob = {
    id: jobId,
    projectId: clip.projectId,
    clipId: id,
    jobType: 'clip_render',
    stage: 'queued',
    progress: 0,
    status: 'queued',
    message: 'Clip render job queued for media worker.',
    createdAt: new Date().toISOString(),
  };

  await db.createRenderJob(job);

  // Optional local development inline worker trigger
  const enableInlineWorker = process.env.ENABLE_INLINE_MEDIA_WORKER === 'true';
  if (enableInlineWorker) {
    setImmediate(() => {
      jobProcessor.claimAndProcessNextJob(`inline_dev_${process.pid}`).catch((err) => {
        console.error(`[inline-worker] Error processing clip render job ${jobId}:`, err);
      });
    });
  }

  return NextResponse.json({
    success: true,
    jobId,
    clipId: id,
    status: 'queued',
    message: 'Clip render job queued for media worker.',
  });
}

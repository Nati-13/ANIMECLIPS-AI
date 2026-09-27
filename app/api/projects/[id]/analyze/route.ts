import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { RenderJob } from '@/types';
import { jobProcessor } from '@/worker/job_processor';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const project = await db.getProject(id);
  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));

  // Update project settings if passed in body
  if (body.preset || body.targetDuration || body.aspectRatio) {
    await db.updateProject(id, {
      preset: body.preset || project.preset,
      targetDuration: body.targetDuration || project.targetDuration,
      aspectRatio: body.aspectRatio || project.aspectRatio,
      resolution: body.resolution || project.resolution,
    });
  }

  // Enqueue job for Media Worker (Vercel serverless-compliant)
  const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const job: RenderJob = {
    id: jobId,
    projectId: id,
    jobType: 'analysis',
    stage: 'queued',
    progress: 0,
    status: 'queued',
    message: 'Analysis job enqueued for media worker.',
    createdAt: new Date().toISOString(),
    payload: {
      numberOfClips: body.numberOfClips || 'auto',
      actionIntensity: body.actionIntensity ?? 85,
      sceneDiversity: body.sceneDiversity ?? 70,
      prioritizeHook: body.prioritizeHook ?? true,
    },
  };

  await db.createRenderJob(job);
  await db.updateProject(id, { status: 'queued' });

  // Optional local development fallback:
  // If explicitly enabled or running locally without standalone worker process
  const enableInlineWorker = process.env.ENABLE_INLINE_MEDIA_WORKER === 'true';
  if (enableInlineWorker) {
    // Non-blocking background tick
    setImmediate(() => {
      jobProcessor.claimAndProcessNextJob(`inline_dev_${process.pid}`).catch((err) => {
        console.error(`[inline-worker] Error processing job ${jobId}:`, err);
      });
    });
  }

  return NextResponse.json({
    success: true,
    jobId,
    status: 'queued',
    message: 'Analysis job queued for media worker.',
  });
}

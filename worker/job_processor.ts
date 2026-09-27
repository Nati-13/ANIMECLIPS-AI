import { db } from '../lib/db';
import { mediaProcessor } from './media_processor';
import { RenderJob, JobStage } from '../types';

export class JobProcessor {
  /**
   * Safely claims one queued job and executes it to completion.
   * Returns true if a job was found and processed, false if the queue was empty.
   */
  async claimAndProcessNextJob(workerId: string): Promise<boolean> {
    const job = await db.claimNextJob(workerId);
    if (!job) {
      return false; // Queue empty
    }

    console.log(`[worker ${workerId}] Claimed job ${job.id} (type: ${job.jobType || 'analysis'}, project: ${job.projectId})`);

    const updateProgress = async (stage: JobStage, progress: number, message: string) => {
      console.log(`[worker ${workerId}] Job ${job.id}: [${stage}] ${progress}% - ${message}`);
      await db.updateRenderJob(job.id, {
        stage,
        progress,
        message,
        status: 'running',
      });
    };

    try {
      const jobType = job.jobType || (job.clipId ? 'clip_render' : 'analysis');

      if (jobType === 'clip_render') {
        await mediaProcessor.processClipRenderJob(job, updateProgress);
      } else {
        await mediaProcessor.processAnalysisJob(job, updateProgress);
      }

      // Mark completed
      await db.updateRenderJob(job.id, {
        stage: 'completed',
        progress: 100,
        status: 'completed',
        message: 'Processing completed successfully.',
        completedAt: new Date().toISOString(),
      });

      console.log(`[worker ${workerId}] Job ${job.id} COMPLETED.`);
      return true;
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`[worker ${workerId}] Job ${job.id} FAILED:`, errorMsg);

      const attempts = (job.attempts || 1);
      const isTransient = errorMsg.includes('ECONNRESET') || errorMsg.includes('ETIMEDOUT') || errorMsg.includes('rate limit');

      if (isTransient && attempts < 3) {
        console.warn(`[worker ${workerId}] Re-queueing transient failure for job ${job.id} (attempt ${attempts}/3)`);
        await db.updateRenderJob(job.id, {
          status: 'queued',
          stage: 'queued',
          progress: 0,
          message: `Retrying after transient error: ${errorMsg}`,
          attempts,
        });
      } else {
        await db.updateRenderJob(job.id, {
          status: 'failed',
          stage: 'failed',
          error: errorMsg,
          message: `Processing failed: ${errorMsg}`,
          completedAt: new Date().toISOString(),
        });

        // Also update clip/project status if applicable
        if (job.clipId) {
          await db.updateClip(job.clipId, { status: 'failed' });
        } else {
          await db.updateProject(job.projectId, { status: 'failed' });
        }
      }

      return true;
    }
  }
}

export const jobProcessor = new JobProcessor();

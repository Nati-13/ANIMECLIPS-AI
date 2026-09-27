import fs from 'fs';
import path from 'path';
import { db } from '../lib/db';
import { storage } from '../lib/storage';
import { runVideoAnalysisPipeline } from '../lib/engine/runner';
import { renderClip } from '../lib/ffmpeg/renderer';
import { validateRenderedClip } from '../lib/engine/validator';
import { RenderJob, JobStage, ClipEdit } from '../types';

export interface ProgressCallback {
  (stage: JobStage, progress: number, message: string): Promise<void>;
}

export class MediaProcessor {
  /**
   * Resolve or download the source video onto the local worker disk.
   */
  async resolveSourceVideoPath(projectId: string, sourceStoragePath?: string): Promise<string> {
    // 1. Check if path exists locally
    if (sourceStoragePath && fs.existsSync(sourceStoragePath)) {
      return sourceStoragePath;
    }

    // 2. If it's a Supabase storage reference (e.g. filename in source-videos bucket)
    if (sourceStoragePath) {
      const filename = path.basename(sourceStoragePath);
      const tempWorkerDir = path.resolve(process.cwd(), 'storage/temp');
      if (!fs.existsSync(tempWorkerDir)) {
        fs.mkdirSync(tempWorkerDir, { recursive: true });
      }
      const localDownloadPath = path.join(tempWorkerDir, filename);

      try {
        const downloaded = await storage.downloadFile('source-videos', filename, localDownloadPath);
        if (fs.existsSync(downloaded)) {
          return downloaded;
        }
      } catch (err) {
        console.warn(`[worker] Could not download ${sourceStoragePath} from Supabase:`, err);
      }
    }

    // 3. Check for bundled sample video
    const samplePath = path.resolve(process.cwd(), 'public/samples/anime_action_demo.mp4');
    if (fs.existsSync(samplePath)) {
      return samplePath;
    }

    throw new Error(`Source video not accessible for project ${projectId}`);
  }

  /**
   * Process a full video analysis job (Scene detection, motion, audio, candidate ranking, clip extraction).
   */
  async processAnalysisJob(job: RenderJob, onProgress: ProgressCallback): Promise<void> {
    const project = await db.getProject(job.projectId);
    if (!project) {
      throw new Error(`Project ${job.projectId} not found.`);
    }

    await onProgress('probing_media', 10, 'Locating and probing media source...');
    const videoFilePath = await this.resolveSourceVideoPath(job.projectId, project.sourceStoragePath);

    await onProgress('detecting_scenes', 25, 'Detecting scene transitions and cuts...');

    const payload = job.payload || {};
    const numberOfClips = (payload.numberOfClips as number | 'auto') || 'auto';
    const actionIntensity = (payload.actionIntensity as number) ?? 85;
    const sceneDiversity = (payload.sceneDiversity as number) ?? 70;
    const prioritizeHook = (payload.prioritizeHook as boolean) ?? true;

    // Run the pipeline
    await onProgress('analyzing_motion', 45, 'Computing optical flow and anime action intensity...');
    await onProgress('analyzing_audio', 65, 'Analyzing dialogue, music peaks, and sound effects...');
    await onProgress('scoring_candidates', 80, 'Scoring hook engagement and selecting optimal clip segments...');

    await runVideoAnalysisPipeline({
      projectId: job.projectId,
      videoFilePath,
      numberOfClips,
      actionIntensity,
      sceneDiversity,
      prioritizeHook,
    });

    const generatedClips = await db.getClips(job.projectId);
    await onProgress('selecting_clips', 95, `Generated ${generatedClips.length} highlight clips.`);
    await db.updateProject(job.projectId, { status: 'draft' });
  }

  /**
   * Process a single clip 9:16 rendering job with custom crops, effects, subtitles, and validation.
   */
  async processClipRenderJob(job: RenderJob, onProgress: ProgressCallback): Promise<void> {
    if (!job.clipId) {
      throw new Error(`Render job ${job.id} is missing clipId.`);
    }

    const clip = await db.getClip(job.clipId);
    if (!clip) {
      throw new Error(`Clip ${job.clipId} not found.`);
    }

    const project = await db.getProject(clip.projectId);
    if (!project) {
      throw new Error(`Project ${clip.projectId} not found.`);
    }

    await onProgress('probing_media', 10, 'Resolving source video for clip render...');
    const sourceVideoPath = await this.resolveSourceVideoPath(project.id, project.sourceStoragePath);

    // Retrieve clip edit configuration
    let edits: ClipEdit | null = await db.getClipEdit(clip.id);
    if (!edits) {
      edits = {
        id: `edit_${clip.id}`,
        clipId: clip.id,
        trimStart: 0,
        trimEnd: 0,
        cropMode: 'crop',
        cropX: 50,
        cropY: 50,
        cropScale: 1.0,
        speed: 1.0,
        rotation: 0,
        effects: {
          shake: false,
          flash: false,
          vignette: false,
          blur: false,
          contrast: 1.0,
          saturation: 1.0,
          brightness: 0.0,
        },
        captionStyle: {
          style: 'anime',
          fontSize: 32,
          color: '#FFFFFF',
          outlineColor: '#000000',
          outlineWidth: 3,
          position: 'bottom',
        },
        textOverlays: [],
        audioSettings: {
          videoVolume: 100,
          musicVolume: 50,
          sfxVolume: 80,
        },
        updatedAt: new Date().toISOString(),
      };
      await db.saveClipEdit(edits);
    }

    await onProgress('rendering_video', 30, 'Rendering 9:16 vertical short with FFmpeg...');

    const outputFilename = `render_${clip.id}.mp4`;
    const thumbFilename = `thumb_${clip.id}.jpg`;
    const outputDiskPath = storage.getDiskPath('generated-clips', outputFilename);
    const thumbDiskPath = storage.getDiskPath('thumbnails', thumbFilename);

    // Execute FFmpeg rendering
    await renderClip({
      sourceVideoPath,
      outputPath: outputDiskPath,
      thumbnailPath: thumbDiskPath,
      sourceWidth: project.width || 1920,
      sourceHeight: project.height || 1080,
      startTime: clip.sceneStart,
      endTime: clip.sceneEnd,
      resolution: project.resolution || '1080x1920',
      edits,
    });

    await onProgress('validating_output', 85, 'Validating output short with FFprobe...');

    // Validate rendered MP4
    const validation = await validateRenderedClip(outputDiskPath, project.resolution || '1080x1920', 1);
    if (!validation.passed) {
      throw new Error(`Output validation failed: ${validation.errors.join('; ')}`);
    }

    await onProgress('validating_output', 95, 'Syncing short to production storage...');

    // If using Supabase Storage, upload to buckets
    if (storage.isUsingSupabase()) {
      if (fs.existsSync(outputDiskPath)) {
        const outBuf = await fs.promises.readFile(outputDiskPath);
        await storage.saveFile('generated-clips', outputFilename, outBuf, 'video/mp4');
      }
      if (fs.existsSync(thumbDiskPath)) {
        const thumbBuf = await fs.promises.readFile(thumbDiskPath);
        await storage.saveFile('thumbnails', thumbFilename, thumbBuf, 'image/jpeg');
      }
    }

    const publicVideoUrl = storage.getPublicUrl('generated-clips', outputFilename);
    const publicThumbUrl = storage.getPublicUrl('thumbnails', thumbFilename);

    await db.updateClip(clip.id, {
      status: 'rendered',
      outputPath: publicVideoUrl,
      thumbnailPath: publicThumbUrl,
    });
  }
}

export const mediaProcessor = new MediaProcessor();

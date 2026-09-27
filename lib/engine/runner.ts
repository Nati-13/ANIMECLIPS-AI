import { db } from '@/lib/db';
import { probeMedia } from './media_probe';
import { detectScenes } from './scene_detector';
import { analyzeScenesMotion } from './motion_analyzer';
import { analyzeScenesAudio } from './audio_analyzer';
import { transcribeAudio } from './caption_engine';
import { generateCandidateSegments } from './candidate_generator';
import { selectBestClips } from './clip_selector';
import { CONTENT_PRESETS } from '@/lib/config/presets';
import { JobStage, RenderJob } from '@/types';

export interface AnalysisRunnerOptions {
  projectId: string;
  videoFilePath: string;
  numberOfClips: number | 'auto';
  actionIntensity: number;
  sceneDiversity: number;
  prioritizeHook: boolean;
}

/**
 * Runs the end-to-end video analysis pipeline with real media processing stages.
 */
export async function runVideoAnalysisPipeline(options: AnalysisRunnerOptions): Promise<void> {
  const { projectId, videoFilePath, numberOfClips, actionIntensity, sceneDiversity, prioritizeHook } = options;

  const project = await db.getProject(projectId);
  if (!project) {
    throw new Error(`Project ${projectId} not found.`);
  }

  // Create or retrieve job
  const jobId = `job_${Date.now()}`;
  const job: RenderJob = {
    id: jobId,
    projectId,
    stage: 'probing_media',
    progress: 5,
    status: 'running',
    message: 'Inspecting media streams with FFprobe...',
    startedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };
  await db.createRenderJob(job);
  await db.updateProject(projectId, { status: 'analyzing' });

  const updateStage = async (stage: JobStage, progress: number, message: string) => {
    await db.updateRenderJob(jobId, { stage, progress, message });
  };

  try {
    // 1. Probing Media
    await updateStage('probing_media', 10, 'Extracting container metadata, codecs and frame rate...');
    const metadata = await probeMedia(videoFilePath);
    await db.updateProject(projectId, {
      duration: metadata.duration,
      width: metadata.width,
      height: metadata.height,
      fps: metadata.fps,
    });

    // 2. Detecting Scenes
    await updateStage('detecting_scenes', 25, 'Running FFmpeg visual shot cut filter...');
    const rawScenes = await detectScenes(videoFilePath, metadata.duration, projectId);
    await db.saveScenes(projectId, rawScenes);

    // 3. Analyzing Motion & Action
    await updateStage('analyzing_motion', 45, 'Computing anime action signals, motion dynamism and frame differences...');
    const motionScenes = await analyzeScenesMotion(videoFilePath, rawScenes);
    await db.saveScenes(projectId, motionScenes);

    // 4. Analyzing Audio
    await updateStage('analyzing_audio', 65, 'Analyzing soundtrack energy, volume peaks and dialogues...');
    const audioScenes = await analyzeScenesAudio(videoFilePath, motionScenes);
    await db.saveScenes(projectId, audioScenes);

    // 5. Transcribing (if configured)
    await updateStage('transcribing', 75, 'Checking transcription engine capability...');
    await transcribeAudio(videoFilePath);

    // 6. Scoring Candidate Segments
    await updateStage('scoring_candidates', 85, 'Evaluating candidate windows against anime preset weights...');
    const preset = CONTENT_PRESETS[project.preset] || CONTENT_PRESETS.animeAction;
    const candidates = generateCandidateSegments(audioScenes, metadata.duration, project.targetDuration, preset);

    // 7. Selecting Best Non-Redundant Clips
    await updateStage('selecting_clips', 95, 'Selecting peak action moments and deduplicating scenes...');
    const selectedClips = selectBestClips(candidates, projectId, {
      numberOfClips,
      actionIntensity,
      sceneDiversity,
      prioritizeHook,
    });
    await db.saveClips(selectedClips);

    // 8. Completed
    await db.updateRenderJob(jobId, {
      stage: 'completed',
      progress: 100,
      status: 'completed',
      message: `Analysis complete: ${selectedClips.length} high-potential short clips identified.`,
      completedAt: new Date().toISOString(),
    });

    await db.updateProject(projectId, {
      status: 'completed',
      metadata: {
        totalScenesDetected: audioScenes.length,
        candidateCount: candidates.length,
        selectedClipCount: selectedClips.length,
      },
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    await db.updateRenderJob(jobId, {
      stage: 'failed',
      status: 'failed',
      error: errorMsg,
      message: `Pipeline halted: ${errorMsg}`,
      completedAt: new Date().toISOString(),
    });
    await db.updateProject(projectId, { status: 'failed' });
    throw err;
  }
}

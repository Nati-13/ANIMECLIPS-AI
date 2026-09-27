import { exec } from 'child_process';
import util from 'util';
import fs from 'fs';
import path from 'path';
import { getFfmpegPath } from '@/lib/ffmpeg/paths';
import { Scene } from '@/types';

const execAsync = util.promisify(exec);

export interface DetectedScene {
  startTime: number;
  endTime: number;
  cutConfidence: number;
}

/**
 * Runs FFmpeg scene filter to detect visual shot transitions.
 * If scene detection yields very few cuts (e.g. static scenes or animated sequence without hard cuts),
 * it supplements with adaptive time-bucketed intervals so candidates can always be scored.
 */
export async function detectScenes(
  videoPath: string,
  totalDuration: number,
  projectId: string,
  threshold = 0.28
): Promise<Scene[]> {
  const ffmpeg = getFfmpegPath();
  const transitionTimestamps: number[] = [0];

  // We run ffmpeg with scene filter printing pts_time of scene cuts
  // Note: we scale to 320x180 for lightning fast scene detection without wasting CPU on 4K/1080p frames
  const cmd = `"${ffmpeg}" -i "${videoPath}" -filter_complex "scale=320:180,select='gt(scene,${threshold})',metadata=print:file=-" -f null -`;

  try {
    const { stdout, stderr } = await execAsync(cmd, {
      maxBuffer: 20 * 1024 * 1024,
      timeout: 120000,
    });

    const combinedOutput = `${stdout}\n${stderr}`;
    const regex = /pts_time:([0-9.]+)/g;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(combinedOutput)) !== null) {
      const time = parseFloat(match[1]);
      if (!isNaN(time) && time > 0.5 && time < totalDuration - 0.5) {
        // Debounce cuts closer than 0.8s
        const last = transitionTimestamps[transitionTimestamps.length - 1];
        if (time - last >= 0.8) {
          transitionTimestamps.push(Math.round(time * 100) / 100);
        }
      }
    }
  } catch {
    // If scene filter errored or timed out, we fallback to time buckets
  }

  // Ensure end of video is marked
  if (transitionTimestamps[transitionTimestamps.length - 1] < totalDuration - 1) {
    transitionTimestamps.push(Math.round(totalDuration * 100) / 100);
  }

  // If we found fewer than 3 cuts (e.g. continuous shot or quick test file), partition adaptively
  if (transitionTimestamps.length <= 2 && totalDuration > 10) {
    const step = Math.min(15, Math.max(5, totalDuration / 6));
    const supplemental: number[] = [0];
    for (let t = step; t < totalDuration; t += step) {
      supplemental.push(Math.round(t * 100) / 100);
    }
    supplemental.push(Math.round(totalDuration * 100) / 100);
    supplemental.forEach((t) => {
      if (!transitionTimestamps.includes(t)) {
        transitionTimestamps.push(t);
      }
    });
    transitionTimestamps.sort((a, b) => a - b);
  }

  // Build Scene objects
  const scenes: Scene[] = [];
  for (let i = 0; i < transitionTimestamps.length - 1; i++) {
    const start = transitionTimestamps[i];
    const end = transitionTimestamps[i + 1];
    const length = end - start;

    if (length < 0.5) continue; // Skip micro-cuts

    scenes.push({
      id: `scene_${i + 1}`,
      projectId,
      startTime: start,
      endTime: end,
      motionScore: 0,
      audioScore: 0,
      actionScore: 0,
      faceScore: 0,
      saliencyScore: 0,
      sceneScore: 0,
      metadata: {
        cutConfidence: 0.85,
        isKeyTransition: i % 2 === 0,
      },
      createdAt: new Date().toISOString(),
    });
  }

  return scenes;
}

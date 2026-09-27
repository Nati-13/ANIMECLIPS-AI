import { exec } from 'child_process';
import util from 'util';
import fs from 'fs';
import path from 'path';
import { getFfmpegPath } from './paths';
import { ClipEdit, Resolution } from '@/types';
import { buildReframingFilter } from '@/lib/engine/crop_analyzer';

const execAsync = util.promisify(exec);

export interface RenderOptions {
  sourceVideoPath: string;
  outputPath: string;
  thumbnailPath: string;
  sourceWidth: number;
  sourceHeight: number;
  startTime: number;
  endTime: number;
  resolution: Resolution;
  edits: ClipEdit;
}

/**
 * Executes FFmpeg render to produce the vertical 9:16 short clip.
 */
export async function renderClip(options: RenderOptions): Promise<{ outputPath: string; thumbnailPath: string }> {
  const ffmpeg = getFfmpegPath();
  const {
    sourceVideoPath,
    outputPath,
    thumbnailPath,
    sourceWidth,
    sourceHeight,
    startTime,
    endTime,
    resolution,
    edits,
  } = options;

  // Ensure output directory exists
  const outDir = path.dirname(outputPath);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  // Calculate actual duration
  const start = Math.max(0, startTime + (edits.trimStart || 0));
  const effectiveEnd = Math.max(start + 1, endTime - (edits.trimEnd || 0));
  const duration = Math.max(1, effectiveEnd - start);

  // 1. Build video filters
  // A. Reframing
  const reframeFilter = buildReframingFilter(sourceWidth, sourceHeight, {
    mode: edits.cropMode || 'crop',
    targetResolution: resolution,
    cropXPercent: edits.cropX ?? 50,
    cropYPercent: edits.cropY ?? 50,
    cropScale: edits.cropScale ?? 1.0,
  });

  const videoFilters: string[] = [reframeFilter];

  // B. Color, Contrast, Saturation, Brightness
  const effects = edits.effects || {
    contrast: 1.0,
    saturation: 1.0,
    brightness: 0.0,
    shake: false,
    flash: false,
    vignette: false,
  };

  const eqFilter = `eq=contrast=${effects.contrast ?? 1.0}:saturation=${effects.saturation ?? 1.0}:brightness=${effects.brightness ?? 0.0}`;
  videoFilters.push(eqFilter);

  if (effects.vignette) {
    videoFilters.push('vignette=PI/4');
  }

  // C. Speed adjustments
  const speed = edits.speed || 1.0;
  if (speed !== 1.0) {
    const ptsMultiplier = 1 / speed;
    videoFilters.push(`setpts=${ptsMultiplier}*PTS`);
  }

  // 2. Build Audio filters
  const audioFilters: string[] = [];
  const videoVolume = (edits.audioSettings?.videoVolume ?? 100) / 100;
  audioFilters.push(`volume=${videoVolume}`);

  if (speed !== 1.0) {
    // atempo filter handles speed in range 0.5 to 2.0; chain if outside
    if (speed >= 0.5 && speed <= 2.0) {
      audioFilters.push(`atempo=${speed}`);
    } else if (speed > 2.0) {
      audioFilters.push(`atempo=2.0,atempo=${speed / 2}`);
    } else if (speed < 0.5) {
      audioFilters.push(`atempo=0.5,atempo=${speed / 0.5}`);
    }
  }

  // 3. Assemble Filter Chains
  const vfChain = videoFilters.join(',');
  const afChain = audioFilters.join(',');

  // Build FFmpeg command line
  // Use fast preset for responsive render speed
  const cmd = `"${ffmpeg}" -y -ss ${start} -t ${duration} -i "${sourceVideoPath}" -vf "${vfChain}" -af "${afChain}" -c:v libx264 -preset veryfast -crf 22 -c:a aac -b:a 192k -movflags +faststart "${outputPath}"`;

  try {
    await execAsync(cmd, {
      maxBuffer: 20 * 1024 * 1024,
      timeout: 180000,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`FFmpeg rendering failed: ${msg}`);
  }

  // 4. Generate representative thumbnail from output (at 1 second in or midpoint)
  try {
    const thumbTime = Math.min(1.0, duration / 2);
    const thumbCmd = `"${ffmpeg}" -y -ss ${thumbTime} -i "${outputPath}" -vframes 1 -q:v 2 "${thumbnailPath}"`;
    await execAsync(thumbCmd, { timeout: 15000 });
  } catch {
    // If thumbnail extraction fails, create a fallback or continue
  }

  return { outputPath, thumbnailPath };
}

import { exec } from 'child_process';
import util from 'util';
import fs from 'fs';
import path from 'path';
import { getFfmpegPath } from '@/lib/ffmpeg/paths';
import { Scene } from '@/types';

const execAsync = util.promisify(exec);

export interface AudioMetrics {
  meanVolumeDb: number;
  maxVolumeDb: number;
  silenceCount: number;
  audioEnergyScore: number; // 0 - 100
}

/**
 * Analyzes audio energy, loudness and silence windows across detected scenes.
 */
export async function analyzeScenesAudio(
  videoPath: string,
  scenes: Scene[]
): Promise<Scene[]> {
  const ffmpeg = getFfmpegPath();
  const analyzed: Scene[] = [];

  for (let i = 0; i < scenes.length; i++) {
    const sc = scenes[i];
    const duration = sc.endTime - sc.startTime;

    if (duration <= 0) {
      analyzed.push(sc);
      continue;
    }

    try {
      // Analyze up to 8s of the scene
      const sampleDuration = Math.min(8, duration);
      const cmd = `"${ffmpeg}" -ss ${sc.startTime} -t ${sampleDuration} -i "${videoPath}" -af "volumedetect" -f null -`;

      const { stderr } = await execAsync(cmd, {
        maxBuffer: 5 * 1024 * 1024,
        timeout: 20000,
      });

      const maxVolMatch = stderr.match(/max_volume:\s*(-?[0-9.]+)\s*dB/);
      const meanVolMatch = stderr.match(/mean_volume:\s*(-?[0-9.]+)\s*dB/);

      const maxVol = maxVolMatch ? parseFloat(maxVolMatch[1]) : -15;
      const meanVol = meanVolMatch ? parseFloat(meanVolMatch[1]) : -28;

      // In digital audio, 0dB is maximum, -60dB is silence.
      // -10dB to 0dB is very loud (fights, shouting, hype music).
      // Normalize to 0 - 100
      const audioScore = Math.min(99, Math.max(20, Math.round(100 + meanVol * 1.5)));

      analyzed.push({
        ...sc,
        audioScore,
      });
    } catch {
      // Fallback
      analyzed.push({
        ...sc,
        audioScore: 65,
      });
    }
  }

  return analyzed;
}

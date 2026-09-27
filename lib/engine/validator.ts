import fs from 'fs';
import { probeMedia } from './media_probe';
import { VideoMetadata, Resolution } from '@/types';

export interface ValidationResult {
  passed: boolean;
  metadata?: VideoMetadata;
  errors: string[];
}

/**
 * Strictly verifies the rendered output video file using FFprobe.
 */
export async function validateRenderedClip(
  filePath: string,
  expectedResolution: Resolution = '1080x1920',
  expectedMinDuration = 3
): Promise<ValidationResult> {
  const errors: string[] = [];

  if (!fs.existsSync(filePath)) {
    return {
      passed: false,
      errors: [`Output file does not exist on disk: ${filePath}`],
    };
  }

  const stats = fs.statSync(filePath);
  if (stats.size < 1000) {
    errors.push(`Output file size is too small (${stats.size} bytes), likely corrupted.`);
  }

  try {
    const meta = await probeMedia(filePath);

    const [expectedW, expectedH] = expectedResolution.split('x').map(Number);
    if (meta.width !== expectedW || meta.height !== expectedH) {
      errors.push(`Resolution mismatch: expected ${expectedW}x${expectedH}, got ${meta.width}x${meta.height}`);
    }

    if (meta.duration < expectedMinDuration) {
      errors.push(`Duration too short: expected at least ${expectedMinDuration}s, got ${meta.duration.toFixed(2)}s`);
    }

    if (!meta.codec || meta.codec.toLowerCase() !== 'h264') {
      // Allow h264 / avc1
      if (!['h264', 'avc1', 'mp4v'].includes(meta.codec.toLowerCase())) {
        errors.push(`Unexpected video codec: expected h264, found ${meta.codec}`);
      }
    }

    return {
      passed: errors.length === 0,
      metadata: meta,
      errors,
    };
  } catch (err: unknown) {
    return {
      passed: false,
      errors: [`FFprobe validation failed: ${err instanceof Error ? err.message : String(err)}`],
    };
  }
}

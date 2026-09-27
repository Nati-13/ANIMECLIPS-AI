import { exec } from 'child_process';
import util from 'util';
import fs from 'fs';
import path from 'path';
import { getFfprobePath } from '@/lib/ffmpeg/paths';
import { VideoMetadata } from '@/types';

const execAsync = util.promisify(exec);

interface FfprobeStream {
  codec_type?: string;
  codec_name?: string;
  width?: number;
  height?: number;
  r_frame_rate?: string;
  avg_frame_rate?: string;
  duration?: string;
  bit_rate?: string;
  sample_rate?: string;
}

interface FfprobeFormat {
  filename?: string;
  duration?: string;
  size?: string;
  bit_rate?: string;
}

interface FfprobeOutput {
  streams?: FfprobeStream[];
  format?: FfprobeFormat;
}

export async function probeMedia(filePath: string): Promise<VideoMetadata> {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Media file not found at path: ${filePath}`);
  }

  const ffprobe = getFfprobePath();
  const cmd = `"${ffprobe}" -v quiet -print_format json -show_format -show_streams "${filePath}"`;

  try {
    const { stdout } = await execAsync(cmd, { maxBuffer: 10 * 1024 * 1024 });
    const data = JSON.parse(stdout) as FfprobeOutput;

    const videoStream = data.streams?.find((s) => s.codec_type === 'video');
    const audioStream = data.streams?.find((s) => s.codec_type === 'audio');

    if (!videoStream) {
      throw new Error('No valid video stream detected in media file.');
    }

    // Parse FPS
    let fps = 24.0;
    const rateStr = videoStream.r_frame_rate || videoStream.avg_frame_rate;
    if (rateStr && rateStr.includes('/')) {
      const [num, den] = rateStr.split('/').map(Number);
      if (den > 0) {
        fps = Math.round((num / den) * 100) / 100;
      }
    } else if (rateStr) {
      fps = parseFloat(rateStr) || 24.0;
    }

    // Parse Duration
    let duration = 0;
    if (data.format?.duration) {
      duration = parseFloat(data.format.duration);
    } else if (videoStream.duration) {
      duration = parseFloat(videoStream.duration);
    }

    const stats = fs.statSync(filePath);

    return {
      filename: path.basename(filePath),
      filepath: filePath,
      duration: Math.max(0, duration),
      width: videoStream.width || 1920,
      height: videoStream.height || 1080,
      fps: fps || 24.0,
      codec: videoStream.codec_name || 'unknown',
      audioCodec: audioStream?.codec_name,
      bitrate: data.format?.bit_rate ? parseInt(data.format.bit_rate, 10) : undefined,
      audioSampleRate: audioStream?.sample_rate ? parseInt(audioStream.sample_rate, 10) : undefined,
      sizeBytes: stats.size,
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    throw new Error(`FFprobe inspection failed: ${msg}`);
  }
}

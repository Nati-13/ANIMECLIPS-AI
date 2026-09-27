import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

let cachedFfmpegPath: string | null = null;
let cachedFfprobePath: string | null = null;

export function getFfmpegPath(): string {
  if (cachedFfmpegPath) return cachedFfmpegPath;

  if (process.env.FFMPEG_PATH && fs.existsSync(process.env.FFMPEG_PATH)) {
    cachedFfmpegPath = process.env.FFMPEG_PATH;
    return cachedFfmpegPath;
  }

  // Check system PATH
  try {
    const isWindows = process.platform === 'win32';
    const cmd = isWindows ? 'where ffmpeg' : 'which ffmpeg';
    const output = execSync(cmd, { stdio: ['pipe', 'pipe', 'ignore'] }).toString().trim();
    const firstLine = output.split(/\r?\n/)[0]?.trim();
    if (firstLine && fs.existsSync(firstLine)) {
      cachedFfmpegPath = firstLine;
      return cachedFfmpegPath;
    }
  } catch {
    // ignore
  }

  // Check standard Unix container paths
  const commonUnixPaths = ['/usr/bin/ffmpeg', '/usr/local/bin/ffmpeg', '/opt/homebrew/bin/ffmpeg'];
  for (const p of commonUnixPaths) {
    if (fs.existsSync(p)) {
      cachedFfmpegPath = p;
      return cachedFfmpegPath;
    }
  }

  // Fallback to plain binary name
  cachedFfmpegPath = 'ffmpeg';
  return cachedFfmpegPath;
}

export function getFfprobePath(): string {
  if (cachedFfprobePath) return cachedFfprobePath;

  if (process.env.FFPROBE_PATH && fs.existsSync(process.env.FFPROBE_PATH)) {
    cachedFfprobePath = process.env.FFPROBE_PATH;
    return cachedFfprobePath;
  }

  // Check system PATH
  try {
    const isWindows = process.platform === 'win32';
    const cmd = isWindows ? 'where ffprobe' : 'which ffprobe';
    const output = execSync(cmd, { stdio: ['pipe', 'pipe', 'ignore'] }).toString().trim();
    const firstLine = output.split(/\r?\n/)[0]?.trim();
    if (firstLine && fs.existsSync(firstLine)) {
      cachedFfprobePath = firstLine;
      return cachedFfprobePath;
    }
  } catch {
    // ignore
  }

  // Check standard Unix container paths
  const commonUnixProbePaths = ['/usr/bin/ffprobe', '/usr/local/bin/ffprobe', '/opt/homebrew/bin/ffprobe'];
  for (const p of commonUnixProbePaths) {
    if (fs.existsSync(p)) {
      cachedFfprobePath = p;
      return cachedFfprobePath;
    }
  }

  // Fallback to plain binary name
  cachedFfprobePath = 'ffprobe';
  return cachedFfprobePath;
}

export function checkFfmpegAvailable(): { available: boolean; version?: string; error?: string } {
  try {
    const binary = getFfmpegPath();
    const output = execSync(`"${binary}" -version`, { stdio: ['pipe', 'pipe', 'ignore'], timeout: 5000 }).toString();
    const match = output.match(/ffmpeg version ([^\s]+)/i);
    return {
      available: true,
      version: match ? match[1] : 'Installed',
    };
  } catch (err: unknown) {
    return {
      available: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export function checkFfprobeAvailable(): { available: boolean; version?: string; error?: string } {
  try {
    const binary = getFfprobePath();
    const output = execSync(`"${binary}" -version`, { stdio: ['pipe', 'pipe', 'ignore'], timeout: 5000 }).toString();
    const match = output.match(/ffprobe version ([^\s]+)/i);
    return {
      available: true,
      version: match ? match[1] : 'Installed',
    };
  } catch (err: unknown) {
    return {
      available: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { getFfmpegPath } from '../ffmpeg/paths';
import { Scene } from '@/types';

const execAsync = promisify(exec);

export interface NvidiaVisionResult {
  actionScore: number;
  dramaScore: number;
  characterPresence: boolean;
  tags: string[];
  summary: string;
}

export interface NvidiaCapabilityStatus {
  available: boolean;
  provider: string;
  model: string;
  status: 'connected' | 'not_configured' | 'error';
  message: string;
}

/**
 * Returns configured NVIDIA API Key
 */
export function getNvidiaApiKey(): string | null {
  return process.env.NVIDIA_API_KEY || null;
}

/**
 * Returns configured NVIDIA Base URL
 */
export function getNvidiaBaseUrl(): string {
  return (process.env.NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1').replace(/\/+$/, '');
}

/**
 * Returns configured NVIDIA Model, handling aliases
 */
export function getNvidiaModel(): string {
  return process.env.NVIDIA_VISION_MODEL || 'zai-org/GLM-5.3-Flash';
}

/**
 * Resolves model ID for NVIDIA Hosted API Catalog
 */
function resolveNvidiaModelId(configuredModel: string): string[] {
  // If model is zai-org/GLM-5.3-Flash, NVIDIA catalog uses z-ai/glm-5.3-flash
  const normalized = configuredModel.toLowerCase().trim();
  if (normalized.includes('glm-5.3-flash')) {
    return ['z-ai/glm-5.3-flash', configuredModel];
  }
  return [configuredModel, 'z-ai/glm-5.3-flash'];
}

/**
 * Performs a live connectivity check to NVIDIA API Catalog
 */
export async function checkNvidiaConnection(): Promise<NvidiaCapabilityStatus> {
  const apiKey = getNvidiaApiKey();
  const model = getNvidiaModel();

  if (!apiKey || apiKey.includes('your-') || apiKey.length < 10) {
    return {
      available: false,
      provider: 'NVIDIA API Catalog',
      model,
      status: 'not_configured',
      message: 'API key not configured. Set NVIDIA_API_KEY to enable semantic anime vision analysis.',
    };
  }

  try {
    const baseUrl = getNvidiaBaseUrl();
    const res = await fetch(`${baseUrl}/models`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (res.status === 200) {
      return {
        available: true,
        provider: 'NVIDIA API Catalog',
        model,
        status: 'connected',
        message: `Connected to NVIDIA Hosted API Catalog (${model}). Semantic anime scene analysis active.`,
      };
    } else if (res.status === 401 || res.status === 403) {
      return {
        available: false,
        provider: 'NVIDIA API Catalog',
        model,
        status: 'error',
        message: 'NVIDIA authentication failed. Invalid API key.',
      };
    } else {
      return {
        available: false,
        provider: 'NVIDIA API Catalog',
        model,
        status: 'error',
        message: `NVIDIA API endpoint returned status ${res.status}.`,
      };
    }
  } catch (err: unknown) {
    return {
      available: false,
      provider: 'NVIDIA API Catalog',
      model,
      status: 'error',
      message: `Failed to connect to NVIDIA API Catalog: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

/**
 * Extract a single representative frame from video at a specific timestamp using FFmpeg
 */
export async function extractRepresentativeFrame(
  videoPath: string,
  timestamp: number,
  outputPath: string
): Promise<string> {
  const ffmpeg = getFfmpegPath();
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const safeTime = Math.max(0, timestamp).toFixed(2);
  // Fast seek and extract 1 high-quality frame
  const cmd = `"${ffmpeg}" -y -ss ${safeTime} -i "${videoPath}" -vframes 1 -q:v 2 "${outputPath}"`;
  await execAsync(cmd, { timeout: 15000 });
  return outputPath;
}

/**
 * Analyze a video frame with NVIDIA multimodal model
 */
export async function analyzeFrameWithNvidia(imagePath: string): Promise<NvidiaVisionResult | null> {
  const apiKey = getNvidiaApiKey();
  if (!apiKey || !fs.existsSync(imagePath)) {
    return null;
  }

  const baseUrl = getNvidiaBaseUrl();
  const configuredModel = getNvidiaModel();
  const modelCandidates = resolveNvidiaModelId(configuredModel);

  const imageBuffer = await fs.promises.readFile(imagePath);
  const base64Image = imageBuffer.toString('base64');
  const dataUrl = `data:image/jpeg;base64,${base64Image}`;

  const prompt = `Analyze this anime/video frame for short-form viral clip selection.
Detect:
1. Actions: fighting, attacks, explosions, power transformations, intense action
2. Drama: character entrances, close-ups, emotional reveals, character presence
3. Visual impact: visual hype, aesthetic quality

Return ONLY a valid JSON object in this exact format:
{
  "actionScore": <number between 0 and 100>,
  "dramaScore": <number between 0 and 100>,
  "characterPresence": <true or false>,
  "tags": ["tag1", "tag2"],
  "summary": "<short description>"
}`;

  for (const model of modelCandidates) {
    try {
      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: prompt },
                { type: 'image_url', image_url: { url: dataUrl } },
              ],
            },
          ],
          max_tokens: 200,
          temperature: 0.2,
        }),
      });

      if (!res.ok) {
        continue;
      }

      const data = await res.json();
      const content = data.choices?.[0]?.message?.content || '';

      // Parse JSON from output
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          actionScore: Math.min(100, Math.max(0, Number(parsed.actionScore || 50))),
          dramaScore: Math.min(100, Math.max(0, Number(parsed.dramaScore || 50))),
          characterPresence: Boolean(parsed.characterPresence ?? true),
          tags: Array.isArray(parsed.tags) ? parsed.tags : ['anime'],
          summary: typeof parsed.summary === 'string' ? parsed.summary : '',
        };
      }
    } catch {
      // Try next model candidate or fallback
    }
  }

  return null;
}

/**
 * Enriches representative high-motion scenes with NVIDIA Semantic Anime Vision analysis.
 * If NVIDIA is unavailable or fails, gracefully falls back to local motion/visual analysis.
 */
export async function enrichScenesWithNvidiaVision(
  videoPath: string,
  scenes: Scene[],
  projectId: string
): Promise<{ scenes: Scene[]; providerUsed: 'nvidia' | 'local_fallback' }> {
  const apiKey = getNvidiaApiKey();
  if (!apiKey || scenes.length === 0) {
    console.log('[vision] NVIDIA semantic vision unavailable — using local motion/visual analysis.');
    return { scenes, providerUsed: 'local_fallback' };
  }

  console.log(`[vision] Initiating NVIDIA semantic analysis for project ${projectId}...`);

  // Pick top candidate scenes by local motion/audio score to sample (max 5 representative keyframes)
  const sorted = [...scenes].sort((a, b) => (b.motionScore + b.audioScore) - (a.motionScore + a.audioScore));
  const topScenes = sorted.slice(0, 5);

  const tempDir = path.resolve(process.cwd(), 'storage/temp', projectId);
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  let enrichedCount = 0;

  for (const scene of topScenes) {
    try {
      const midPoint = (scene.startTime + scene.endTime) / 2;
      const framePath = path.join(tempDir, `sample_${scene.id}.jpg`);

      await extractRepresentativeFrame(videoPath, midPoint, framePath);
      const analysis = await analyzeFrameWithNvidia(framePath);

      if (analysis) {
        enrichedCount++;
        // Combine local FFmpeg motion score with NVIDIA semantic AI score
        scene.actionScore = Math.round((scene.actionScore * 0.4) + (analysis.actionScore * 0.6));
        scene.faceScore = analysis.characterPresence ? 85 : 30;
        scene.metadata = {
          ...scene.metadata,
          nvidiaVision: {
            tags: analysis.tags,
            summary: analysis.summary,
            dramaScore: analysis.dramaScore,
            semanticAction: analysis.actionScore,
          },
        };
      }

      // Cleanup frame immediately
      if (fs.existsSync(framePath)) {
        fs.unlinkSync(framePath);
      }
    } catch {
      // Graceful individual scene error fallback
    }
  }

  // Cleanup temp dir
  try {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  } catch {
    // ignore
  }

  if (enrichedCount > 0) {
    console.log(`[vision] NVIDIA Vision enriched ${enrichedCount} peak anime scenes successfully.`);
    return { scenes, providerUsed: 'nvidia' };
  } else {
    console.log('[vision] NVIDIA semantic vision unavailable — using local motion/visual analysis.');
    return { scenes, providerUsed: 'local_fallback' };
  }
}

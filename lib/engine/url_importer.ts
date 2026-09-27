import url from 'url';
import dns from 'dns';
import util from 'util';
import path from 'path';
import fs from 'fs';
import { storage } from '@/lib/storage';
import { probeMedia } from './media_probe';
import { VideoMetadata } from '@/types';

const lookupAsync = util.promisify(dns.lookup);

export interface VideoSourceAdapter {
  name: string;
  canHandle(targetUrl: string): boolean;
  capabilityStatus(): 'supported' | 'limited' | 'unsupported';
  importVideo(targetUrl: string, projectId: string): Promise<{ localPath: string; metadata: VideoMetadata }>;
}

/**
 * Validates URLs against SSRF vulnerabilities (internal network, localhost, cloud metadata).
 */
export async function validateSafeUrl(targetUrl: string): Promise<{ valid: boolean; reason?: string }> {
  try {
    const parsed = new URL(targetUrl);

    // Protocol validation
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { valid: false, reason: `Unsupported protocol: ${parsed.protocol}. Only http and https are permitted.` };
    }

    const hostname = parsed.hostname.toLowerCase();

    // Block localhost and standard loopbacks
    if (
      hostname === 'localhost' ||
      hostname.endsWith('.localhost') ||
      hostname === '127.0.0.1' ||
      hostname === '::1' ||
      hostname === '0.0.0.0'
    ) {
      return { valid: false, reason: 'Access to localhost and loopback interfaces is prohibited for security.' };
    }

    // Cloud metadata address
    if (hostname === '169.254.169.254' || hostname.includes('metadata.google.internal')) {
      return { valid: false, reason: 'Access to cloud instance metadata is strictly blocked.' };
    }

    // Resolve DNS to verify IP is not in private ranges
    try {
      const { address } = await lookupAsync(hostname);
      const parts = address.split('.').map(Number);
      if (parts.length === 4) {
        // 10.0.0.0/8
        if (parts[0] === 10) return { valid: false, reason: 'Access to private RFC1918 addresses is blocked.' };
        // 172.16.0.0/12
        if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return { valid: false, reason: 'Access to private RFC1918 addresses is blocked.' };
        // 192.168.0.0/16
        if (parts[0] === 192 && parts[1] === 168) return { valid: false, reason: 'Access to private RFC1918 addresses is blocked.' };
        // 127.0.0.0/8
        if (parts[0] === 127) return { valid: false, reason: 'Access to loopback IP addresses is blocked.' };
      }
    } catch {
      return { valid: false, reason: 'Failed to resolve domain name.' };
    }

    return { valid: true };
  } catch {
    return { valid: false, reason: 'Malformed URL provided.' };
  }
}

/**
 * Direct Video Download Adapter (for direct .mp4, .webm, .mov public links)
 */
export const DirectVideoAdapter: VideoSourceAdapter = {
  name: 'Direct Video URL',
  canHandle(targetUrl: string) {
    const ext = path.extname(new URL(targetUrl).pathname).toLowerCase();
    return ['.mp4', '.mov', '.webm', '.mkv'].includes(ext);
  },
  capabilityStatus() {
    return 'supported';
  },
  async importVideo(targetUrl: string, projectId: string) {
    const safe = await validateSafeUrl(targetUrl);
    if (!safe.valid) {
      throw new Error(`URL rejected: ${safe.reason}`);
    }

    const response = await fetch(targetUrl, {
      headers: { 'User-Agent': 'AnimeClipsAI/1.0 (Media Worker)' },
      signal: AbortSignal.timeout(60000),
    });

    if (!response.ok) {
      throw new Error(`Failed to download video: HTTP status ${response.status}`);
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('video') && !contentType.includes('octet-stream')) {
      throw new Error(`Provided URL does not return video content (content-type: ${contentType}).`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const filename = `import_${projectId}_${Date.now()}.mp4`;
    const localPath = await storage.saveFile('source-videos', filename, buffer);

    const metadata = await probeMedia(localPath);
    return { localPath, metadata };
  },
};

/**
 * Social Platform Adapters with honest capability reporting
 */
export const SocialPlatformAdapters = [
  {
    domain: 'youtube.com',
    name: 'YouTube',
    status: 'unsupported' as const,
    reason: 'Direct video import from YouTube is not currently supported due to platform terms and DRM protections. Please download and upload the video file directly.',
  },
  {
    domain: 'tiktok.com',
    name: 'TikTok',
    status: 'unsupported' as const,
    reason: 'Direct video import from TikTok is not currently supported without authenticated developer API credentials. Please upload the video file directly.',
  },
  {
    domain: 'instagram.com',
    name: 'Instagram',
    status: 'unsupported' as const,
    reason: 'Direct video import from Instagram requires Graph API OAuth permissions. Please upload the video file directly.',
  },
];

export function resolveSourceAdapter(targetUrl: string): {
  adapter?: VideoSourceAdapter;
  supported: boolean;
  status: 'supported' | 'limited' | 'unsupported';
  message: string;
} {
  try {
    const parsed = new URL(targetUrl);
    const host = parsed.hostname.toLowerCase();

    // Check direct video
    if (DirectVideoAdapter.canHandle(targetUrl)) {
      return {
        adapter: DirectVideoAdapter,
        supported: true,
        status: 'supported',
        message: 'Direct downloadable video URL detected.',
      };
    }

    // Check platform
    for (const p of SocialPlatformAdapters) {
      if (host.includes(p.domain)) {
        return {
          supported: false,
          status: p.status,
          message: p.reason,
        };
      }
    }

    return {
      supported: false,
      status: 'unsupported',
      message: 'Direct video import from this platform is not currently supported. Upload the video file or provide a direct downloadable video URL (.mp4, .webm).',
    };
  } catch {
    return {
      supported: false,
      status: 'unsupported',
      message: 'Invalid video URL provided.',
    };
  }
}

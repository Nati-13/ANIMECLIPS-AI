import { CropMode, Resolution } from '@/types';

export interface CropFilterConfig {
  mode: CropMode;
  targetResolution: Resolution; // e.g. "1080x1920"
  cropXPercent: number; // 0 - 100 center horizontal position
  cropYPercent: number; // 0 - 100 center vertical position
  cropScale: number; // 1.0 - 2.0
}

/**
 * Generates the FFmpeg video filtergraph for 9:16 vertical re-framing.
 */
export function buildReframingFilter(
  sourceWidth: number,
  sourceHeight: number,
  config: CropFilterConfig
): string {
  const [targetW, targetH] = config.targetResolution.split('x').map(Number);

  switch (config.mode) {
    case 'blur': {
      // Blurred enlarged background with sharp original video centered on top
      return `split[fg_raw][bg_raw];` +
        `[bg_raw]scale=${targetW}:${targetH}:force_original_aspect_ratio=increase,crop=${targetW}:${targetH},boxblur=25:5[bg];` +
        `[fg_raw]scale=${targetW}:-1:force_original_aspect_ratio=decrease[fg];` +
        `[bg][fg]overlay=(W-w)/2:(H-h)/2`;
    }

    case 'mirror': {
      // Mirrored side-fill background with sharp original centered on top
      return `split[fg_raw][bg_raw];` +
        `[bg_raw]scale=${targetW}:${targetH}:force_original_aspect_ratio=increase,crop=${targetW}:${targetH},hflip,boxblur=15:3[bg];` +
        `[fg_raw]scale=${targetW}:-1:force_original_aspect_ratio=decrease[fg];` +
        `[bg][fg]overlay=(W-w)/2:(H-h)/2`;
    }

    case 'fit': {
      // Black letterbox/pillarbox preservation of full original frame
      return `scale=${targetW}:${targetH}:force_original_aspect_ratio=decrease,` +
        `pad=${targetW}:${targetH}:(ow-iw)/2:(oh-ih)/2:black`;
    }

    case 'crop':
    default: {
      // Smart crop: crop 9:16 slice from 16:9 source and scale to target 1080x1920
      // Calculate crop width for 9:16 from sourceHeight
      const targetAspect = targetW / targetH; // 9/16 = 0.5625
      const idealCropW = Math.round(sourceHeight * targetAspect);

      // Clamp horizontal offset based on cropXPercent (0 = left, 50 = center, 100 = right)
      const maxOffset = Math.max(0, sourceWidth - idealCropW);
      const cropX = Math.round((config.cropXPercent / 100) * maxOffset);

      if (config.cropScale > 1.0) {
        // Zoomed crop
        const scaledW = Math.round(idealCropW / config.cropScale);
        const scaledH = Math.round(sourceHeight / config.cropScale);
        const zMaxOffsetX = Math.max(0, sourceWidth - scaledW);
        const zCropX = Math.round((config.cropXPercent / 100) * zMaxOffsetX);
        const zMaxOffsetY = Math.max(0, sourceHeight - scaledH);
        const zCropY = Math.round((config.cropYPercent / 100) * zMaxOffsetY);

        return `crop=${scaledW}:${scaledH}:${zCropX}:${zCropY},scale=${targetW}:${targetH}`;
      }

      return `crop=${idealCropW}:${sourceHeight}:${cropX}:0,scale=${targetW}:${targetH}`;
    }
  }
}

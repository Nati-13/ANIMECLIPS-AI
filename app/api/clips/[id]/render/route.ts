import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { db } from '@/lib/db';
import { storage } from '@/lib/storage';
import { renderClip } from '@/lib/ffmpeg/renderer';
import { validateRenderedClip } from '@/lib/engine/validator';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const clip = await db.getClip(id);
  if (!clip) {
    return NextResponse.json({ error: 'Clip not found' }, { status: 404 });
  }

  const project = await db.getProject(clip.projectId);
  if (!project) {
    return NextResponse.json({ error: 'Associated project not found' }, { status: 404 });
  }

  let sourceVideoPath = project.sourceStoragePath;
  if (!sourceVideoPath || !fs.existsSync(sourceVideoPath)) {
    const demoPath = path.resolve(process.cwd(), 'public/samples/anime_action_demo.mp4');
    if (fs.existsSync(demoPath)) {
      sourceVideoPath = demoPath;
    } else {
      return NextResponse.json({ error: 'Source video file missing on disk.' }, { status: 400 });
    }
  }

  // Get edit options
  let edits = await db.getClipEdit(id);
  if (!edits) {
    edits = {
      id: `edit_${id}`,
      clipId: id,
      trimStart: 0,
      trimEnd: 0,
      cropMode: 'crop',
      cropX: 50,
      cropY: 50,
      cropScale: 1.0,
      speed: 1.0,
      rotation: 0,
      effects: {
        shake: false,
        flash: false,
        vignette: false,
        blur: false,
        contrast: 1.0,
        saturation: 1.0,
        brightness: 0.0,
      },
      captionStyle: {
        style: 'anime',
        fontSize: 32,
        color: '#FFFFFF',
        outlineColor: '#000000',
        outlineWidth: 3,
        position: 'bottom',
      },
      textOverlays: [],
      audioSettings: {
        videoVolume: 100,
        musicVolume: 50,
        sfxVolume: 80,
      },
      updatedAt: new Date().toISOString(),
    };
    await db.saveClipEdit(edits);
  }

  // Mark clip as rendering
  await db.updateClip(id, { status: 'rendering' });

  const outputFilename = `render_${id}.mp4`;
  const thumbFilename = `thumb_${id}.jpg`;
  const outputDiskPath = storage.getDiskPath('generated-clips', outputFilename);
  const thumbDiskPath = storage.getDiskPath('thumbnails', thumbFilename);

  try {
    // Execute real FFmpeg render
    await renderClip({
      sourceVideoPath,
      outputPath: outputDiskPath,
      thumbnailPath: thumbDiskPath,
      sourceWidth: project.width || 1920,
      sourceHeight: project.height || 1080,
      startTime: clip.sceneStart,
      endTime: clip.sceneEnd,
      resolution: project.resolution || '1080x1920',
      edits,
    });

    // Validate with FFprobe
    const validation = await validateRenderedClip(outputDiskPath, project.resolution || '1080x1920', 1);
    if (!validation.passed) {
      await db.updateClip(id, { status: 'failed' });
      return NextResponse.json({
        error: `Render validation failed: ${validation.errors.join('; ')}`,
      }, { status: 422 });
    }

    // Success
    const publicVideoUrl = storage.getPublicUrl('generated-clips', outputFilename);
    const publicThumbUrl = storage.getPublicUrl('thumbnails', thumbFilename);

    await db.updateClip(id, {
      status: 'rendered',
      outputPath: publicVideoUrl,
      thumbnailPath: publicThumbUrl,
    });

    return NextResponse.json({
      success: true,
      clipId: id,
      videoUrl: publicVideoUrl,
      thumbnailUrl: publicThumbUrl,
      validation,
    });
  } catch (error: unknown) {
    await db.updateClip(id, { status: 'failed' });
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: `Rendering failed: ${msg}` }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { db } from '@/lib/db';
import { storage } from '@/lib/storage';
import { probeMedia } from '@/lib/engine/media_probe';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const project = await db.getProject(id);
  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('video') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No video file provided in form data.' }, { status: 400 });
    }

    const ext = path.extname(file.name).toLowerCase() || '.mp4';
    if (!['.mp4', '.mov', '.webm', '.mkv'].includes(ext)) {
      return NextResponse.json(
        { error: 'Unsupported video format. Allowed formats: MP4, MOV, WEBM, MKV.' },
        { status: 400 }
      );
    }

    const filename = `${id}_${Date.now()}${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const localDiskPath = await storage.saveFile('source-videos', filename, buffer);

    // Run real FFprobe
    const metadata = await probeMedia(localDiskPath);

    // Update project
    await db.updateProject(id, {
      sourceType: 'upload',
      sourceStoragePath: localDiskPath,
      duration: metadata.duration,
      width: metadata.width,
      height: metadata.height,
      fps: metadata.fps,
      status: 'draft',
    });

    return NextResponse.json({
      success: true,
      metadata,
      storagePath: localDiskPath,
      publicUrl: storage.getPublicUrl('source-videos', filename),
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload processing failed' },
      { status: 500 }
    );
  }
}

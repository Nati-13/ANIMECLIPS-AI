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
    const contentType = req.headers.get('content-type') || '';

    // CASE 1: Direct Browser-to-Storage upload notification (Production Vercel pattern)
    // The browser uploads the large video directly to Supabase Storage, and notifies this API route
    if (contentType.includes('application/json')) {
      const body = await req.json();
      const { storagePath, filename, sizeBytes, mimeType } = body;

      if (!storagePath) {
        return NextResponse.json({ error: 'storagePath is required' }, { status: 400 });
      }

      await db.updateProject(id, {
        sourceType: 'upload',
        sourceStoragePath: storagePath,
        status: 'draft',
      });

      return NextResponse.json({
        success: true,
        storagePath,
        filename: filename || path.basename(storagePath),
        publicUrl: storage.getPublicUrl('source-videos', path.basename(storagePath)),
      });
    }

    // CASE 2: Multipart Form Data upload (Local development / Small video uploads)
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
    const localDiskPath = await storage.saveFile('source-videos', filename, buffer, file.type || 'video/mp4');

    // Run FFprobe if local tools available
    let duration = 0;
    let width = 1920;
    let height = 1080;
    let fps = 24.0;

    try {
      const metadata = await probeMedia(localDiskPath);
      duration = metadata.duration;
      width = metadata.width;
      height = metadata.height;
      fps = metadata.fps;
    } catch {
      // Worker will probe if FFprobe is not in Vercel environment
    }

    // Update project
    await db.updateProject(id, {
      sourceType: 'upload',
      sourceStoragePath: localDiskPath,
      duration,
      width,
      height,
      fps,
      status: 'draft',
    });

    return NextResponse.json({
      success: true,
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

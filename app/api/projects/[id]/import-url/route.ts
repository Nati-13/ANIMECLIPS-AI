import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { resolveSourceAdapter } from '@/lib/engine/url_importer';

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
    const { url } = await req.json();
    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'Valid URL is required.' }, { status: 400 });
    }

    const resolution = resolveSourceAdapter(url);

    if (!resolution.supported || !resolution.adapter) {
      return NextResponse.json({
        success: false,
        status: resolution.status,
        message: resolution.message,
      }, { status: 422 });
    }

    // Import video
    const { localPath, metadata } = await resolution.adapter.importVideo(url, id);

    await db.updateProject(id, {
      sourceType: 'url',
      sourceUrl: url,
      sourceStoragePath: localPath,
      duration: metadata.duration,
      width: metadata.width,
      height: metadata.height,
      fps: metadata.fps,
    });

    return NextResponse.json({
      success: true,
      status: 'supported',
      message: 'Video imported successfully.',
      metadata,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'URL import failed' },
      { status: 500 }
    );
  }
}

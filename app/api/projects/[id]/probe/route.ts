import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { db } from '@/lib/db';
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

  let videoPath = project.sourceStoragePath;
  if (!videoPath || !fs.existsSync(videoPath)) {
    // If sample video is set
    const samplePath = path.resolve(process.cwd(), 'public/samples/anime_action_demo.mp4');
    if (fs.existsSync(samplePath)) {
      videoPath = samplePath;
      await db.updateProject(id, { sourceStoragePath: samplePath });
    } else {
      return NextResponse.json({ error: 'No video file found for this project.' }, { status: 400 });
    }
  }

  try {
    const metadata = await probeMedia(videoPath);
    await db.updateProject(id, {
      duration: metadata.duration,
      width: metadata.width,
      height: metadata.height,
      fps: metadata.fps,
    });

    return NextResponse.json({ metadata });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'FFprobe inspection failed' },
      { status: 500 }
    );
  }
}

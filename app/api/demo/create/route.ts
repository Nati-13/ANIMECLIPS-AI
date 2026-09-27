import { NextResponse } from 'next/server';
import path from 'path';
import { db } from '@/lib/db';
import { probeMedia } from '@/lib/engine/media_probe';

export async function POST() {
  const samplePath = path.resolve(process.cwd(), 'public/samples/anime_action_demo.mp4');

  try {
    const meta = await probeMedia(samplePath);
    const id = `demo_${Date.now()}`;

    const project = await db.createProject({
      id,
      name: 'Anime Action Shonen Demo [Sample 1080p]',
      sourceType: 'sample',
      sourceStoragePath: samplePath,
      duration: meta.duration,
      width: meta.width,
      height: meta.height,
      fps: meta.fps,
      preset: 'animeAction',
      targetDuration: 15,
      aspectRatio: '9:16',
      resolution: '1080x1920',
      status: 'draft',
      metadata: {
        isDemo: true,
        sourceFilename: 'anime_action_demo.mp4',
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      project,
      metadata: meta,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Demo setup failed' },
      { status: 500 }
    );
  }
}

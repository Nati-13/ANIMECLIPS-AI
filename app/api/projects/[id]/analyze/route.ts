import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { db } from '@/lib/db';
import { runVideoAnalysisPipeline } from '@/lib/engine/runner';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const project = await db.getProject(id);
  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));

  let videoPath = project.sourceStoragePath;
  if (!videoPath || !fs.existsSync(videoPath)) {
    const samplePath = path.resolve(process.cwd(), 'public/samples/anime_action_demo.mp4');
    if (fs.existsSync(samplePath)) {
      videoPath = samplePath;
      await db.updateProject(id, { sourceStoragePath: samplePath, sourceType: 'sample' });
    } else {
      return NextResponse.json(
        { error: 'No source video available. Please upload a video or select the demo video.' },
        { status: 400 }
      );
    }
  }

  // Update project settings if passed in body
  if (body.preset || body.targetDuration || body.aspectRatio) {
    await db.updateProject(id, {
      preset: body.preset || project.preset,
      targetDuration: body.targetDuration || project.targetDuration,
      aspectRatio: body.aspectRatio || project.aspectRatio,
      resolution: body.resolution || project.resolution,
    });
  }

  // Kick off pipeline asynchronously so response returns fast
  // and client gets real-time job stage transitions!
  runVideoAnalysisPipeline({
    projectId: id,
    videoFilePath: videoPath,
    numberOfClips: body.numberOfClips || 'auto',
    actionIntensity: body.actionIntensity ?? 85,
    sceneDiversity: body.sceneDiversity ?? 70,
    prioritizeHook: body.prioritizeHook ?? true,
  }).catch((err) => {
    console.error(`Pipeline failure for project ${id}:`, err);
  });

  return NextResponse.json({
    success: true,
    message: 'Analysis initiated.',
  });
}

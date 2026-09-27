import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Project } from '@/types';

export async function GET() {
  const projects = await db.getProjects();
  return NextResponse.json({ projects });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const id = `proj_${Date.now()}`;

    const newProject: Project = {
      id,
      name: body.name || 'Untitled Anime Project',
      sourceType: body.sourceType || 'upload',
      sourceUrl: body.sourceUrl,
      sourceStoragePath: body.sourceStoragePath,
      duration: body.duration || 0,
      width: body.width || 1920,
      height: body.height || 1080,
      fps: body.fps || 24,
      preset: body.preset || 'animeAction',
      targetDuration: body.targetDuration || 30,
      aspectRatio: body.aspectRatio || '9:16',
      resolution: body.resolution || '1080x1920',
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const saved = await db.createProject(newProject);
    return NextResponse.json({ project: saved }, { status: 201 });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create project' },
      { status: 500 }
    );
  }
}

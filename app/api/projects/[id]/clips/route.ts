import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Clip } from '@/types';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const clips = await db.getClips(id);
  return NextResponse.json({ clips });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const project = await db.getProject(id);
  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  const body = await req.json();

  // Mode 1: Create manual custom clip (Requirement #74)
  if (body.type === 'manual') {
    const startTime = Math.max(0, parseFloat(body.startTime) || 0);
    const endTime = Math.min(project.duration || 9999, parseFloat(body.endTime) || startTime + 15);
    const duration = Math.max(1, endTime - startTime);

    const manualClip: Clip = {
      id: `clip_manual_${Date.now()}`,
      projectId: id,
      sceneStart: startTime,
      sceneEnd: endTime,
      duration,
      score: 85,
      hookScore: 80,
      actionScore: 85,
      status: 'ready',
      reason: 'User created manual segment',
      scores: {
        overall: 85,
        action: 85,
        hook: 80,
        visual: 85,
        audio: 80,
      },
      createdAt: new Date().toISOString(),
    };

    await db.saveClips([manualClip]);
    return NextResponse.json({ clip: manualClip }, { status: 201 });
  }

  // Mode 2: Regenerate suggestions with new diversity / action settings
  return NextResponse.json({ message: 'Use /api/projects/:id/analyze to re-run candidate generation.' });
}

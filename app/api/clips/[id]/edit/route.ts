import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ClipEdit } from '@/types';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  let edits = await db.getClipEdit(id);

  if (!edits) {
    const clip = await db.getClip(id);
    if (!clip) {
      return NextResponse.json({ error: 'Clip not found' }, { status: 404 });
    }

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

  return NextResponse.json({ edits });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  let existing = await db.getClipEdit(id);
  if (!existing) {
    existing = {
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
  }

  const merged: ClipEdit = {
    ...existing,
    ...body,
    updatedAt: new Date().toISOString(),
  };

  await db.saveClipEdit(merged);
  return NextResponse.json({ edits: merged });
}

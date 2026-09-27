import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const STORAGE_ROOT = path.resolve(process.cwd(), process.env.LOCAL_STORAGE_DIR || './storage');

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  const subPaths = resolvedParams.path || [];

  if (subPaths.length === 0) {
    return new NextResponse('Not found', { status: 404 });
  }

  // Prevent path traversal
  const safePath = path.normalize(subPaths.join('/')).replace(/^(\.\.(\/|\\|$))+/, '');
  let fullPath = path.join(STORAGE_ROOT, safePath);

  // Also check public folder if not in storage
  if (!fs.existsSync(fullPath)) {
    const publicPath = path.join(process.cwd(), 'public', safePath);
    if (fs.existsSync(publicPath)) {
      fullPath = publicPath;
    } else {
      return new NextResponse('File not found', { status: 404 });
    }
  }

  const stat = fs.statSync(fullPath);
  const fileSize = stat.size;
  const ext = path.extname(fullPath).toLowerCase();

  let contentType = 'application/octet-stream';
  if (ext === '.mp4') contentType = 'video/mp4';
  else if (ext === '.webm') contentType = 'video/webm';
  else if (ext === '.mov') contentType = 'video/quicktime';
  else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
  else if (ext === '.png') contentType = 'image/png';
  else if (ext === '.webp') contentType = 'image/webp';
  else if (ext === '.vtt') contentType = 'text/vtt';
  else if (ext === '.srt' || ext === '.ass') contentType = 'text/plain';

  const range = req.headers.get('range');

  if (range && contentType.startsWith('video/')) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = end - start + 1;

    const fileStream = fs.createReadStream(fullPath, { start, end });
    const nodeStreamToWeb = (stream: fs.ReadStream) => {
      return new ReadableStream({
        start(controller) {
          stream.on('data', (chunk) => controller.enqueue(chunk));
          stream.on('end', () => controller.close());
          stream.on('error', (err) => controller.error(err));
        },
      });
    };

    return new NextResponse(nodeStreamToWeb(fileStream) as unknown as BodyInit, {
      status: 206,
      headers: {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': String(chunksize),
        'Content-Type': contentType,
      },
    });
  }

  const buffer = fs.readFileSync(fullPath);
  return new NextResponse(buffer, {
    headers: {
      'Content-Length': String(fileSize),
      'Content-Type': contentType,
    },
  });
}

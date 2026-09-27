import fs from 'fs';
import path from 'path';

const STORAGE_ROOT = path.resolve(process.cwd(), process.env.LOCAL_STORAGE_DIR || './storage');

export type BucketName = 
  | 'source-videos'
  | 'thumbnails'
  | 'generated-clips'
  | 'captions'
  | 'music'
  | 'sfx';

export const storage = {
  getBucketDir(bucket: BucketName): string {
    const dir = path.join(STORAGE_ROOT, bucket);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    return dir;
  },

  getDiskPath(bucket: BucketName, filename: string): string {
    return path.join(this.getBucketDir(bucket), filename);
  },

  async saveFile(bucket: BucketName, filename: string, buffer: Buffer): Promise<string> {
    const dest = this.getDiskPath(bucket, filename);
    await fs.promises.writeFile(dest, buffer);
    return dest;
  },

  getPublicUrl(bucket: BucketName, filename: string): string {
    return `/api/media/${bucket}/${filename}`;
  },

  deleteFile(bucket: BucketName, filename: string): boolean {
    const dest = this.getDiskPath(bucket, filename);
    if (fs.existsSync(dest)) {
      try {
        fs.unlinkSync(dest);
        return true;
      } catch {
        return false;
      }
    }
    return false;
  },
};

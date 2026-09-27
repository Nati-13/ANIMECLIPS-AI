import fs from 'fs';
import path from 'path';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const STORAGE_ROOT = path.resolve(process.cwd(), process.env.LOCAL_STORAGE_DIR || './storage');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseKey &&
  !supabaseUrl.includes('your-project') &&
  !supabaseKey.includes('your-')
);

let supabaseStorageClient: SupabaseClient | null = null;
if (isSupabaseConfigured && supabaseUrl && supabaseKey) {
  try {
    supabaseStorageClient = createClient(supabaseUrl, supabaseKey);
  } catch {
    supabaseStorageClient = null;
  }
}

export type BucketName = 
  | 'source-videos'
  | 'thumbnails'
  | 'generated-clips'
  | 'captions'
  | 'music'
  | 'sfx';

export const storage = {
  isUsingSupabase(): boolean {
    return Boolean(isSupabaseConfigured && supabaseStorageClient);
  },

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

  async saveFile(bucket: BucketName, filename: string, buffer: Buffer, contentType?: string): Promise<string> {
    const dest = this.getDiskPath(bucket, filename);
    await fs.promises.writeFile(dest, buffer);

    if (this.isUsingSupabase() && supabaseStorageClient) {
      try {
        await supabaseStorageClient.storage.from(bucket).upload(filename, buffer, {
          contentType: contentType || 'application/octet-stream',
          upsert: true,
        });
      } catch (err) {
        console.warn(`[storage] Supabase upload error for ${bucket}/${filename}:`, err);
      }
    }

    return dest;
  },

  getPublicUrl(bucket: BucketName, filename: string): string {
    if (this.isUsingSupabase() && supabaseStorageClient && ['thumbnails', 'generated-clips'].includes(bucket)) {
      const { data } = supabaseStorageClient.storage.from(bucket).getPublicUrl(filename);
      if (data?.publicUrl) return data.publicUrl;
    }
    return `/api/media/${bucket}/${filename}`;
  },

  async downloadFile(bucket: BucketName, filename: string, targetPath: string): Promise<string> {
    const localExisting = this.getDiskPath(bucket, filename);
    if (fs.existsSync(localExisting)) {
      return localExisting;
    }

    if (this.isUsingSupabase() && supabaseStorageClient) {
      const { data, error } = await supabaseStorageClient.storage.from(bucket).download(filename);
      if (!error && data) {
        const buffer = Buffer.from(await data.arrayBuffer());
        if (!fs.existsSync(path.dirname(targetPath))) {
          fs.mkdirSync(path.dirname(targetPath), { recursive: true });
        }
        await fs.promises.writeFile(targetPath, buffer);
        return targetPath;
      }
    }

    throw new Error(`Media file not found in storage: ${bucket}/${filename}`);
  },

  deleteFile(bucket: BucketName, filename: string): boolean {
    const dest = this.getDiskPath(bucket, filename);
    let deleted = false;
    if (fs.existsSync(dest)) {
      try {
        fs.unlinkSync(dest);
        deleted = true;
      } catch {
        deleted = false;
      }
    }

    if (this.isUsingSupabase() && supabaseStorageClient) {
      supabaseStorageClient.storage.from(bucket).remove([filename]).catch(() => {});
    }

    return deleted;
  },
};

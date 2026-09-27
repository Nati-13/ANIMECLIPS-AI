import fs from 'fs';
import path from 'path';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  Project,
  SourceVideo,
  Scene,
  Clip,
  ClipEdit,
  RenderJob,
  JobStage,
} from '@/types';

// Detect Supabase credentials
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseKey && 
  !supabaseUrl.includes('your-project') &&
  !supabaseKey.includes('your-')
);

let supabaseClient: SupabaseClient | null = null;
if (isSupabaseConfigured && supabaseUrl && supabaseKey) {
  try {
    supabaseClient = createClient(supabaseUrl, supabaseKey);
  } catch {
    supabaseClient = null;
  }
}

// Local File Persistence Fallback
const STORAGE_DIR = process.env.LOCAL_STORAGE_DIR || './storage';
const DB_FILE = path.resolve(process.cwd(), STORAGE_DIR, 'db_store.json');

interface LocalDatabase {
  projects: Record<string, Project>;
  sourceVideos: Record<string, SourceVideo>;
  scenes: Record<string, Scene[]>;
  clips: Record<string, Clip>;
  clipEdits: Record<string, ClipEdit>;
  renderJobs: Record<string, RenderJob>;
}

function loadLocalDb(): LocalDatabase {
  try {
    if (!fs.existsSync(path.dirname(DB_FILE))) {
      fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
    }
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch {
    // Ignore load error
  }
  return {
    projects: {},
    sourceVideos: {},
    scenes: {},
    clips: {},
    clipEdits: {},
    renderJobs: {},
  };
}

function saveLocalDb(db: LocalDatabase): void {
  try {
    if (!fs.existsSync(path.dirname(DB_FILE))) {
      fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save local db:', err);
  }
}

// Repository API
export const db = {
  isUsingSupabase: () => isSupabaseConfigured && !!supabaseClient,

  async getProjects(): Promise<Project[]> {
    if (isSupabaseConfigured && supabaseClient) {
      const { data, error } = await supabaseClient
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data) {
        return data.map((d: any) => ({
          id: d.id,
          userId: d.user_id,
          name: d.name,
          sourceType: d.source_type,
          sourceUrl: d.source_url,
          sourceStoragePath: d.source_storage_path,
          duration: Number(d.duration),
          width: d.width,
          height: d.height,
          fps: Number(d.fps),
          preset: d.preset,
          targetDuration: d.target_duration,
          aspectRatio: d.aspect_ratio,
          resolution: d.resolution,
          status: d.status,
          metadata: d.metadata,
          createdAt: d.created_at,
          updatedAt: d.updated_at,
        }));
      }
    }
    const local = loadLocalDb();
    return Object.values(local.projects).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  async getProject(id: string): Promise<Project | null> {
    if (isSupabaseConfigured && supabaseClient) {
      const { data } = await supabaseClient.from('projects').select('*').eq('id', id).single();
      if (data) {
        return {
          id: data.id,
          userId: data.user_id,
          name: data.name,
          sourceType: data.source_type,
          sourceUrl: data.source_url,
          sourceStoragePath: data.source_storage_path,
          duration: Number(data.duration),
          width: data.width,
          height: data.height,
          fps: Number(data.fps),
          preset: data.preset,
          targetDuration: data.target_duration,
          aspectRatio: data.aspect_ratio,
          resolution: data.resolution,
          status: data.status,
          metadata: data.metadata,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };
      }
    }
    const local = loadLocalDb();
    return local.projects[id] || null;
  },

  async createProject(project: Project): Promise<Project> {
    if (isSupabaseConfigured && supabaseClient) {
      await supabaseClient.from('projects').insert({
        id: project.id,
        user_id: project.userId || null,
        name: project.name,
        source_type: project.sourceType,
        source_url: project.sourceUrl,
        source_storage_path: project.sourceStoragePath,
        duration: project.duration,
        width: project.width,
        height: project.height,
        fps: project.fps,
        preset: project.preset,
        target_duration: project.targetDuration,
        aspect_ratio: project.aspectRatio,
        resolution: project.resolution,
        status: project.status,
        metadata: project.metadata || {},
        created_at: project.createdAt,
        updated_at: project.updatedAt,
      });
    }
    const local = loadLocalDb();
    local.projects[project.id] = project;
    saveLocalDb(local);
    return project;
  },

  async updateProject(id: string, updates: Partial<Project>): Promise<Project | null> {
    const existing = await this.getProject(id);
    if (!existing) return null;
    const merged: Project = { ...existing, ...updates, updatedAt: new Date().toISOString() };

    if (isSupabaseConfigured && supabaseClient) {
      await supabaseClient.from('projects').update({
        name: merged.name,
        status: merged.status,
        duration: merged.duration,
        width: merged.width,
        height: merged.height,
        fps: merged.fps,
        preset: merged.preset,
        target_duration: merged.targetDuration,
        aspect_ratio: merged.aspectRatio,
        resolution: merged.resolution,
        updated_at: merged.updatedAt,
        metadata: merged.metadata || {},
      }).eq('id', id);
    }
    const local = loadLocalDb();
    local.projects[id] = merged;
    saveLocalDb(local);
    return merged;
  },

  async deleteProject(id: string): Promise<boolean> {
    if (isSupabaseConfigured && supabaseClient) {
      await supabaseClient.from('projects').delete().eq('id', id);
    }
    const local = loadLocalDb();
    delete local.projects[id];
    delete local.scenes[id];
    Object.keys(local.clips).forEach((clipId) => {
      if (local.clips[clipId].projectId === id) {
        delete local.clips[clipId];
        delete local.clipEdits[clipId];
      }
    });
    saveLocalDb(local);
    return true;
  },

  async getScenes(projectId: string): Promise<Scene[]> {
    const local = loadLocalDb();
    return local.scenes[projectId] || [];
  },

  async saveScenes(projectId: string, scenes: Scene[]): Promise<void> {
    const local = loadLocalDb();
    local.scenes[projectId] = scenes;
    saveLocalDb(local);
  },

  async getClips(projectId: string): Promise<Clip[]> {
    const local = loadLocalDb();
    return Object.values(local.clips)
      .filter((c) => c.projectId === projectId)
      .sort((a, b) => a.sceneStart - b.sceneStart);
  },

  async getClip(id: string): Promise<Clip | null> {
    const local = loadLocalDb();
    return local.clips[id] || null;
  },

  async saveClips(clips: Clip[]): Promise<void> {
    const local = loadLocalDb();
    clips.forEach((clip) => {
      local.clips[clip.id] = clip;
      // Initialize default clip edit if not exists
      if (!local.clipEdits[clip.id]) {
        local.clipEdits[clip.id] = {
          id: `edit_${clip.id}`,
          clipId: clip.id,
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
    });
    saveLocalDb(local);
  },

  async updateClip(id: string, updates: Partial<Clip>): Promise<Clip | null> {
    const local = loadLocalDb();
    const existing = local.clips[id];
    if (!existing) return null;
    const merged = { ...existing, ...updates };
    local.clips[id] = merged;
    saveLocalDb(local);
    return merged;
  },

  async deleteClip(id: string): Promise<boolean> {
    const local = loadLocalDb();
    delete local.clips[id];
    delete local.clipEdits[id];
    saveLocalDb(local);
    return true;
  },

  async getClipEdit(clipId: string): Promise<ClipEdit | null> {
    const local = loadLocalDb();
    return local.clipEdits[clipId] || null;
  },

  async saveClipEdit(edit: ClipEdit): Promise<ClipEdit> {
    const local = loadLocalDb();
    local.clipEdits[edit.clipId] = {
      ...edit,
      updatedAt: new Date().toISOString(),
    };
    saveLocalDb(local);
    return local.clipEdits[edit.clipId];
  },

  async getRenderJobs(projectId: string): Promise<RenderJob[]> {
    const local = loadLocalDb();
    return Object.values(local.renderJobs)
      .filter((j) => j.projectId === projectId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async getRenderJob(jobId: string): Promise<RenderJob | null> {
    const local = loadLocalDb();
    return local.renderJobs[jobId] || null;
  },

  async createRenderJob(job: RenderJob): Promise<RenderJob> {
    const local = loadLocalDb();
    local.renderJobs[job.id] = job;
    saveLocalDb(local);
    return job;
  },

  async updateRenderJob(id: string, updates: Partial<RenderJob>): Promise<RenderJob | null> {
    const local = loadLocalDb();
    const existing = local.renderJobs[id];
    if (!existing) return null;
    const merged = { ...existing, ...updates };
    local.renderJobs[id] = merged;
    saveLocalDb(local);
    return merged;
  },
};

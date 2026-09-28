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
    if (isSupabaseConfigured && supabaseClient) {
      try {
        const { data, error } = await supabaseClient
          .from('scenes')
          .select('*')
          .eq('project_id', projectId)
          .order('start_time', { ascending: true });
        if (!error && data && data.length > 0) {
          return data.map((d: any) => ({
            id: d.id,
            projectId: d.project_id,
            startTime: Number(d.start_time),
            endTime: Number(d.end_time),
            motionScore: Number(d.motion_score || 0),
            audioScore: Number(d.audio_score || 0),
            actionScore: Number(d.action_score || 0),
            faceScore: Number(d.face_score || 0),
            saliencyScore: Number(d.saliency_score || 0),
            sceneScore: Number(d.scene_score || 0),
            metadata: d.metadata_json || {},
            createdAt: d.created_at,
          }));
        }
      } catch (err) {
        console.warn('[db] Supabase getScenes query fallback:', err);
      }
    }
    const local = loadLocalDb();
    return local.scenes[projectId] || [];
  },

  async saveScenes(projectId: string, scenes: Scene[]): Promise<void> {
    if (isSupabaseConfigured && supabaseClient && scenes.length > 0) {
      try {
        const rows = scenes.map((s) => ({
          id: s.id && s.id.includes('-') && s.id.length === 36 ? s.id : undefined,
          project_id: projectId,
          start_time: s.startTime,
          end_time: s.endTime,
          motion_score: s.motionScore,
          audio_score: s.audioScore,
          action_score: s.actionScore,
          face_score: s.faceScore,
          saliency_score: s.saliencyScore,
          scene_score: s.sceneScore,
          metadata_json: s.metadata || {},
          created_at: s.createdAt || new Date().toISOString(),
        }));
        await supabaseClient.from('scenes').upsert(rows);
      } catch (err) {
        console.warn('[db] Supabase saveScenes fallback to local:', err);
      }
    }
    const local = loadLocalDb();
    local.scenes[projectId] = scenes;
    saveLocalDb(local);
  },

  async getClips(projectId: string): Promise<Clip[]> {
    if (isSupabaseConfigured && supabaseClient) {
      try {
        const { data, error } = await supabaseClient
          .from('clips')
          .select('*')
          .eq('project_id', projectId)
          .order('scene_start', { ascending: true });
        if (!error && data && data.length > 0) {
          return data.map((d: any) => ({
            id: d.id,
            projectId: d.project_id,
            sceneStart: Number(d.scene_start),
            sceneEnd: Number(d.scene_end),
            duration: Number(d.duration),
            score: Number(d.score || 0),
            hookScore: Number(d.hook_score || 0),
            actionScore: Number(d.action_score || 0),
            status: d.status,
            thumbnailPath: d.thumbnail_path,
            outputPath: d.output_path,
            captionPath: d.caption_path,
            reason: d.reason,
            createdAt: d.created_at,
          }));
        }
      } catch (err) {
        console.warn('[db] Supabase getClips query fallback:', err);
      }
    }
    const local = loadLocalDb();
    return Object.values(local.clips)
      .filter((c) => c.projectId === projectId)
      .sort((a, b) => a.sceneStart - b.sceneStart);
  },

  async getClip(id: string): Promise<Clip | null> {
    if (isSupabaseConfigured && supabaseClient) {
      try {
        const { data, error } = await supabaseClient
          .from('clips')
          .select('*')
          .eq('id', id)
          .single();
        if (!error && data) {
          return {
            id: data.id,
            projectId: data.project_id,
            sceneStart: Number(data.scene_start),
            sceneEnd: Number(data.scene_end),
            duration: Number(data.duration),
            score: Number(data.score || 0),
            hookScore: Number(data.hook_score || 0),
            actionScore: Number(data.action_score || 0),
            status: data.status,
            thumbnailPath: data.thumbnail_path,
            outputPath: data.output_path,
            captionPath: data.caption_path,
            reason: data.reason,
            createdAt: data.created_at,
          };
        }
      } catch (err) {
        console.warn('[db] Supabase getClip query fallback:', err);
      }
    }
    const local = loadLocalDb();
    return local.clips[id] || null;
  },

  async saveClips(clips: Clip[]): Promise<void> {
    if (isSupabaseConfigured && supabaseClient && clips.length > 0) {
      try {
        const rows = clips.map((c) => ({
          id: c.id && c.id.includes('-') && c.id.length === 36 ? c.id : undefined,
          project_id: c.projectId,
          scene_start: c.sceneStart,
          scene_end: c.sceneEnd,
          duration: c.duration,
          score: c.score,
          hook_score: c.hookScore,
          action_score: c.actionScore,
          status: c.status,
          thumbnail_path: c.thumbnailPath || null,
          output_path: c.outputPath || null,
          caption_path: c.captionPath || null,
          reason: c.reason || null,
          created_at: c.createdAt || new Date().toISOString(),
        }));
        await supabaseClient.from('clips').upsert(rows);
      } catch (err) {
        console.warn('[db] Supabase saveClips fallback to local:', err);
      }
    }
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
    if (isSupabaseConfigured && supabaseClient) {
      try {
        const payload: Record<string, unknown> = {};
        if (updates.status !== undefined) payload.status = updates.status;
        if (updates.thumbnailPath !== undefined) payload.thumbnail_path = updates.thumbnailPath;
        if (updates.outputPath !== undefined) payload.output_path = updates.outputPath;
        if (updates.captionPath !== undefined) payload.caption_path = updates.captionPath;
        if (updates.score !== undefined) payload.score = updates.score;
        if (updates.reason !== undefined) payload.reason = updates.reason;

        await supabaseClient.from('clips').update(payload).eq('id', id);
      } catch (err) {
        console.warn('[db] Supabase updateClip fallback:', err);
      }
    }
    const local = loadLocalDb();
    const existing = local.clips[id];
    if (!existing) return null;
    const merged = { ...existing, ...updates };
    local.clips[id] = merged;
    saveLocalDb(local);
    return merged;
  },

  async deleteClip(id: string): Promise<boolean> {
    if (isSupabaseConfigured && supabaseClient) {
      try {
        await supabaseClient.from('clip_edits').delete().eq('clip_id', id);
        await supabaseClient.from('clips').delete().eq('id', id);
      } catch (err) {
        console.warn('[db] Supabase deleteClip fallback:', err);
      }
    }
    const local = loadLocalDb();
    delete local.clips[id];
    delete local.clipEdits[id];
    saveLocalDb(local);
    return true;
  },

  async getClipEdit(clipId: string): Promise<ClipEdit | null> {
    if (isSupabaseConfigured && supabaseClient) {
      try {
        const { data, error } = await supabaseClient
          .from('clip_edits')
          .select('*')
          .eq('clip_id', clipId)
          .single();
        if (!error && data) {
          return {
            id: data.id,
            clipId: data.clip_id,
            trimStart: Number(data.trim_start || 0),
            trimEnd: Number(data.trim_end || 0),
            cropMode: data.crop_mode || 'crop',
            cropX: Number(data.crop_x || 50),
            cropY: Number(data.crop_y || 50),
            cropScale: Number(data.crop_scale || 1.0),
            speed: Number(data.speed || 1.0),
            rotation: ([0, 90, 180, 270].includes(Number(data.rotation)) ? Number(data.rotation) : 0) as 0 | 90 | 180 | 270,
            effects: data.effects_json || {},
            captionStyle: data.caption_style_json || {},
            textOverlays: data.text_overlays_json || [],
            audioSettings: data.audio_settings_json || {},
            updatedAt: data.updated_at,
          };
        }
      } catch (err) {
        console.warn('[db] Supabase getClipEdit query fallback:', err);
      }
    }
    const local = loadLocalDb();
    return local.clipEdits[clipId] || null;
  },

  async saveClipEdit(edit: ClipEdit): Promise<ClipEdit> {
    if (isSupabaseConfigured && supabaseClient) {
      try {
        await supabaseClient.from('clip_edits').upsert({
          id: edit.id && edit.id.includes('-') && edit.id.length === 36 ? edit.id : undefined,
          clip_id: edit.clipId,
          trim_start: edit.trimStart,
          trim_end: edit.trimEnd,
          crop_mode: edit.cropMode,
          crop_x: edit.cropX,
          crop_y: edit.cropY,
          crop_scale: edit.cropScale,
          speed: edit.speed,
          rotation: edit.rotation,
          effects_json: edit.effects,
          caption_style_json: edit.captionStyle,
          text_overlays_json: edit.textOverlays,
          audio_settings_json: edit.audioSettings,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'clip_id' });
      } catch (err) {
        console.warn('[db] Supabase saveClipEdit fallback:', err);
      }
    }
    const local = loadLocalDb();
    local.clipEdits[edit.clipId] = {
      ...edit,
      updatedAt: new Date().toISOString(),
    };
    saveLocalDb(local);
    return local.clipEdits[edit.clipId];
  },

  async saveSourceVideo(sourceVideo: SourceVideo): Promise<SourceVideo> {
    if (isSupabaseConfigured && supabaseClient) {
      try {
        await supabaseClient.from('source_videos').upsert({
          id: sourceVideo.id && sourceVideo.id.includes('-') && sourceVideo.id.length === 36 ? sourceVideo.id : undefined,
          project_id: sourceVideo.projectId,
          storage_path: sourceVideo.storagePath,
          filename: sourceVideo.filename,
          mime_type: sourceVideo.mimeType,
          size_bytes: sourceVideo.sizeBytes,
          duration: sourceVideo.duration,
          width: sourceVideo.width,
          height: sourceVideo.height,
          fps: sourceVideo.fps,
          codec: sourceVideo.codec,
          audio_codec: sourceVideo.audioCodec,
          bitrate: sourceVideo.bitrate,
          audio_sample_rate: sourceVideo.audioSampleRate,
          created_at: sourceVideo.createdAt,
        });
      } catch (err) {
        console.warn('[db] Supabase saveSourceVideo fallback:', err);
      }
    }
    const local = loadLocalDb();
    local.sourceVideos[sourceVideo.projectId] = sourceVideo;
    saveLocalDb(local);
    return sourceVideo;
  },

  async getSourceVideo(projectId: string): Promise<SourceVideo | null> {
    if (isSupabaseConfigured && supabaseClient) {
      try {
        const { data, error } = await supabaseClient
          .from('source_videos')
          .select('*')
          .eq('project_id', projectId)
          .single();
        if (!error && data) {
          return {
            id: data.id,
            projectId: data.project_id,
            storagePath: data.storage_path,
            filename: data.filename,
            mimeType: data.mime_type,
            sizeBytes: Number(data.size_bytes),
            duration: Number(data.duration),
            width: data.width,
            height: data.height,
            fps: Number(data.fps),
            codec: data.codec,
            audioCodec: data.audio_codec,
            bitrate: Number(data.bitrate),
            audioSampleRate: data.audio_sample_rate,
            createdAt: data.created_at,
          };
        }
      } catch (err) {
        console.warn('[db] Supabase getSourceVideo fallback:', err);
      }
    }
    const local = loadLocalDb();
    return local.sourceVideos[projectId] || null;
  },

  async checkDatabaseConnection(): Promise<{
    available: boolean;
    status: 'connected' | 'not_configured' | 'connection_error';
    message: string;
  }> {
    if (!isSupabaseConfigured || !supabaseClient) {
      return {
        available: false,
        status: 'not_configured',
        message: 'Supabase credentials not configured. Running on resilient local persistence.',
      };
    }

    try {
      const { error } = await supabaseClient.from('projects').select('id').limit(1);
      if (error) {
        return {
          available: false,
          status: 'connection_error',
          message: `Supabase reachable, but database query returned error: ${error.message}`,
        };
      }
      return {
        available: true,
        status: 'connected',
        message: 'Connected to Supabase PostgreSQL database.',
      };
    } catch (err: unknown) {
      return {
        available: false,
        status: 'connection_error',
        message: `Failed to connect to Supabase: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  },

  async getRenderJobs(projectId: string): Promise<RenderJob[]> {
    if (isSupabaseConfigured && supabaseClient) {
      const { data, error } = await supabaseClient
        .from('render_jobs')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
      if (!error && data) {
        return data.map((d: any) => ({
          id: d.id,
          projectId: d.project_id,
          clipId: d.clip_id,
          jobType: d.job_type || 'analysis',
          stage: d.stage,
          progress: d.progress,
          status: d.status,
          workerId: d.worker_id,
          payload: d.payload,
          attempts: d.attempts,
          message: d.message,
          error: d.error,
          startedAt: d.started_at,
          completedAt: d.completed_at,
          createdAt: d.created_at,
        }));
      }
    }
    const local = loadLocalDb();
    return Object.values(local.renderJobs)
      .filter((j) => j.projectId === projectId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async getRenderJob(jobId: string): Promise<RenderJob | null> {
    if (isSupabaseConfigured && supabaseClient) {
      const { data, error } = await supabaseClient
        .from('render_jobs')
        .select('*')
        .eq('id', jobId)
        .single();
      if (!error && data) {
        return {
          id: data.id,
          projectId: data.project_id,
          clipId: data.clip_id,
          jobType: data.job_type || 'analysis',
          stage: data.stage,
          progress: data.progress,
          status: data.status,
          workerId: data.worker_id,
          payload: data.payload,
          attempts: data.attempts,
          message: data.message,
          error: data.error,
          startedAt: data.started_at,
          completedAt: data.completed_at,
          createdAt: data.created_at,
        };
      }
    }
    const local = loadLocalDb();
    return local.renderJobs[jobId] || null;
  },

  async createRenderJob(job: RenderJob): Promise<RenderJob> {
    if (isSupabaseConfigured && supabaseClient) {
      await supabaseClient.from('render_jobs').insert({
        id: job.id,
        project_id: job.projectId,
        clip_id: job.clipId || null,
        job_type: job.jobType || 'analysis',
        stage: job.stage,
        progress: job.progress,
        status: job.status,
        worker_id: job.workerId || null,
        payload: job.payload || {},
        attempts: job.attempts || 0,
        message: job.message || null,
        error: job.error || null,
        started_at: job.startedAt || null,
        completed_at: job.completedAt || null,
        created_at: job.createdAt,
      });
    }
    const local = loadLocalDb();
    local.renderJobs[job.id] = job;
    saveLocalDb(local);
    return job;
  },

  async updateRenderJob(id: string, updates: Partial<RenderJob>): Promise<RenderJob | null> {
    if (isSupabaseConfigured && supabaseClient) {
      const payload: Record<string, unknown> = {};
      if (updates.stage !== undefined) payload.stage = updates.stage;
      if (updates.progress !== undefined) payload.progress = updates.progress;
      if (updates.status !== undefined) payload.status = updates.status;
      if (updates.workerId !== undefined) payload.worker_id = updates.workerId;
      if (updates.message !== undefined) payload.message = updates.message;
      if (updates.error !== undefined) payload.error = updates.error;
      if (updates.startedAt !== undefined) payload.started_at = updates.startedAt;
      if (updates.completedAt !== undefined) payload.completed_at = updates.completedAt;
      if (updates.attempts !== undefined) payload.attempts = updates.attempts;
      if (updates.payload !== undefined) payload.payload = updates.payload;

      await supabaseClient.from('render_jobs').update(payload).eq('id', id);
    }
    const local = loadLocalDb();
    const existing = local.renderJobs[id];
    if (!existing) return null;
    const merged = { ...existing, ...updates };
    local.renderJobs[id] = merged;
    saveLocalDb(local);
    return merged;
  },

  async claimNextJob(workerId: string): Promise<RenderJob | null> {
    if (isSupabaseConfigured && supabaseClient) {
      try {
        // Try atomic RPC function first
        const { data, error } = await supabaseClient.rpc('claim_next_render_job', {
          worker_id_param: workerId,
        });
        if (!error && data && data.length > 0) {
          const row = data[0];
          return {
            id: row.id,
            projectId: row.project_id,
            clipId: row.clip_id,
            jobType: row.job_type || 'analysis',
            stage: row.stage,
            progress: row.progress,
            status: row.status,
            workerId: row.worker_id,
            payload: row.payload,
            attempts: row.attempts,
            message: row.message,
            error: row.error,
            startedAt: row.started_at,
            completedAt: row.completed_at,
            createdAt: row.created_at,
          };
        }
      } catch {
        // Fallback to direct query & conditional update below
      }

      // Fallback query + atomic conditional update
      const { data: queuedJobs } = await supabaseClient
        .from('render_jobs')
        .select('*')
        .eq('status', 'queued')
        .order('created_at', { ascending: true })
        .limit(1);

      if (queuedJobs && queuedJobs.length > 0) {
        const candidate = queuedJobs[0];
        const { data: updated } = await supabaseClient
          .from('render_jobs')
          .update({
            status: 'running',
            stage: 'probing_media',
            worker_id: workerId,
            started_at: new Date().toISOString(),
            attempts: (candidate.attempts || 0) + 1,
            message: `Claimed by media worker ${workerId}`,
          })
          .eq('id', candidate.id)
          .eq('status', 'queued')
          .select()
          .single();

        if (updated) {
          return {
            id: updated.id,
            projectId: updated.project_id,
            clipId: updated.clip_id,
            jobType: updated.job_type || 'analysis',
            stage: updated.stage,
            progress: updated.progress,
            status: updated.status,
            workerId: updated.worker_id,
            payload: updated.payload,
            attempts: updated.attempts,
            message: updated.message,
            error: updated.error,
            startedAt: updated.started_at,
            completedAt: updated.completed_at,
            createdAt: updated.created_at,
          };
        }
      }
    }

    // Local file persistence atomic claim
    const local = loadLocalDb();
    const nextJob = Object.values(local.renderJobs)
      .filter((j) => j.status === 'queued')
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())[0];

    if (nextJob) {
      nextJob.status = 'running';
      nextJob.stage = 'probing_media';
      nextJob.workerId = workerId;
      nextJob.attempts = (nextJob.attempts || 0) + 1;
      nextJob.startedAt = new Date().toISOString();
      nextJob.message = `Claimed by media worker ${workerId}`;
      local.renderJobs[nextJob.id] = nextJob;
      saveLocalDb(local);
      return nextJob;
    }

    return null;
  },
};

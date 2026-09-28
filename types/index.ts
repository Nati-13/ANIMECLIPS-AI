// ==============================================================================
// AnimeClips AI - Unified Type System
// ==============================================================================

export type SourceType = 'upload' | 'url' | 'sample';

export type ProjectStatus = 
  | 'draft'
  | 'uploading'
  | 'queued'
  | 'analyzing'
  | 'selecting'
  | 'rendering'
  | 'completed'
  | 'failed';

export type PresetKey = 
  | 'animeAction'
  | 'animeEmotional'
  | 'animeHype'
  | 'dialogue'
  | 'generalViral';

export type AspectRatio = '9:16' | '16:9' | '1:1';
export type Resolution = '1080x1920' | '720x1280';
export type CropMode = 'crop' | 'blur' | 'mirror' | 'fit';

export interface PresetConfig {
  key: PresetKey;
  name: string;
  description: string;
  icon: string;
  weights: {
    visualActivity: number;
    actionScore: number;
    audioEnergy: number;
    speechScore: number;
    facePresence: number;
    sceneImportance: number;
    hookStrength: number;
  };
  defaultDuration: number;
  prioritizeHook: boolean;
  minMotionThreshold: number;
}

export interface VideoMetadata {
  filename: string;
  filepath: string;
  duration: number; // in seconds
  width: number;
  height: number;
  fps: number;
  codec: string;
  audioCodec?: string;
  bitrate?: number;
  audioSampleRate?: number;
  sizeBytes: number;
}

export interface Project {
  id: string;
  userId?: string;
  name: string;
  sourceType: SourceType;
  sourceUrl?: string;
  sourceStoragePath?: string;
  duration: number;
  width: number;
  height: number;
  fps: number;
  preset: PresetKey;
  targetDuration: number;
  aspectRatio: AspectRatio;
  resolution: Resolution;
  status: ProjectStatus;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface SourceVideo {
  id: string;
  projectId: string;
  storagePath: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  duration: number;
  width: number;
  height: number;
  fps: number;
  codec: string;
  audioCodec?: string;
  bitrate?: number;
  audioSampleRate?: number;
  createdAt: string;
}

export interface Scene {
  id: string;
  projectId: string;
  startTime: number;
  endTime: number;
  motionScore: number;
  audioScore: number;
  actionScore: number;
  faceScore: number;
  saliencyScore: number;
  sceneScore: number;
  metadata?: {
    avgLuminance?: number;
    cutConfidence?: number;
    colorVariety?: number;
    isKeyTransition?: boolean;
    nvidiaVision?: {
      tags: string[];
      summary: string;
      dramaScore: number;
      semanticAction: number;
    };
    [key: string]: unknown;
  };
  createdAt: string;
}

export interface ClipScoreBreakdown {
  overall: number;
  action: number;
  hook: number;
  visual: number;
  audio: number;
}

export interface Clip {
  id: string;
  projectId: string;
  sceneStart: number;
  sceneEnd: number;
  duration: number;
  score: number;
  hookScore: number;
  actionScore: number;
  status: 'ready' | 'queued' | 'rendering' | 'rendered' | 'failed';
  thumbnailPath?: string;
  outputPath?: string;
  captionPath?: string;
  reason?: string;
  scores?: ClipScoreBreakdown;
  createdAt: string;
}

export interface TextOverlay {
  id: string;
  text: string;
  startTime: number;
  endTime: number;
  xPercent: number;
  yPercent: number;
  fontSize: number;
  color: string;
  backgroundColor?: string;
  animation?: 'none' | 'pop' | 'fade' | 'glitch';
}

export interface CaptionStyle {
  style: 'clean' | 'anime' | 'hype' | 'minimal' | 'karaoke';
  fontSize: number;
  color: string;
  outlineColor: string;
  outlineWidth: number;
  position: 'bottom' | 'center' | 'top';
  maxWordsPerLine?: number;
}

export interface ClipEdit {
  id: string;
  clipId: string;
  trimStart: number;
  trimEnd: number;
  cropMode: CropMode;
  cropX: number; // 0 - 100 center percentage
  cropY: number;
  cropScale: number; // 1.0 - 2.0
  speed: number; // 0.25 - 4.0
  rotation: 0 | 90 | 180 | 270;
  effects: {
    shake: boolean;
    flash: boolean;
    vignette: boolean;
    blur: boolean;
    contrast: number; // 0.5 - 2.0
    saturation: number; // 0.0 - 2.0
    brightness: number; // -0.5 - 0.5
  };
  captionStyle: CaptionStyle;
  textOverlays: TextOverlay[];
  audioSettings: {
    videoVolume: number; // 0 - 200%
    musicVolume: number; // 0 - 200%
    sfxVolume: number;
    musicPath?: string;
    musicOffset?: number;
  };
  updatedAt: string;
}

export type JobType = 'analysis' | 'clip_render';

export type JobStage = 
  | 'queued'
  | 'probing_media'
  | 'detecting_scenes'
  | 'analyzing_motion'
  | 'analyzing_audio'
  | 'transcribing'
  | 'scoring_candidates'
  | 'selecting_clips'
  | 'reframing'
  | 'generating_captions'
  | 'rendering_video'
  | 'validating_output'
  | 'completed'
  | 'failed';

export interface RenderJob {
  id: string;
  projectId: string;
  clipId?: string;
  jobType?: JobType;
  stage: JobStage;
  progress: number; // 0 - 100
  status: 'queued' | 'running' | 'completed' | 'failed' | 'retrying';
  workerId?: string;
  payload?: Record<string, unknown>;
  attempts?: number;
  message?: string;
  error?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
}

export interface SystemCapabilities {
  ffmpeg: {
    available: boolean;
    version?: string;
    path?: string;
    hardwareAccel?: string[];
    statusRating?: 'available' | 'limited' | 'unavailable';
  };
  ffprobe: {
    available: boolean;
    version?: string;
    path?: string;
    statusRating?: 'available' | 'limited' | 'unavailable';
  };
  worker: {
    available: boolean;
    mode: 'dedicated' | 'inline' | 'none';
    status: 'available' | 'idle' | 'not_running';
    message: string;
    statusRating: 'available' | 'limited' | 'unavailable';
  };
  transcription: {
    available: boolean;
    provider: string;
    status: 'connected' | 'not_configured' | 'mock';
    message: string;
    statusRating: 'available' | 'limited' | 'unavailable';
  };
  visionAI: {
    available: boolean;
    provider: string;
    status: 'connected' | 'not_configured' | 'fallback_motion';
    message: string;
    statusRating: 'available' | 'limited' | 'unavailable';
  };
  storage: {
    available: boolean;
    type: 'supabase' | 'local';
    path: string;
    statusRating: 'available' | 'limited' | 'unavailable';
  };
  database: {
    available: boolean;
    type: 'supabase' | 'local_persistent';
    message: string;
    statusRating: 'available' | 'limited' | 'unavailable';
  };
  urlImport: {
    directVideoUrl: 'supported';
    officialPlatforms: 'limited';
    unsupportedDrm: 'unsupported';
    statusRating: 'available' | 'limited' | 'unavailable';
  };
}

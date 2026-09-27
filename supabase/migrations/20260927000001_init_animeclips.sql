-- ==============================================================================
-- AnimeClips AI - Supabase Database Schema & RLS Policies
-- ==============================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. PROJECTS TABLE
create table if not exists public.projects (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null default 'Untitled Project',
  source_type text not null default 'upload' check (source_type in ('upload', 'url', 'sample')),
  source_url text,
  source_storage_path text,
  duration numeric(10, 3) default 0,
  width integer default 1920,
  height integer default 1080,
  fps numeric(6, 2) default 24.0,
  preset text not null default 'animeAction' check (preset in ('animeAction', 'animeEmotional', 'animeHype', 'dialogue', 'generalViral')),
  target_duration integer not null default 30 check (target_duration in (10, 15, 20, 30, 45, 60)),
  aspect_ratio text not null default '9:16' check (aspect_ratio in ('9:16', '16:9', '1:1')),
  resolution text not null default '1080x1920' check (resolution in ('1080x1920', '720x1280')),
  status text not null default 'draft' check (status in ('draft', 'uploading', 'queued', 'analyzing', 'selecting', 'rendering', 'completed', 'failed')),
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. SOURCE VIDEOS TABLE
create table if not exists public.source_videos (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references public.projects(id) on delete cascade,
  storage_path text not null,
  filename text not null,
  mime_type text not null default 'video/mp4',
  size_bytes bigint not null default 0,
  duration numeric(10, 3) not null default 0,
  width integer not null default 1920,
  height integer not null default 1080,
  fps numeric(6, 2) not null default 24.0,
  codec text not null default 'h264',
  audio_codec text default 'aac',
  bitrate bigint default 0,
  audio_sample_rate integer default 48000,
  created_at timestamptz not null default now()
);

-- 3. SCENES TABLE
create table if not exists public.scenes (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references public.projects(id) on delete cascade,
  start_time numeric(10, 3) not null,
  end_time numeric(10, 3) not null,
  motion_score numeric(5, 2) default 0,
  audio_score numeric(5, 2) default 0,
  action_score numeric(5, 2) default 0,
  face_score numeric(5, 2) default 0,
  saliency_score numeric(5, 2) default 0,
  scene_score numeric(5, 2) default 0,
  metadata_json jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- 4. CLIPS TABLE
create table if not exists public.clips (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references public.projects(id) on delete cascade,
  scene_start numeric(10, 3) not null,
  scene_end numeric(10, 3) not null,
  duration numeric(10, 3) not null,
  score numeric(5, 2) default 0,
  hook_score numeric(5, 2) default 0,
  action_score numeric(5, 2) default 0,
  status text not null default 'ready' check (status in ('ready', 'queued', 'rendering', 'rendered', 'failed')),
  thumbnail_path text,
  output_path text,
  caption_path text,
  reason text,
  created_at timestamptz not null default now()
);

-- 5. CLIP EDITS TABLE
create table if not exists public.clip_edits (
  id uuid primary key default uuid_generate_v4(),
  clip_id uuid not null unique references public.clips(id) on delete cascade,
  trim_start numeric(10, 3) default 0,
  trim_end numeric(10, 3) default 0,
  crop_mode text default 'crop' check (crop_mode in ('crop', 'blur', 'mirror', 'fit')),
  crop_x numeric(5, 2) default 50.0,
  crop_y numeric(5, 2) default 50.0,
  crop_scale numeric(5, 2) default 1.0,
  speed numeric(4, 2) default 1.0,
  rotation integer default 0 check (rotation in (0, 90, 180, 270)),
  effects_json jsonb default '{"shake": false, "flash": false, "vignette": false, "contrast": 1.0, "saturation": 1.0}'::jsonb,
  caption_style_json jsonb default '{"style": "anime", "fontSize": 28, "color": "#FFFFFF", "outlineColor": "#000000", "outlineWidth": 3, "position": "bottom"}'::jsonb,
  text_overlays_json jsonb default '[]'::jsonb,
  audio_settings_json jsonb default '{"videoVolume": 100, "musicVolume": 50, "sfxVolume": 80}'::jsonb,
  updated_at timestamptz not null default now()
);

-- 6. RENDER JOBS TABLE
create table if not exists public.render_jobs (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references public.projects(id) on delete cascade,
  clip_id uuid references public.clips(id) on delete set null,
  stage text not null default 'queued' check (stage in (
    'queued', 'probing_media', 'detecting_scenes', 'analyzing_motion', 
    'analyzing_audio', 'transcribing', 'scoring_candidates', 
    'selecting_clips', 'reframing', 'generating_captions', 
    'rendering_video', 'validating_output', 'completed', 'failed'
  )),
  progress integer not null default 0 check (progress >= 0 and progress <= 100),
  status text not null default 'queued' check (status in ('queued', 'running', 'completed', 'failed', 'retrying')),
  message text,
  error text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

-- INDEXES
create index if not exists idx_projects_user_id on public.projects(user_id);
create index if not exists idx_scenes_project_id on public.scenes(project_id);
create index if not exists idx_clips_project_id on public.clips(project_id);
create index if not exists idx_render_jobs_project_id on public.render_jobs(project_id);
create index if not exists idx_render_jobs_status on public.render_jobs(status);

-- ROW LEVEL SECURITY (RLS)
alter table public.projects enable row level security;
alter table public.source_videos enable row level security;
alter table public.scenes enable row level security;
alter table public.clips enable row level security;
alter table public.clip_edits enable row level security;
alter table public.render_jobs enable row level security;

-- RLS POLICIES FOR PROJECTS
create policy "Users can view their own projects" 
  on public.projects for select 
  using (auth.uid() = user_id or user_id is null);

create policy "Users can create their own projects" 
  on public.projects for insert 
  with check (auth.uid() = user_id or user_id is null);

create policy "Users can update their own projects" 
  on public.projects for update 
  using (auth.uid() = user_id or user_id is null);

create policy "Users can delete their own projects" 
  on public.projects for delete 
  using (auth.uid() = user_id or user_id is null);

-- RLS POLICIES FOR SOURCE VIDEOS
create policy "Users can manage source videos of their projects"
  on public.source_videos for all
  using (exists (select 1 from public.projects where projects.id = source_videos.project_id and (projects.user_id = auth.uid() or projects.user_id is null)));

-- RLS POLICIES FOR SCENES
create policy "Users can view scenes of their projects"
  on public.scenes for select
  using (exists (select 1 from public.projects where projects.id = scenes.project_id and (projects.user_id = auth.uid() or projects.user_id is null)));

-- RLS POLICIES FOR CLIPS
create policy "Users can manage clips of their projects"
  on public.clips for all
  using (exists (select 1 from public.projects where projects.id = clips.project_id and (projects.user_id = auth.uid() or projects.user_id is null)));

-- RLS POLICIES FOR CLIP EDITS
create policy "Users can manage clip edits of their clips"
  on public.clip_edits for all
  using (exists (
    select 1 from public.clips 
    join public.projects on projects.id = clips.project_id
    where clips.id = clip_edits.clip_id and (projects.user_id = auth.uid() or projects.user_id is null)
  ));

-- RLS POLICIES FOR RENDER JOBS
create policy "Users can manage render jobs of their projects"
  on public.render_jobs for all
  using (exists (select 1 from public.projects where projects.id = render_jobs.project_id and (projects.user_id = auth.uid() or projects.user_id is null)));

-- STORAGE BUCKETS SETUP
insert into storage.buckets (id, name, public) 
values 
  ('source-videos', 'source-videos', false),
  ('thumbnails', 'thumbnails', true),
  ('generated-clips', 'generated-clips', true),
  ('captions', 'captions', false),
  ('music', 'music', false),
  ('sfx', 'sfx', false)
on conflict (id) do nothing;

-- ==============================================================================
-- AnimeClips AI - Worker Job Claiming & Production Media Pipeline Migration
-- ==============================================================================

-- 1. ADD WORKER-SPECIFIC COLUMNS TO RENDER_JOBS
alter table public.render_jobs 
  add column if not exists job_type text not null default 'analysis' check (job_type in ('analysis', 'clip_render')),
  add column if not exists worker_id text,
  add column if not exists payload jsonb default '{}'::jsonb,
  add column if not exists attempts integer default 0;

-- 2. CREATE INDEX FOR FAST ATOMIC QUEUE QUERYING
create index if not exists idx_render_jobs_queue on public.render_jobs (status, created_at) where status = 'queued';

-- 3. ATOMIC WORKER JOB CLAIMING FUNCTION WITH ROW-LEVEL LOCKING
-- Prevents race conditions and duplicate processing across concurrent workers
create or replace function public.claim_next_render_job(worker_id_param text)
returns setof public.render_jobs
language plpgsql
security definer
as $$
declare
  claimed_job public.render_jobs;
begin
  -- Select the oldest queued job with FOR UPDATE SKIP LOCKED
  select * into claimed_job
  from public.render_jobs
  where status = 'queued'
  order by created_at asc
  limit 1
  for update skip locked;

  -- If a job was acquired, atomically mark it as running and assign to worker
  if claimed_job.id is not null then
    update public.render_jobs
    set 
      status = 'running',
      stage = 'probing_media',
      progress = 5,
      worker_id = worker_id_param,
      started_at = coalesce(started_at, now()),
      attempts = coalesce(attempts, 0) + 1,
      message = 'Claimed by media worker ' || worker_id_param
    where id = claimed_job.id
    returning * into claimed_job;

    return next claimed_job;
  end if;

  return;
end;
$$;

-- 4. STORAGE ACCESS POLICIES
-- Ensure authenticated users can upload and read their own media objects
create policy if not exists "Allow authenticated uploads to source-videos"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'source-videos');

create policy if not exists "Allow public read of thumbnails"
  on storage.objects for select
  to public
  using (bucket_id = 'thumbnails');

create policy if not exists "Allow public read of generated-clips"
  on storage.objects for select
  to public
  using (bucket_id = 'generated-clips');

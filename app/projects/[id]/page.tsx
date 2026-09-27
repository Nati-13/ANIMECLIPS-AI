'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Film,
  Sparkles,
  Play,
  Scissors,
  Download,
  Trash2,
  Clock,
  Layers,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Eye,
  Sliders,
  X,
  Swords,
  Flame,
  Plus,
} from 'lucide-react';
import { Project, Clip, Scene, RenderJob } from '@/types';
import { formatDuration } from '@/lib/utils';

export default function ProjectDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const projectId = resolvedParams.id;
  const router = useRouter();

  const [project, setProject] = useState<Project | null>(null);
  const [clips, setClips] = useState<Clip[]>([]);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [activeJob, setActiveJob] = useState<RenderJob | null>(null);
  const [loading, setLoading] = useState(true);

  // Preview Modal
  const [previewClip, setPreviewClip] = useState<Clip | null>(null);
  const [renderingClipId, setRenderingClipId] = useState<string | null>(null);

  // Manual Clip Modal
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualStart, setManualStart] = useState('0');
  const [manualEnd, setManualEnd] = useState('15');

  // Fetch Project Data
  const fetchData = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}`);
      if (!res.ok) return;
      const data = await res.json();
      setProject(data.project);
      setClips(data.clips || []);
      setScenes(data.scenes || []);

      if (data.jobs && data.jobs.length > 0) {
        const latest = data.jobs[0];
        setActiveJob(latest);
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Auto-poll if job is running
    const interval = setInterval(() => {
      fetchData();
    }, 2000);

    return () => clearInterval(interval);
  }, [projectId]);

  // Handle Render Clip
  const handleRenderClip = async (clipId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setRenderingClipId(clipId);

    try {
      const res = await fetch(`/api/clips/${clipId}/render`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Render failed');
      } else {
        await fetchData();
      }
    } catch (err: unknown) {
      alert(`Render error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setRenderingClipId(null);
    }
  };

  // Handle Render All
  const handleRenderAll = async () => {
    const unrendered = clips.filter((c) => c.status !== 'rendered');
    for (const c of unrendered) {
      await handleRenderClip(c.id);
    }
  };

  // Handle Manual Clip Creation
  const handleCreateManualClip = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/projects/${projectId}/clips`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'manual',
          startTime: parseFloat(manualStart),
          endTime: parseFloat(manualEnd),
        }),
      });
      if (res.ok) {
        setShowManualModal(false);
        await fetchData();
      }
    } catch {
      alert('Failed to create manual clip');
    }
  };

  // Handle Delete Clip
  const handleDeleteClip = async (clipId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this clip?')) return;
    try {
      await fetch(`/api/clips/${clipId}`, { method: 'DELETE' });
      await fetchData();
    } catch {
      alert('Failed to delete clip');
    }
  };

  if (loading && !project) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-cyan" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center space-y-4">
        <AlertCircle className="h-10 w-10 text-red-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">Project Not Found</h2>
        <Link href="/dashboard" className="text-xs text-brand-cyan underline">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const isAnalyzing = activeJob && activeJob.status === 'running';

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-brand-cyan/10 border border-brand-cyan/30 px-2.5 py-0.5 text-[10px] font-bold text-brand-cyan uppercase">
              {project.preset}
            </span>
            <span className="text-xs text-slate-500 font-mono">
              {project.aspectRatio} Vertical • {project.resolution}
            </span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-white">
            {project.name}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowManualModal(true)}
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-surface-100 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:bg-surface-200"
          >
            <Plus className="h-4 w-4" />
            Create Manual Clip
          </button>

          {clips.length > 0 && (
            <button
              onClick={handleRenderAll}
              disabled={Boolean(isAnalyzing)}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-cyan to-brand-purple px-4 py-2.5 text-xs font-bold text-[#090a10] shadow-neon hover:opacity-95 disabled:opacity-50"
            >
              <Sparkles className="h-4 w-4" />
              Render All Shorts
            </button>
          )}
        </div>
      </div>

      {/* ANALYSIS PIPELINE STATUS VISUALIZER (Requirement #34, #54) */}
      {activeJob && (
        <div className="rounded-2xl border border-white/10 bg-surface-50 p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-3">
            <div className="flex items-center gap-2">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  activeJob.status === 'running'
                    ? 'bg-brand-cyan animate-pulse shadow-[0_0_8px_#00f0ff]'
                    : activeJob.status === 'completed'
                    ? 'bg-emerald-400'
                    : 'bg-red-400'
                }`}
              />
              <span className="font-mono text-xs font-bold uppercase text-white">
                Pipeline Stage: {activeJob.stage.replace(/_/g, ' ')}
              </span>
            </div>
            <span className="font-mono text-xs text-brand-cyan font-bold">
              {activeJob.progress}% Progress
            </span>
          </div>

          <div className="w-full bg-surface-200 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-brand-cyan via-brand-purple to-brand-magenta h-full transition-all duration-500"
              style={{ width: `${activeJob.progress}%` }}
            />
          </div>

          <p className="text-xs text-slate-400 font-mono flex items-center gap-2">
            {activeJob.status === 'running' && <Loader2 className="h-3.5 w-3.5 animate-spin text-brand-cyan" />}
            {activeJob.message || 'Processing video streams...'}
          </p>

          {/* Pipeline flow pills */}
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 pt-2 text-[10px] font-mono text-center">
            {['probing_media', 'detecting_scenes', 'analyzing_motion', 'analyzing_audio', 'scoring_candidates', 'completed'].map((st) => {
              const stages = ['probing_media', 'detecting_scenes', 'analyzing_motion', 'analyzing_audio', 'scoring_candidates', 'completed'];
              const currentIdx = stages.indexOf(activeJob.stage);
              const thisIdx = stages.indexOf(st);
              const isPast = thisIdx <= currentIdx;
              return (
                <div
                  key={st}
                  className={`rounded-lg py-1.5 px-2 border ${
                    isPast
                      ? 'border-brand-cyan/40 bg-brand-cyan/10 text-brand-cyan font-bold'
                      : 'border-white/5 bg-surface-100 text-slate-500'
                  }`}
                >
                  {st.replace(/_/g, ' ').toUpperCase()}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ANALYSIS SUMMARY STATS (Requirement #69) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <div className="rounded-xl border border-white/5 bg-surface-50 p-4 font-mono">
          <span className="text-[10px] text-slate-500 uppercase block">Video Length</span>
          <span className="text-lg font-bold text-white">{formatDuration(project.duration)}</span>
        </div>
        <div className="rounded-xl border border-white/5 bg-surface-50 p-4 font-mono">
          <span className="text-[10px] text-slate-500 uppercase block">Scenes Detected</span>
          <span className="text-lg font-bold text-brand-cyan">{scenes.length}</span>
        </div>
        <div className="rounded-xl border border-white/5 bg-surface-50 p-4 font-mono">
          <span className="text-[10px] text-slate-500 uppercase block">Target Duration</span>
          <span className="text-lg font-bold text-white">{project.targetDuration}s</span>
        </div>
        <div className="rounded-xl border border-white/5 bg-surface-50 p-4 font-mono">
          <span className="text-[10px] text-slate-500 uppercase block">Selected Clips</span>
          <span className="text-lg font-bold text-brand-magenta">{clips.length}</span>
        </div>
        <div className="rounded-xl border border-white/5 bg-surface-50 p-4 font-mono">
          <span className="text-[10px] text-slate-500 uppercase block">Rendered Ready</span>
          <span className="text-lg font-bold text-emerald-400">
            {clips.filter((c) => c.status === 'rendered').length} / {clips.length}
          </span>
        </div>
      </div>

      {/* SHORTS LIST / GRID (Requirement #32) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-white flex items-center gap-2">
            <Film className="h-5 w-5 text-brand-cyan" />
            Generated Short Clips ({clips.length})
          </h2>
          <span className="text-xs text-slate-400">
            Sorted by Multi-Signal Content Score
          </span>
        </div>

        {clips.length === 0 ? (
          <div className="flex min-h-[250px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-surface-50/50 p-8 text-center space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-brand-cyan" />
            <h3 className="text-sm font-bold text-white">Analyzing video footage...</h3>
            <p className="text-xs text-slate-400 max-w-sm">
              FFmpeg is scanning for cuts and motion peaks. Candidate clips will appear here shortly.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clips.map((clip, idx) => (
              <div
                key={clip.id}
                className="rounded-2xl border border-white/10 bg-surface-50 overflow-hidden flex flex-col justify-between hover:border-brand-cyan/30 transition-all shadow-md"
              >
                {/* Thumbnail / Video Preview Area */}
                <div
                  onClick={() => setPreviewClip(clip)}
                  className="relative aspect-video bg-black cursor-pointer group flex items-center justify-center overflow-hidden"
                >
                  {clip.thumbnailPath ? (
                    <img
                      src={clip.thumbnailPath}
                      alt="Clip Thumbnail"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-600 gap-1">
                      <Film className="h-8 w-8" />
                      <span className="text-[10px] font-mono">16:9 Source Segment</span>
                    </div>
                  )}

                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="h-12 w-12 rounded-full bg-brand-cyan/80 flex items-center justify-center text-[#090a10] shadow-neon">
                      <Play className="h-5 w-5 fill-current ml-0.5" />
                    </div>
                  </div>

                  {/* Top badges */}
                  <div className="absolute top-2 left-2 flex items-center gap-1.5">
                    <span className="rounded bg-black/70 px-2 py-0.5 font-mono text-[10px] text-white">
                      Clip #{String(idx + 1).padStart(2, '0')}
                    </span>
                    <span className="rounded bg-brand-cyan/20 border border-brand-cyan/30 px-1.5 py-0.5 font-mono text-[10px] text-brand-cyan font-bold">
                      Score: {clip.score}
                    </span>
                  </div>

                  <div className="absolute bottom-2 right-2 rounded bg-black/80 px-2 py-0.5 font-mono text-[10px] text-white">
                    {formatDuration(clip.duration)}
                  </div>
                </div>

                {/* Clip Metadata & Score Breakdown */}
                <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                      <span>{formatDuration(clip.sceneStart)} → {formatDuration(clip.sceneEnd)}</span>
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                          clip.status === 'rendered'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : clip.status === 'rendering'
                            ? 'bg-yellow-500/10 text-yellow-400 animate-pulse'
                            : 'bg-slate-500/10 text-slate-400'
                        }`}
                      >
                        {clip.status.toUpperCase()}
                      </span>
                    </div>

                    {/* Algorithmic Reason (Requirement #70) */}
                    <p className="text-xs text-slate-300 font-medium line-clamp-2">
                      {clip.reason || 'High motion scene with dynamic transition'}
                    </p>

                    {/* Score Bar Breakdown (Requirement #55) */}
                    {clip.scores && (
                      <div className="grid grid-cols-4 gap-1 text-center font-mono text-[10px]">
                        <div className="rounded bg-surface-100 p-1">
                          <span className="text-slate-500 block text-[9px]">ACTION</span>
                          <span className="text-brand-cyan font-bold">{clip.scores.action}</span>
                        </div>
                        <div className="rounded bg-surface-100 p-1">
                          <span className="text-slate-500 block text-[9px]">HOOK</span>
                          <span className="text-brand-magenta font-bold">{clip.scores.hook}</span>
                        </div>
                        <div className="rounded bg-surface-100 p-1">
                          <span className="text-slate-500 block text-[9px]">VISUAL</span>
                          <span className="text-brand-purple font-bold">{clip.scores.visual}</span>
                        </div>
                        <div className="rounded bg-surface-100 p-1">
                          <span className="text-slate-500 block text-[9px]">AUDIO</span>
                          <span className="text-emerald-400 font-bold">{clip.scores.audio}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="border-t border-white/5 pt-3 flex items-center justify-between gap-2">
                    <Link
                      href={`/editor/${projectId}?clipId=${clip.id}`}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-surface-100 py-2 text-xs font-semibold text-slate-200 hover:bg-surface-200"
                    >
                      <Scissors className="h-3.5 w-3.5 text-brand-cyan" />
                      Edit
                    </Link>

                    {clip.status === 'rendered' && clip.outputPath ? (
                      <a
                        href={clip.outputPath}
                        download={`animeclip_${clip.id}.mp4`}
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/30"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Download
                      </a>
                    ) : (
                      <button
                        onClick={(e) => handleRenderClip(clip.id, e)}
                        disabled={renderingClipId === clip.id}
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-brand-cyan py-2 text-xs font-bold text-[#090a10] hover:bg-brand-cyan/90 disabled:opacity-50"
                      >
                        {renderingClipId === clip.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Sparkles className="h-3.5 w-3.5" />
                        )}
                        Render 9:16
                      </button>
                    )}

                    <button
                      onClick={(e) => handleDeleteClip(clip.id, e)}
                      title="Delete"
                      className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-white/5"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* VIDEO PREVIEW MODAL */}
      {previewClip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-surface-50 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="space-y-0.5">
                <h3 className="font-bold text-white text-base">
                  Preview Clip ({formatDuration(previewClip.duration)})
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  {formatDuration(previewClip.sceneStart)} → {formatDuration(previewClip.sceneEnd)}
                </p>
              </div>
              <button
                onClick={() => setPreviewClip(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="aspect-[9/16] max-h-[60vh] mx-auto rounded-xl overflow-hidden bg-black border border-white/10">
              <video
                src={previewClip.outputPath || '/api/media/samples/anime_action_demo.mp4'}
                controls
                autoPlay
                className="w-full h-full object-contain"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-400">
                {previewClip.status === 'rendered' ? 'Full 9:16 Rendered Output' : 'Pre-render Source Preview'}
              </span>

              <div className="flex gap-2">
                <Link
                  href={`/editor/${projectId}?clipId=${previewClip.id}`}
                  className="rounded-xl border border-white/10 bg-surface-100 px-4 py-2 text-xs font-semibold text-white"
                >
                  Open in Editor
                </Link>
                {previewClip.status !== 'rendered' && (
                  <button
                    onClick={() => {
                      handleRenderClip(previewClip.id);
                      setPreviewClip(null);
                    }}
                    className="rounded-xl bg-brand-cyan px-4 py-2 text-xs font-bold text-[#090a10]"
                  >
                    Render Now
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE MANUAL CLIP MODAL (Requirement #74) */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <form
            onSubmit={handleCreateManualClip}
            className="w-full max-w-md rounded-2xl border border-white/10 bg-surface-50 p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-bold text-white text-base">Create Manual Custom Clip</h3>
              <button
                type="button"
                onClick={() => setShowManualModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Select custom start and end timestamps from the source video to manually create a short.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Start (seconds)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max={project.duration}
                  value={manualStart}
                  onChange={(e) => setManualStart(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-surface-100 px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">End (seconds)</label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  max={project.duration}
                  value={manualEnd}
                  onChange={(e) => setManualEnd(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-surface-100 px-3 py-2 text-xs text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowManualModal(false)}
                className="rounded-xl border border-white/10 px-4 py-2 text-xs font-semibold text-slate-400"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-xl bg-brand-cyan px-5 py-2 text-xs font-bold text-[#090a10]"
              >
                Add Clip
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

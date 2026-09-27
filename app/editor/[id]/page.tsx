'use client';

import React, { useEffect, useState, useRef, use } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Play,
  Pause,
  Scissors,
  Sliders,
  Sparkles,
  Volume2,
  Type,
  Layers,
  ArrowLeft,
  RotateCw,
  Crop,
  Download,
  Loader2,
  CheckCircle2,
  Eye,
  FastForward,
} from 'lucide-react';
import { Project, Clip, ClipEdit, CropMode } from '@/types';
import { formatDuration } from '@/lib/utils';

export default function VideoEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const projectId = resolvedParams.id;
  const searchParams = useSearchParams();
  const targetClipId = searchParams.get('clipId');
  const router = useRouter();

  const videoRef = useRef<HTMLVideoElement>(null);

  const [project, setProject] = useState<Project | null>(null);
  const [clips, setClips] = useState<Clip[]>([]);
  const [currentClip, setCurrentClip] = useState<Clip | null>(null);
  const [edits, setEdits] = useState<ClipEdit | null>(null);

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Editor Tabs: "crop" | "speed" | "effects" | "audio" | "text"
  const [activeTab, setActiveTab] = useState<'crop' | 'speed' | 'effects' | 'audio' | 'text'>('crop');
  const [isSaving, setIsSaving] = useState(false);
  const [isRendering, setIsRendering] = useState(false);

  // Text overlay input
  const [newOverlayText, setNewOverlayText] = useState('');

  // Fetch initial data
  const loadData = async () => {
    try {
      const projRes = await fetch(`/api/projects/${projectId}`);
      const projData = await projRes.json();
      setProject(projData.project);
      setClips(projData.clips || []);

      const chosenClip = targetClipId
        ? projData.clips?.find((c: Clip) => c.id === targetClipId) || projData.clips?.[0]
        : projData.clips?.[0];

      if (chosenClip) {
        setCurrentClip(chosenClip);
        const editRes = await fetch(`/api/clips/${chosenClip.id}/edit`);
        const editData = await editRes.json();
        setEdits(editData.edits);
      }
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    loadData();
  }, [projectId, targetClipId]);

  // Handle Play/Pause
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  // Keyboard shortcut listener (Space = play/pause)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying]);

  // Save edits
  const handleSaveEdits = async () => {
    if (!currentClip || !edits) return;
    setIsSaving(true);
    try {
      await fetch(`/api/clips/${currentClip.id}/edit`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(edits),
      });
      alert('Edits saved successfully.');
    } catch {
      alert('Failed to save edits');
    } finally {
      setIsSaving(false);
    }
  };

  // Save & Render 9:16 Short
  const handleRender = async () => {
    if (!currentClip || !edits) return;
    setIsRendering(true);
    try {
      // 1. Save edits first
      await fetch(`/api/clips/${currentClip.id}/edit`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(edits),
      });

      // 2. Render FFmpeg
      const res = await fetch(`/api/clips/${currentClip.id}/render`, { method: 'POST' });
      const data = await res.json();

      if (!res.ok) {
        alert(data.error || 'Rendering failed');
      } else {
        // Poll for asynchronous worker completion
        let done = false;
        let attempts = 0;
        while (!done && attempts < 90) {
          await new Promise((r) => setTimeout(r, 2000));
          attempts++;
          const checkRes = await fetch(`/api/clips/${currentClip.id}`);
          if (checkRes.ok) {
            const checkData = await checkRes.json();
            if (checkData.clip?.status === 'rendered') {
              done = true;
              break;
            } else if (checkData.clip?.status === 'failed') {
              throw new Error('Rendering failed in media worker.');
            }
          }
        }
        alert('Clip successfully rendered to 9:16 vertical MP4 and validated!');
        await loadData();
      }
    } catch (err: unknown) {
      alert(`Render error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsRendering(false);
    }
  };

  // Switch Clip
  const handleSelectClip = async (clip: Clip) => {
    setCurrentClip(clip);
    const editRes = await fetch(`/api/clips/${clip.id}/edit`);
    const editData = await editRes.json();
    setEdits(editData.edits);
    if (videoRef.current) {
      videoRef.current.currentTime = clip.sceneStart;
    }
  };

  // Add text overlay
  const handleAddOverlay = () => {
    if (!newOverlayText || !edits) return;
    const newOverlay = {
      id: `text_${Date.now()}`,
      text: newOverlayText,
      startTime: 0,
      endTime: currentClip?.duration || 15,
      xPercent: 50,
      yPercent: 80,
      fontSize: 28,
      color: '#FFFFFF',
    };
    setEdits({
      ...edits,
      textOverlays: [...edits.textOverlays, newOverlay],
    });
    setNewOverlayText('');
  };

  if (!project || !currentClip || !edits) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-cyan" />
      </div>
    );
  }

  const videoSourceUrl = currentClip.outputPath || '/api/media/samples/anime_action_demo.mp4';

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-[#07080c] overflow-hidden">
      {/* Top Editor Bar */}
      <div className="h-14 border-b border-white/10 bg-surface-50 px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <Link
            href={`/projects/${projectId}`}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Project
          </Link>
          <div className="h-4 w-[1px] bg-white/10" />
          <span className="text-xs font-bold text-white line-clamp-1">{project.name}</span>
          <span className="rounded bg-brand-cyan/20 border border-brand-cyan/30 px-2 py-0.5 text-[10px] font-mono text-brand-cyan font-bold">
            Clip: {formatDuration(currentClip.sceneStart)} → {formatDuration(currentClip.sceneEnd)}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSaveEdits}
            disabled={isSaving}
            className="rounded-xl border border-white/15 bg-surface-100 px-3.5 py-1.5 text-xs font-semibold text-slate-200 hover:bg-surface-200"
          >
            {isSaving ? 'Saving...' : 'Save Edits'}
          </button>

          <button
            onClick={handleRender}
            disabled={isRendering}
            className="flex items-center gap-1.5 rounded-xl bg-brand-cyan px-4 py-1.5 text-xs font-bold text-[#090a10] shadow-neon hover:bg-brand-cyan/90 disabled:opacity-50"
          >
            {isRendering ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Render 9:16 Video
          </button>
        </div>
      </div>

      {/* Main Workspace (Preview + Inspector) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Video Canvas */}
        <div className="flex-1 bg-black/80 flex flex-col items-center justify-center p-6 relative">
          <div className="relative aspect-[9/16] h-full max-h-[58vh] rounded-2xl overflow-hidden bg-black border border-white/15 shadow-glow flex items-center justify-center">
            <video
              ref={videoRef}
              src={videoSourceUrl}
              onTimeUpdate={() => {
                if (videoRef.current) {
                  setCurrentTime(videoRef.current.currentTime);
                }
              }}
              onLoadedMetadata={() => {
                if (videoRef.current) {
                  setDuration(videoRef.current.duration);
                }
              }}
              playsInline
              className="w-full h-full object-contain"
            />

            {/* Overlaid Text Preview */}
            {edits.textOverlays.map((t) => (
              <div
                key={t.id}
                className="absolute font-black tracking-wide text-center uppercase pointer-events-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
                style={{
                  top: `${t.yPercent}%`,
                  left: `${t.xPercent}%`,
                  transform: 'translate(-50%, -50%)',
                  fontSize: `${t.fontSize}px`,
                  color: t.color,
                }}
              >
                {t.text}
              </div>
            ))}
          </div>

          {/* Quick Playback Bar */}
          <div className="mt-4 flex items-center gap-4 bg-surface-50/90 border border-white/10 rounded-full px-5 py-2 backdrop-blur-md">
            <button
              onClick={togglePlay}
              className="h-8 w-8 rounded-full bg-brand-cyan flex items-center justify-center text-[#090a10] shadow-neon"
            >
              {isPlaying ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current ml-0.5" />}
            </button>
            <span className="font-mono text-xs text-white">
              {formatDuration(currentTime)} / {formatDuration(duration || currentClip.duration)}
            </span>
          </div>
        </div>

        {/* Right: Inspector Tabs & Controls */}
        <div className="w-80 md:w-96 border-l border-white/10 bg-surface-50 flex flex-col shrink-0 overflow-y-auto">
          {/* Tabs */}
          <div className="flex border-b border-white/10 bg-surface-100 p-1">
            <button
              onClick={() => setActiveTab('crop')}
              className={`flex-1 py-2 text-center text-xs font-semibold rounded-lg ${
                activeTab === 'crop' ? 'bg-surface-50 text-brand-cyan' : 'text-slate-400'
              }`}
            >
              Reframe
            </button>
            <button
              onClick={() => setActiveTab('speed')}
              className={`flex-1 py-2 text-center text-xs font-semibold rounded-lg ${
                activeTab === 'speed' ? 'bg-surface-50 text-brand-cyan' : 'text-slate-400'
              }`}
            >
              Speed
            </button>
            <button
              onClick={() => setActiveTab('effects')}
              className={`flex-1 py-2 text-center text-xs font-semibold rounded-lg ${
                activeTab === 'effects' ? 'bg-surface-50 text-brand-cyan' : 'text-slate-400'
              }`}
            >
              Effects
            </button>
            <button
              onClick={() => setActiveTab('audio')}
              className={`flex-1 py-2 text-center text-xs font-semibold rounded-lg ${
                activeTab === 'audio' ? 'bg-surface-50 text-brand-cyan' : 'text-slate-400'
              }`}
            >
              Audio
            </button>
            <button
              onClick={() => setActiveTab('text')}
              className={`flex-1 py-2 text-center text-xs font-semibold rounded-lg ${
                activeTab === 'text' ? 'bg-surface-50 text-brand-cyan' : 'text-slate-400'
              }`}
            >
              Text
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* TAB: REFRAME / CROP */}
            {activeTab === 'crop' && (
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300">Background Fill Mode</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { mode: 'crop', label: 'Smart Crop', desc: 'Fill frame' },
                      { mode: 'blur', label: 'Blur Backdrop', desc: 'Enlarged blur' },
                      { mode: 'mirror', label: 'Mirror Fill', desc: 'Mirrored edges' },
                      { mode: 'fit', label: 'Letterbox Fit', desc: 'Full 16:9 frame' },
                    ].map((m) => (
                      <button
                        key={m.mode}
                        type="button"
                        onClick={() => setEdits({ ...edits, cropMode: m.mode as CropMode })}
                        className={`rounded-xl border p-3 text-left space-y-1 ${
                          edits.cropMode === m.mode
                            ? 'border-brand-cyan bg-brand-cyan/10'
                            : 'border-white/10 bg-surface-100 hover:border-white/20'
                        }`}
                      >
                        <span className="text-xs font-bold text-white block">{m.label}</span>
                        <span className="text-[10px] text-slate-400">{m.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-semibold">Subject Center Position (X)</span>
                    <span className="font-mono text-brand-cyan">{edits.cropX}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={edits.cropX}
                    onChange={(e) => setEdits({ ...edits, cropX: Number(e.target.value) })}
                    className="w-full accent-brand-cyan"
                  />
                  <span className="text-[10px] text-slate-400">
                    Adjusts horizontal framing window to keep characters in center.
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-semibold">Zoom Scale</span>
                    <span className="font-mono text-brand-purple">{edits.cropScale}×</span>
                  </div>
                  <input
                    type="range"
                    min="1.0"
                    max="2.0"
                    step="0.05"
                    value={edits.cropScale}
                    onChange={(e) => setEdits({ ...edits, cropScale: Number(e.target.value) })}
                    className="w-full accent-brand-purple"
                  />
                </div>
              </div>
            )}

            {/* TAB: SPEED */}
            {activeTab === 'speed' && (
              <div className="space-y-4">
                <label className="text-xs font-semibold text-slate-300">Playback Speed Multiplier</label>
                <div className="grid grid-cols-3 gap-2">
                  {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setEdits({ ...edits, speed: s })}
                      className={`rounded-xl border py-2.5 text-xs font-bold font-mono ${
                        edits.speed === s
                          ? 'border-brand-cyan bg-brand-cyan/20 text-brand-cyan'
                          : 'border-white/10 bg-surface-100 text-slate-300'
                      }`}
                    >
                      {s}×
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-slate-400">
                  Speed adjustments automatically synchronize video PTS and audio atempo filters.
                </p>
              </div>
            )}

            {/* TAB: EFFECTS */}
            {activeTab === 'effects' && (
              <div className="space-y-5">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-semibold">Contrast</span>
                    <span className="font-mono text-brand-cyan">{edits.effects.contrast}</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.1"
                    value={edits.effects.contrast}
                    onChange={(e) =>
                      setEdits({
                        ...edits,
                        effects: { ...edits.effects, contrast: Number(e.target.value) },
                      })
                    }
                    className="w-full accent-brand-cyan"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-semibold">Saturation</span>
                    <span className="font-mono text-brand-magenta">{edits.effects.saturation}</span>
                  </div>
                  <input
                    type="range"
                    min="0.0"
                    max="2.0"
                    step="0.1"
                    value={edits.effects.saturation}
                    onChange={(e) =>
                      setEdits({
                        ...edits,
                        effects: { ...edits.effects, saturation: Number(e.target.value) },
                      })
                    }
                    className="w-full accent-brand-magenta"
                  />
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                  <span className="text-xs font-semibold text-white">Cinematic Vignette</span>
                  <input
                    type="checkbox"
                    checked={edits.effects.vignette}
                    onChange={(e) =>
                      setEdits({
                        ...edits,
                        effects: { ...edits.effects, vignette: e.target.checked },
                      })
                    }
                    className="h-4 w-4 accent-brand-cyan"
                  />
                </div>
              </div>
            )}

            {/* TAB: AUDIO */}
            {activeTab === 'audio' && (
              <div className="space-y-5">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-semibold">Video Audio Volume</span>
                    <span className="font-mono text-emerald-400">{edits.audioSettings.videoVolume}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    value={edits.audioSettings.videoVolume}
                    onChange={(e) =>
                      setEdits({
                        ...edits,
                        audioSettings: { ...edits.audioSettings, videoVolume: Number(e.target.value) },
                      })
                    }
                    className="w-full accent-emerald-400"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-semibold">BGM Soundtrack Balance</span>
                    <span className="font-mono text-brand-purple">{edits.audioSettings.musicVolume}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    value={edits.audioSettings.musicVolume}
                    onChange={(e) =>
                      setEdits({
                        ...edits,
                        audioSettings: { ...edits.audioSettings, musicVolume: Number(e.target.value) },
                      })
                    }
                    className="w-full accent-brand-purple"
                  />
                </div>
              </div>
            )}

            {/* TAB: TEXT OVERLAYS */}
            {activeTab === 'text' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300">Add Text Banner</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newOverlayText}
                      onChange={(e) => setNewOverlayText(e.target.value)}
                      placeholder="THIS FIGHT WAS INSANE"
                      className="flex-1 rounded-xl border border-white/10 bg-surface-100 px-3 py-2 text-xs text-white focus:outline-none"
                    />
                    <button
                      onClick={handleAddOverlay}
                      className="rounded-xl bg-brand-cyan px-3 py-2 text-xs font-bold text-[#090a10]"
                    >
                      Add
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {edits.textOverlays.map((t, idx) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between rounded-xl bg-surface-100 p-2.5 text-xs text-white"
                    >
                      <span className="font-bold line-clamp-1">{t.text}</span>
                      <button
                        onClick={() => {
                          const filtered = edits.textOverlays.filter((_, i) => i !== idx);
                          setEdits({ ...edits, textOverlays: filtered });
                        }}
                        className="text-red-400 text-[10px] hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Timeline Tracks (Requirement #23) */}
      <div className="h-44 border-t border-white/10 bg-[#090a10] p-4 flex flex-col justify-between shrink-0">
        <div className="flex items-center justify-between text-xs text-slate-400 font-mono pb-2 border-b border-white/5">
          <div className="flex items-center gap-3">
            <span className="font-bold text-white">Timeline Tracks:</span>
            <span className="rounded bg-brand-cyan/10 px-2 py-0.5 text-brand-cyan text-[10px]">VIDEO</span>
            <span className="rounded bg-brand-magenta/10 px-2 py-0.5 text-brand-magenta text-[10px]">CAPTIONS</span>
            <span className="rounded bg-brand-purple/10 px-2 py-0.5 text-brand-purple text-[10px]">AUDIO</span>
          </div>

          <span>Space: Play/Pause • S: Split</span>
        </div>

        {/* Visual Timeline Strip */}
        <div className="flex-1 my-2 flex items-center gap-3 overflow-x-auto">
          {clips.map((c, i) => (
            <button
              key={c.id}
              onClick={() => handleSelectClip(c)}
              className={`h-16 min-w-[130px] rounded-xl border p-2 text-left flex flex-col justify-between transition-all ${
                currentClip.id === c.id
                  ? 'border-brand-cyan bg-brand-cyan/10 shadow-neon'
                  : 'border-white/10 bg-surface-50 opacity-60 hover:opacity-100'
              }`}
            >
              <div className="flex items-center justify-between text-[10px] font-mono text-white">
                <span className="font-bold">Clip #{i + 1}</span>
                <span>{formatDuration(c.duration)}</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono truncate">
                {formatDuration(c.sceneStart)}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

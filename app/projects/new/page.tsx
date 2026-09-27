'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  UploadCloud,
  Link as LinkIcon,
  Play,
  Film,
  CheckCircle2,
  Sliders,
  Sparkles,
  Swords,
  Flame,
  MessageSquareQuote,
  HeartHandshake,
  Layers,
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { CONTENT_PRESETS } from '@/lib/config/presets';
import { PresetKey, VideoMetadata } from '@/types';
import { formatBytes, formatDuration } from '@/lib/utils';

export default function NewProjectPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Wizard Step: 1 = Source, 2 = Settings
  const [step, setStep] = useState<1 | 2>(1);
  const [sourceTab, setSourceTab] = useState<'upload' | 'url' | 'demo'>('upload');

  // Project Configuration
  const [projectName, setProjectName] = useState('My Anime Action Project');
  const [preset, setPreset] = useState<PresetKey>('animeAction');
  const [targetDuration, setTargetDuration] = useState<number>(30);
  const [numberOfClips, setNumberOfClips] = useState<number | 'auto'>('auto');
  const [resolution, setResolution] = useState<'1080x1920' | '720x1280'>('1080x1920');
  const [actionIntensity, setActionIntensity] = useState<number>(85);
  const [sceneDiversity, setSceneDiversity] = useState<number>(70);
  const [prioritizeHook, setPrioritizeHook] = useState<boolean>(true);

  // Video State
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [urlMessage, setUrlMessage] = useState<{ type: 'success' | 'warning' | 'error'; text: string } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [videoMetadata, setVideoMetadata] = useState<VideoMetadata | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);

  // Step 1A: Select Sample Demo Video
  const handleSelectDemo = async () => {
    setIsUploading(true);
    try {
      const res = await fetch('/api/demo/create', { method: 'POST' });
      const data = await res.json();
      if (data.project) {
        setProjectId(data.project.id);
        setProjectName(data.project.name);
        setVideoMetadata(data.metadata);
        setStep(2);
      }
    } catch {
      alert('Failed to initialize demo video');
    } finally {
      setIsUploading(false);
    }
  };

  // Step 1B: Upload Video File
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFile(file);
    setIsUploading(true);
    setUploadProgress(20);

    try {
      // 1. Create project
      const projRes = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: file.name.replace(/\.[^/.]+$/, ''),
          sourceType: 'upload',
        }),
      });
      const projData = await projRes.json();
      const currentProjId = projData.project.id;
      setProjectId(currentProjId);
      setProjectName(projData.project.name);

      setUploadProgress(50);

      // 2. Upload video
      const formData = new FormData();
      formData.append('video', file);

      const uploadRes = await fetch(`/api/projects/${currentProjId}/upload`, {
        method: 'POST',
        body: formData,
      });

      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) {
        throw new Error(uploadData.error || 'Upload failed');
      }

      setUploadProgress(100);
      setVideoMetadata(uploadData.metadata);
      setStep(2);
    } catch (err: unknown) {
      alert(`Upload error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsUploading(false);
    }
  };

  // Step 1C: Check URL
  const handleUrlSubmit = async () => {
    if (!videoUrl) return;
    setIsUploading(true);
    setUrlMessage(null);

    try {
      // Create project
      const projRes = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Imported Web Video',
          sourceType: 'url',
          sourceUrl: videoUrl,
        }),
      });
      const projData = await projRes.json();
      const currentProjId = projData.project.id;
      setProjectId(currentProjId);

      // Import URL
      const importRes = await fetch(`/api/projects/${currentProjId}/import-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: videoUrl }),
      });

      const importData = await importRes.json();

      if (!importRes.ok) {
        setUrlMessage({
          type: importData.status === 'unsupported' ? 'warning' : 'error',
          text: importData.message || importData.error || 'Cannot import this URL.',
        });
        return;
      }

      setVideoMetadata(importData.metadata);
      setStep(2);
    } catch (err: unknown) {
      setUrlMessage({
        type: 'error',
        text: `Import failed: ${err instanceof Error ? err.message : String(err)}`,
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Launch Analysis
  const handleStartAnalysis = async () => {
    if (!projectId) return;

    try {
      await fetch(`/api/projects/${projectId}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: projectName,
          preset,
          targetDuration,
          numberOfClips,
          resolution,
          actionIntensity,
          sceneDiversity,
          prioritizeHook,
        }),
      });

      router.push(`/projects/${projectId}`);
    } catch {
      alert('Failed to trigger video analysis');
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Wizard Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-brand-cyan/30 bg-brand-cyan/10 px-3 py-1 text-xs text-brand-cyan">
          <Sparkles className="h-3.5 w-3.5" />
          Autonomous Short-Form Video Generator
        </div>
        <h1 className="font-display text-3xl font-extrabold text-white">
          Create New Project
        </h1>
        <p className="text-xs text-slate-400">
          Step {step} of 2 — {step === 1 ? 'Select Media Source' : 'Short Generation Settings'}
        </p>
      </div>

      {/* STEP 1: SOURCE SELECTION */}
      {step === 1 && (
        <div className="space-y-6">
          {/* Source Tabs */}
          <div className="flex rounded-xl border border-white/10 bg-surface-50 p-1 max-w-md mx-auto">
            <button
              onClick={() => setSourceTab('upload')}
              className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold transition-all ${
                sourceTab === 'upload'
                  ? 'bg-brand-cyan text-[#090a10] shadow-neon'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UploadCloud className="h-4 w-4" />
              Upload File
            </button>
            <button
              onClick={() => setSourceTab('url')}
              className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold transition-all ${
                sourceTab === 'url'
                  ? 'bg-brand-cyan text-[#090a10] shadow-neon'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LinkIcon className="h-4 w-4" />
              Paste URL
            </button>
            <button
              onClick={() => setSourceTab('demo')}
              className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold transition-all ${
                sourceTab === 'demo'
                  ? 'bg-brand-cyan text-[#090a10] shadow-neon'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Play className="h-4 w-4" />
              Test Demo
            </button>
          </div>

          {/* TAB 1: UPLOAD */}
          {sourceTab === 'upload' && (
            <div className="rounded-2xl border border-dashed border-white/20 bg-surface-50/70 p-12 text-center hover:border-brand-cyan/50 transition-colors">
              <input
                ref={fileInputRef}
                type="file"
                accept="video/mp4,video/quicktime,video/webm,video/x-matroska"
                onChange={handleFileChange}
                className="hidden"
              />

              {isUploading ? (
                <div className="space-y-4 max-w-xs mx-auto">
                  <Loader2 className="h-10 w-10 animate-spin text-brand-cyan mx-auto" />
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-white">Inspecting & Uploading Media...</p>
                    <p className="text-xs text-slate-400">FFprobe extracting stream codecs & FPS</p>
                  </div>
                  <div className="w-full bg-surface-200 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-brand-cyan h-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  <div className="h-16 w-16 rounded-2xl bg-brand-cyan/10 border border-brand-cyan/20 flex items-center justify-center text-brand-cyan mx-auto">
                    <UploadCloud className="h-8 w-8" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-base font-bold text-white">
                      Drop video file here, or <span className="text-brand-cyan underline">browse</span>
                    </p>
                    <p className="text-xs text-slate-400">
                      Supports MP4, MOV, MKV, WEBM (up to 500 MB)
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: URL */}
          {sourceTab === 'url' && (
            <div className="rounded-2xl border border-white/10 bg-surface-50 p-8 space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Supported Video URL</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="https://example.com/footage.mp4"
                    className="flex-1 rounded-xl border border-white/10 bg-surface-100 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-brand-cyan focus:outline-none"
                  />
                  <button
                    onClick={handleUrlSubmit}
                    disabled={isUploading || !videoUrl}
                    className="rounded-xl bg-brand-cyan px-5 py-2.5 text-xs font-bold text-[#090a10] hover:bg-brand-cyan/90 disabled:opacity-50"
                  >
                    {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Inspect URL'}
                  </button>
                </div>
              </div>

              {/* URL Ingestion Rules */}
              <div className="rounded-xl border border-white/5 bg-surface-100 p-4 text-xs space-y-2">
                <div className="flex items-center gap-2 text-white font-semibold">
                  <Info className="h-4 w-4 text-brand-cyan" />
                  URL Ingestion Support Matrix
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-400 text-[11px]">
                  <div>✓ Direct video URLs (.mp4, .webm, .mov)</div>
                  <div>✓ Cloud storage direct stream URLs</div>
                  <div className="text-amber-400">✕ DRM / Paywalled streams</div>
                  <div className="text-amber-400">✕ Private platform videos (requires upload)</div>
                </div>
              </div>

              {urlMessage && (
                <div
                  className={`rounded-xl p-4 text-xs flex items-start gap-2.5 ${
                    urlMessage.type === 'warning'
                      ? 'border border-amber-500/30 bg-amber-500/10 text-amber-300'
                      : 'border border-red-500/30 bg-red-500/10 text-red-300'
                  }`}
                >
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{urlMessage.text}</span>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: DEMO VIDEO */}
          {sourceTab === 'demo' && (
            <div className="rounded-2xl border border-brand-cyan/30 bg-gradient-to-br from-surface-50 to-surface-100 p-8 space-y-5">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="w-full sm:w-48 aspect-video rounded-xl overflow-hidden bg-black border border-white/10 shrink-0">
                  <video
                    src="/api/media/samples/anime_action_demo.mp4"
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="space-y-2 flex-1">
                  <span className="rounded-full bg-brand-cyan/10 border border-brand-cyan/30 px-2.5 py-0.5 text-[10px] font-bold text-brand-cyan">
                    PRE-BUNDLED TEST ASSET
                  </span>
                  <h3 className="text-lg font-bold text-white">
                    Anime Action Shonen Demo [Sample 1080p]
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    A bundled, verified 35-second 1080p 24FPS sample clip featuring high-motion visual sequences and soundtrack frequencies. Instant start without file uploading.
                  </p>
                </div>
              </div>

              <button
                onClick={handleSelectDemo}
                disabled={isUploading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-cyan to-brand-purple py-3 text-xs font-bold text-[#090a10] shadow-neon hover:opacity-95"
              >
                {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4 fill-current" />}
                Use This Demo Video & Configure Short Settings
              </button>
            </div>
          )}
        </div>
      )}

      {/* STEP 2: SETTINGS & LAUNCH */}
      {step === 2 && videoMetadata && (
        <div className="space-y-8">
          {/* Source Video FFprobe Validation Card (Requirement #10) */}
          <div className="rounded-2xl border border-white/10 bg-surface-50 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <Film className="h-4 w-4 text-brand-cyan" />
                <h3 className="font-display text-sm font-bold text-white">
                  Source Video Inspection (FFprobe)
                </h3>
              </div>
              <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Valid Stream
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
              <div className="rounded-xl bg-surface-100 p-3">
                <span className="text-slate-500 text-[10px] block">RESOLUTION</span>
                <span className="text-white font-bold">{videoMetadata.width} × {videoMetadata.height}</span>
              </div>
              <div className="rounded-xl bg-surface-100 p-3">
                <span className="text-slate-500 text-[10px] block">FPS</span>
                <span className="text-white font-bold">{videoMetadata.fps} FPS</span>
              </div>
              <div className="rounded-xl bg-surface-100 p-3">
                <span className="text-slate-500 text-[10px] block">DURATION</span>
                <span className="text-white font-bold">{formatDuration(videoMetadata.duration)}</span>
              </div>
              <div className="rounded-xl bg-surface-100 p-3">
                <span className="text-slate-500 text-[10px] block">CODEC</span>
                <span className="text-white font-bold">{videoMetadata.codec.toUpperCase()} / {videoMetadata.audioCodec || 'AAC'}</span>
              </div>
            </div>
          </div>

          {/* Project Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Project Title</label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-surface-50 px-4 py-2.5 text-sm text-white focus:border-brand-cyan focus:outline-none"
            />
          </div>

          {/* Content Presets (Requirement #12) */}
          <div className="space-y-3">
            <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span>Analysis Preset Profile</span>
              <span className="text-[11px] text-slate-400 font-normal">Controls scoring weights & cut priorities</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {(Object.keys(CONTENT_PRESETS) as PresetKey[]).map((key) => {
                const p = CONTENT_PRESETS[key];
                const isSelected = preset === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setPreset(key);
                      setTargetDuration(p.defaultDuration);
                    }}
                    className={`rounded-2xl border p-4 text-left space-y-2 transition-all ${
                      isSelected
                        ? 'border-brand-cyan bg-brand-cyan/10 shadow-neon'
                        : 'border-white/10 bg-surface-50 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{p.name}</span>
                      {isSelected && <CheckCircle2 className="h-4 w-4 text-brand-cyan" />}
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2">
                      {p.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Settings Grid: Duration, Number of Clips, Aspect Ratio */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {/* Target Clip Duration */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">Clip Duration</label>
              <select
                value={targetDuration}
                onChange={(e) => setTargetDuration(Number(e.target.value))}
                className="w-full rounded-xl border border-white/10 bg-surface-50 px-3 py-2.5 text-xs text-white focus:border-brand-cyan focus:outline-none"
              >
                <option value={10}>10 Seconds (Fast Paced)</option>
                <option value={15}>15 Seconds (AMV/Impact)</option>
                <option value={20}>20 Seconds</option>
                <option value={30}>30 Seconds (Default Shorts)</option>
                <option value={45}>45 Seconds</option>
                <option value={60}>60 Seconds (Longer Scene)</option>
              </select>
            </div>

            {/* Number of Clips */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">Number of Clips</label>
              <select
                value={numberOfClips}
                onChange={(e) => setNumberOfClips(e.target.value === 'auto' ? 'auto' : Number(e.target.value))}
                className="w-full rounded-xl border border-white/10 bg-surface-50 px-3 py-2.5 text-xs text-white focus:border-brand-cyan focus:outline-none"
              >
                <option value="auto">Automatic (Best Candidates)</option>
                <option value={1}>1 Best Clip</option>
                <option value={3}>3 Clips</option>
                <option value={5}>5 Clips</option>
                <option value={10}>10 Clips</option>
              </select>
            </div>

            {/* Resolution */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">Output Format</label>
              <select
                value={resolution}
                onChange={(e) => setResolution(e.target.value as '1080x1920' | '720x1280')}
                className="w-full rounded-xl border border-white/10 bg-surface-50 px-3 py-2.5 text-xs text-white focus:border-brand-cyan focus:outline-none"
              >
                <option value="1080x1920">9:16 Vertical (1080 × 1920 Full HD)</option>
                <option value="720x1280">9:16 Vertical (720 × 1280 HD)</option>
              </select>
            </div>
          </div>

          {/* Action Intensity & Scene Diversity Sliders (Requirement #13) */}
          <div className="rounded-2xl border border-white/10 bg-surface-50 p-6 space-y-6">
            <h4 className="font-display text-xs uppercase tracking-wider text-slate-300 font-bold flex items-center gap-2">
              <Sliders className="h-4 w-4 text-brand-cyan" />
              Advanced Selection Tuning
            </h4>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-200">Action Intensity Threshold</span>
                <span className="font-mono text-brand-cyan font-bold">{actionIntensity}%</span>
              </div>
              <input
                type="range"
                min="20"
                max="100"
                value={actionIntensity}
                onChange={(e) => setActionIntensity(Number(e.target.value))}
                className="w-full accent-brand-cyan"
              />
              <span className="text-[11px] text-slate-400 block">
                Higher values prioritize fast combat movements, sword strikes, and frame-to-frame shifts.
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-200">Scene Diversity Index</span>
                <span className="font-mono text-brand-purple font-bold">{sceneDiversity}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                value={sceneDiversity}
                onChange={(e) => setSceneDiversity(Number(e.target.value))}
                className="w-full accent-brand-purple"
              />
              <span className="text-[11px] text-slate-400 block">
                Prevents selecting repetitive adjacent scenes from the same battle sequence.
              </span>
            </div>

            {/* Opening hook toggle */}
            <div className="flex items-center justify-between pt-2 border-t border-white/5">
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-white block">Opening Hook Priority</span>
                <span className="text-[11px] text-slate-400">
                  Ensures clips begin within 1-3 seconds of instant action or voice punch.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setPrioritizeHook(!prioritizeHook)}
                className={`h-6 w-11 rounded-full transition-colors relative p-0.5 ${
                  prioritizeHook ? 'bg-brand-cyan' : 'bg-surface-200'
                }`}
              >
                <div
                  className={`h-5 w-5 rounded-full bg-[#090a10] transition-transform ${
                    prioritizeHook ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4">
            <button
              onClick={() => setStep(1)}
              className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-surface-100 px-5 py-3 text-xs font-semibold text-slate-300 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Change Source
            </button>

            <button
              onClick={handleStartAnalysis}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-cyan via-brand-purple to-brand-magenta px-8 py-3.5 text-sm font-bold text-[#090a10] shadow-neon hover:opacity-95 transition-opacity"
            >
              <Swords className="h-4 w-4" />
              Start Media Analysis
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

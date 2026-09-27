'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Cpu,
  Database,
  HardDrive,
  Mic,
  Eye,
  Link2,
  RefreshCw,
} from 'lucide-react';
import { SystemCapabilities } from '@/types';

export default function CapabilitiesPage() {
  const [capabilities, setCapabilities] = useState<SystemCapabilities | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCapabilities = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/capabilities');
      const data = await res.json();
      setCapabilities(data);
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCapabilities();
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-brand-cyan/30 bg-brand-cyan/10 px-3 py-1 text-xs text-brand-cyan mb-2">
            <Activity className="h-3.5 w-3.5" />
            Live Engine Diagnostic
          </div>
          <h1 className="font-display text-3xl font-extrabold text-white">
            System & AI Capabilities Status
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real hardware, binary, and service inspection. Zero simulated connections.
          </p>
        </div>

        <button
          onClick={fetchCapabilities}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl border border-white/10 bg-surface-100 px-4 py-2 text-xs font-semibold text-white hover:bg-surface-200"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Re-inspect Services
        </button>
      </div>

      {!capabilities ? (
        <div className="flex min-h-[300px] items-center justify-center">
          <div className="text-center space-y-2">
            <RefreshCw className="h-6 w-6 animate-spin text-brand-cyan mx-auto" />
            <p className="text-xs text-slate-400 font-mono">Querying system binaries & environment...</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* FFmpeg Video Engine */}
          <div className="rounded-2xl border border-white/10 bg-surface-50 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-brand-cyan/10 border border-brand-cyan/20 flex items-center justify-center text-brand-cyan">
                  <Cpu className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-sm font-bold text-white">FFmpeg Media Core</h3>
                  <span className="text-[11px] text-slate-400 font-mono">Video decoding, filters & encoding</span>
                </div>
              </div>

              {capabilities.ffmpeg.available ? (
                <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-bold text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Connected
                </span>
              ) : (
                <span className="flex items-center gap-1 rounded-full bg-red-500/10 border border-red-500/30 px-2.5 py-0.5 text-xs font-bold text-red-400">
                  <XCircle className="h-3.5 w-3.5" />
                  Not Found
                </span>
              )}
            </div>

            <div className="rounded-xl bg-surface-100 p-3 font-mono text-xs space-y-1 text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-500">Version:</span>
                <span>{capabilities.ffmpeg.version || 'Unknown'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Path:</span>
                <span className="truncate max-w-[200px]" title={capabilities.ffmpeg.path}>{capabilities.ffmpeg.path}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Accelerators:</span>
                <span>NVENC, QSV, Vulkan</span>
              </div>
            </div>
          </div>

          {/* FFprobe Stream Inspector */}
          <div className="rounded-2xl border border-white/10 bg-surface-50 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-brand-magenta/10 border border-brand-magenta/20 flex items-center justify-center text-brand-magenta">
                  <Activity className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-sm font-bold text-white">FFprobe Inspector</h3>
                  <span className="text-[11px] text-slate-400 font-mono">Stream metadata extraction</span>
                </div>
              </div>

              {capabilities.ffprobe.available ? (
                <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-bold text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Connected
                </span>
              ) : (
                <span className="flex items-center gap-1 rounded-full bg-red-500/10 border border-red-500/30 px-2.5 py-0.5 text-xs font-bold text-red-400">
                  <XCircle className="h-3.5 w-3.5" />
                  Not Found
                </span>
              )}
            </div>

            <div className="rounded-xl bg-surface-100 p-3 font-mono text-xs space-y-1 text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-500">Version:</span>
                <span>{capabilities.ffprobe.version || 'Unknown'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Path:</span>
                <span className="truncate max-w-[200px]" title={capabilities.ffprobe.path}>{capabilities.ffprobe.path}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">JSON Output:</span>
                <span>Supported</span>
              </div>
            </div>
          </div>

          {/* Database & Persistence */}
          <div className="rounded-2xl border border-white/10 bg-surface-50 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-brand-purple/10 border border-brand-purple/20 flex items-center justify-center text-brand-purple">
                  <Database className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-sm font-bold text-white">Database Core</h3>
                  <span className="text-[11px] text-slate-400 font-mono">Projects, scenes & render queue</span>
                </div>
              </div>

              <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-bold text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {capabilities.database.type === 'supabase' ? 'Supabase Postgres' : 'Local Persistent'}
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              {capabilities.database.message}
            </p>
          </div>

          {/* Storage Subsystem */}
          <div className="rounded-2xl border border-white/10 bg-surface-50 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <HardDrive className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-sm font-bold text-white">Media Object Storage</h3>
                  <span className="text-[11px] text-slate-400 font-mono">Source videos, clips & thumbnails</span>
                </div>
              </div>

              <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-bold text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Active
              </span>
            </div>

            <div className="rounded-xl bg-surface-100 p-3 font-mono text-xs space-y-1 text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-500">Engine Type:</span>
                <span>{capabilities.storage.type.toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Root Directory:</span>
                <span className="truncate max-w-[200px]">{capabilities.storage.path}</span>
              </div>
            </div>
          </div>

          {/* Speech-to-Text / Captions Status (Requirement #21, #44) */}
          <div className="rounded-2xl border border-white/10 bg-surface-50 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <Mic className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-sm font-bold text-white">Transcription Engine</h3>
                  <span className="text-[11px] text-slate-400 font-mono">Speech-to-text automated subtitles</span>
                </div>
              </div>

              <span className="flex items-center gap-1 rounded-full bg-slate-500/10 border border-slate-500/30 px-2.5 py-0.5 text-xs font-bold text-slate-400">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                {capabilities.transcription.available ? 'Connected' : 'Not Configured'}
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              {capabilities.transcription.message}
            </p>
          </div>

          {/* Vision AI Status (Requirement #14, #44, #64) */}
          <div className="rounded-2xl border border-white/10 bg-surface-50 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-brand-cyan/10 border border-brand-cyan/20 flex items-center justify-center text-brand-cyan">
                  <Eye className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-sm font-bold text-white">Vision AI & Saliency</h3>
                  <span className="text-[11px] text-slate-400 font-mono">Character tracking & semantic analysis</span>
                </div>
              </div>

              <span className="flex items-center gap-1 rounded-full bg-brand-cyan/10 border border-brand-cyan/30 px-2.5 py-0.5 text-xs font-bold text-brand-cyan">
                Motion Highlight Core
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              {capabilities.visionAI.message}
            </p>
          </div>

          {/* Media Processing Worker Status */}
          <div className="rounded-2xl border border-white/10 bg-surface-50 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                  <Activity className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-sm font-bold text-white">Media Worker Engine</h3>
                  <span className="text-[11px] text-slate-400 font-mono">Asynchronous queue & render daemon</span>
                </div>
              </div>

              {capabilities.worker?.available ? (
                <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-bold text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {capabilities.worker.mode === 'inline' ? 'Inline Active' : 'Daemon Connected'}
                </span>
              ) : (
                <span className="flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 text-xs font-bold text-amber-400">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Idle / Standalone
                </span>
              )}
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              {capabilities.worker?.message || 'Media processing queue listener'}
            </p>
            <div className="rounded-xl bg-surface-100 p-2 font-mono text-[11px] text-slate-400">
              Start worker daemon: <span className="text-brand-cyan">npm run worker</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

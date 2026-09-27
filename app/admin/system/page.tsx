'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Settings,
  Cpu,
  Database,
  HardDrive,
  RefreshCw,
  Server,
  Activity,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface SystemDiag {
  system: {
    platform: string;
    arch: string;
    uptimeSeconds: number;
    freeMemoryMb: number;
    totalMemoryMb: number;
    nodeVersion: string;
  };
  ffmpeg: {
    status: string;
    version?: string;
  };
  ffprobe: {
    status: string;
    version?: string;
  };
  database: {
    type: string;
    status: string;
    totalProjects: number;
    totalClips: number;
    totalJobs: number;
  };
  providers: {
    transcription: string;
    vision: string;
  };
}

export default function AdminSystemPage() {
  const [diag, setDiag] = useState<SystemDiag | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDiag = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/system');
      const data = await res.json();
      setDiag(data);
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiag();
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-brand-magenta/30 bg-brand-magenta/10 px-3 py-1 text-xs text-brand-magenta mb-2">
            <Server className="h-3.5 w-3.5" />
            Developer Diagnostics
          </div>
          <h1 className="font-display text-3xl font-extrabold text-white">System Health & Core</h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time server resource consumption, binary versions, and database metrics
          </p>
        </div>

        <button
          onClick={fetchDiag}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl border border-white/10 bg-surface-100 px-4 py-2 text-xs font-semibold text-white hover:bg-surface-200"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {!diag ? (
        <div className="flex min-h-[300px] items-center justify-center">
          <RefreshCw className="h-6 w-6 animate-spin text-brand-cyan" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Top Host Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="rounded-xl border border-white/5 bg-surface-50 p-4 font-mono">
              <span className="text-[10px] text-slate-500 uppercase block">Host Platform</span>
              <span className="text-base font-bold text-white capitalize">{diag.system.platform} ({diag.system.arch})</span>
            </div>
            <div className="rounded-xl border border-white/5 bg-surface-50 p-4 font-mono">
              <span className="text-[10px] text-slate-500 uppercase block">Node.js Runtime</span>
              <span className="text-base font-bold text-brand-cyan">{diag.system.nodeVersion}</span>
            </div>
            <div className="rounded-xl border border-white/5 bg-surface-50 p-4 font-mono">
              <span className="text-[10px] text-slate-500 uppercase block">Free RAM</span>
              <span className="text-base font-bold text-brand-magenta">
                {Math.round(diag.system.freeMemoryMb / 1024)} GB / {Math.round(diag.system.totalMemoryMb / 1024)} GB
              </span>
            </div>
            <div className="rounded-xl border border-white/5 bg-surface-50 p-4 font-mono">
              <span className="text-[10px] text-slate-500 uppercase block">Host Uptime</span>
              <span className="text-base font-bold text-emerald-400">
                {Math.floor(diag.system.uptimeSeconds / 3600)}h {Math.floor((diag.system.uptimeSeconds % 3600) / 60)}m
              </span>
            </div>
          </div>

          {/* Database & Media Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-white/10 bg-surface-50 p-6 space-y-4">
              <div className="flex items-center gap-3">
                <Database className="h-5 w-5 text-brand-purple" />
                <h3 className="font-display text-sm font-bold text-white">Database Core</h3>
              </div>

              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-400">Backend Adapter:</span>
                  <span className="text-brand-cyan font-bold">{diag.database.type}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-400">Total Projects:</span>
                  <span className="text-white">{diag.database.totalProjects}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-400">Total Generated Clips:</span>
                  <span className="text-white">{diag.database.totalClips}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Render Pipeline Jobs:</span>
                  <span className="text-white">{diag.database.totalJobs}</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-surface-50 p-6 space-y-4">
              <div className="flex items-center gap-3">
                <Cpu className="h-5 w-5 text-brand-cyan" />
                <h3 className="font-display text-sm font-bold text-white">Media Processing Worker</h3>
              </div>

              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-400">FFmpeg Status:</span>
                  <span className="text-emerald-400 font-bold">{diag.ffmpeg.status.toUpperCase()}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-400">FFprobe Status:</span>
                  <span className="text-emerald-400 font-bold">{diag.ffprobe.status.toUpperCase()}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-400">Transcription Engine:</span>
                  <span className="text-slate-300">{diag.providers.transcription}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Vision Engine:</span>
                  <span className="text-slate-300">{diag.providers.vision}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Film,
  Sparkles,
  Clock,
  Layers,
  ArrowRight,
  Trash2,
  Play,
  Loader2,
  HardDrive,
  Activity,
} from 'lucide-react';
import { Project } from '@/types';
import { formatDuration } from '@/lib/utils';

export default function DashboardPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [demoLoading, setDemoLoading] = useState(false);

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects');
      const data = await res.json();
      setProjects(data.projects || []);
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!confirm('Are you sure you want to delete this project and all its clips?')) return;
    try {
      await fetch(`/api/projects/${id}`, { method: 'DELETE' });
      fetchProjects();
    } catch {
      alert('Failed to delete project');
    }
  };

  const handleLaunchDemo = async () => {
    try {
      setDemoLoading(true);
      const res = await fetch('/api/demo/create', { method: 'POST' });
      const data = await res.json();
      if (data.project?.id) {
        router.push(`/projects/${data.project.id}`);
      }
    } catch (err: unknown) {
      alert(`Error starting demo: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setDemoLoading(false);
    }
  };

  const getStatusBadge = (status: Project['status']) => {
    switch (status) {
      case 'completed':
        return <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">Completed</span>;
      case 'analyzing':
      case 'rendering':
      case 'queued':
        return <span className="rounded-full bg-brand-cyan/10 border border-brand-cyan/30 px-2 py-0.5 text-[10px] font-semibold text-brand-cyan animate-pulse">{status.toUpperCase()}</span>;
      case 'failed':
        return <span className="rounded-full bg-red-500/10 border border-red-500/30 px-2 py-0.5 text-[10px] font-semibold text-red-400">Failed</span>;
      default:
        return <span className="rounded-full bg-slate-500/10 border border-slate-500/30 px-2 py-0.5 text-[10px] font-semibold text-slate-400">Draft</span>;
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-white">
            Editor Studio Dashboard
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage your long-form video clipping projects and vertical short exports
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleLaunchDemo}
            disabled={demoLoading}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-surface-100 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:bg-surface-200 transition-colors"
          >
            {demoLoading ? <Loader2 className="h-4 w-4 animate-spin text-brand-cyan" /> : <Play className="h-4 w-4 text-brand-cyan fill-brand-cyan" />}
            Instant Demo Clip
          </button>

          <Link
            href="/projects/new"
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-cyan to-brand-purple px-4 py-2.5 text-xs font-bold text-[#090a10] shadow-neon hover:opacity-95 transition-opacity"
          >
            <Plus className="h-4 w-4" />
            New Project
          </Link>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="rounded-2xl border border-white/10 bg-surface-50 p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Total Projects</span>
            <Film className="h-4 w-4 text-brand-cyan" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">{projects.length}</div>
          <p className="text-[11px] text-slate-400">Active clipping workflows</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-surface-50 p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Processing Engine</span>
            <Activity className="h-4 w-4 text-brand-magenta" />
          </div>
          <div className="text-sm font-bold text-emerald-400 font-mono flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
            FFmpeg 9.0.1 Ready
          </div>
          <p className="text-[11px] text-slate-400">Hardware acceleration enabled</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-surface-50 p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Storage Allocation</span>
            <HardDrive className="h-4 w-4 text-brand-purple" />
          </div>
          <div className="text-sm font-bold text-white font-mono">Dynamic Media Pool</div>
          <p className="text-[11px] text-slate-400">Local & Supabase object buckets</p>
        </div>
      </div>

      {/* Projects List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-white flex items-center gap-2">
            <Layers className="h-4 w-4 text-brand-cyan" />
            Recent Projects
          </h2>
          <span className="text-xs text-slate-400 font-mono">{projects.length} loaded</span>
        </div>

        {loading ? (
          <div className="flex min-h-[250px] items-center justify-center rounded-2xl border border-white/10 bg-surface-50">
            <Loader2 className="h-6 w-6 animate-spin text-brand-cyan" />
          </div>
        ) : projects.length === 0 ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-surface-50/50 p-8 text-center space-y-4">
            <div className="h-12 w-12 rounded-2xl bg-brand-cyan/10 border border-brand-cyan/20 flex items-center justify-center text-brand-cyan">
              <Film className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">No projects created yet</h3>
              <p className="text-xs text-slate-400 max-w-sm">
                Upload your first long-form video or launch our instant anime demo to see the AI highlight pipeline in action.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleLaunchDemo}
                disabled={demoLoading}
                className="rounded-xl border border-white/10 bg-surface-100 px-4 py-2 text-xs font-semibold text-white hover:bg-surface-200"
              >
                Launch Demo Project
              </button>
              <Link
                href="/projects/new"
                className="rounded-xl bg-brand-cyan px-4 py-2 text-xs font-bold text-[#090a10] hover:bg-brand-cyan/90"
              >
                Upload Video
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((proj) => (
              <Link
                key={proj.id}
                href={`/projects/${proj.id}`}
                className="group relative rounded-2xl border border-white/10 bg-surface-50 p-5 space-y-4 hover:border-brand-cyan/40 hover:shadow-neon transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono uppercase text-brand-cyan font-bold tracking-wider">
                      {proj.preset}
                    </span>
                    {getStatusBadge(proj.status)}
                  </div>

                  <h3 className="text-base font-bold text-white group-hover:text-brand-cyan transition-colors line-clamp-1">
                    {proj.name}
                  </h3>

                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-400 font-mono">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-slate-500" />
                      <span>{proj.duration > 0 ? formatDuration(proj.duration) : 'Probing...'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-brand-magenta" />
                      <span>{proj.aspectRatio} Vertical</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-white/5 pt-3 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 font-mono">
                    {new Date(proj.createdAt).toLocaleDateString()}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => handleDelete(proj.id, e)}
                      title="Delete project"
                      className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                    <span className="text-xs font-semibold text-brand-cyan flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                      Open <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

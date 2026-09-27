'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Swords, Film, Activity, Settings, UserCheck, LogOut, Plus, Sparkles } from 'lucide-react';
import { useAuth } from '@/lib/auth/context';

export function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [ffmpegStatus, setFfmpegStatus] = useState<'checking' | 'ready' | 'offline'>('checking');

  useEffect(() => {
    fetch('/api/capabilities')
      .then((res) => res.json())
      .then((data) => {
        if (data.ffmpeg?.available) {
          setFfmpegStatus('ready');
        } else {
          setFfmpegStatus('offline');
        }
      })
      .catch(() => setFfmpegStatus('offline'));
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#090a10]/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <div className="flex items-center gap-8">
          <Link href="/" className="group flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-magenta to-brand-cyan p-0.5 shadow-neon transition-transform group-hover:scale-105">
              <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-[#0d0e17]">
                <Swords className="h-5 w-5 text-brand-cyan transition-transform group-hover:rotate-12" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-display text-lg font-bold tracking-wider text-white">
                ANIMECLIPS<span className="text-brand-cyan">.AI</span>
              </span>
              <span className="text-[10px] uppercase tracking-widest text-slate-400">
                Action Highlights Engine
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="/dashboard"
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                pathname === '/dashboard'
                  ? 'bg-white/10 text-brand-cyan'
                  : 'text-slate-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Film className="h-4 w-4" />
              Dashboard
            </Link>
            <Link
              href="/projects/new"
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                pathname === '/projects/new'
                  ? 'bg-white/10 text-brand-cyan'
                  : 'text-slate-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Plus className="h-4 w-4" />
              New Project
            </Link>
            <Link
              href="/settings/capabilities"
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                pathname.startsWith('/settings')
                  ? 'bg-white/10 text-brand-cyan'
                  : 'text-slate-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Activity className="h-4 w-4" />
              Capabilities
            </Link>
            <Link
              href="/admin/system"
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                pathname === '/admin/system'
                  ? 'bg-white/10 text-brand-cyan'
                  : 'text-slate-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Settings className="h-4 w-4" />
              System
            </Link>
          </nav>
        </div>

        {/* Right Section: Engine status & User Profile */}
        <div className="flex items-center gap-3">
          {/* FFmpeg Status Pill */}
          <div className="hidden sm:flex items-center gap-2 rounded-full border border-white/10 bg-surface-50/80 px-2.5 py-1 text-xs">
            <span
              className={`h-2 w-2 rounded-full ${
                ffmpegStatus === 'ready'
                  ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]'
                  : ffmpegStatus === 'offline'
                  ? 'bg-red-400'
                  : 'bg-yellow-400 animate-pulse'
              }`}
            />
            <span className="font-mono text-[11px] text-slate-300">
              FFmpeg {ffmpegStatus === 'ready' ? 'Active' : ffmpegStatus}
            </span>
          </div>

          {user ? (
            <div className="flex items-center gap-2">
              <Link
                href="/projects/new"
                className="hidden sm:inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-brand-cyan to-brand-purple px-3.5 py-1.5 text-xs font-semibold text-[#090a10] shadow-neon hover:opacity-95"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Create Clip
              </Link>
              <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-surface-100 px-2.5 py-1 text-xs text-slate-200">
                <UserCheck className="h-3.5 w-3.5 text-brand-cyan" />
                <span className="max-w-[100px] truncate">{user.name || user.email}</span>
              </div>
              <button
                onClick={() => logout()}
                title="Log out"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white"
              >
                Log In
              </Link>
              <Link
                href="/signup"
                className="rounded-lg bg-brand-cyan px-3 py-1.5 text-xs font-semibold text-[#090a10] hover:bg-brand-cyan/90"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Settings, Save, ShieldCheck, Activity } from 'lucide-react';

export default function SettingsPage() {
  const [aspectRatio, setAspectRatio] = useState('9:16');
  const [duration, setDuration] = useState('30');
  const [captionStyle, setCaptionStyle] = useState('anime');
  const [hardwareAccel, setHardwareAccel] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex items-center justify-between border-b border-white/10 pb-6">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-white">Application Settings</h1>
          <p className="text-xs text-slate-400 mt-1">
            Configure default clipping presets, rendering behavior, and integrations
          </p>
        </div>

        <Link
          href="/settings/capabilities"
          className="flex items-center gap-1.5 rounded-xl border border-brand-cyan/30 bg-brand-cyan/10 px-3.5 py-2 text-xs font-semibold text-brand-cyan"
        >
          <Activity className="h-4 w-4" />
          View Live Capabilities
        </Link>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* General Preferences */}
        <div className="rounded-2xl border border-white/10 bg-surface-50 p-6 space-y-4">
          <h2 className="font-display text-sm font-bold text-white uppercase tracking-wider">
            General Defaults
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Default Aspect Ratio</label>
              <select
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-surface-100 px-3 py-2.5 text-xs text-white"
              >
                <option value="9:16">9:16 Vertical (Shorts, Reels, TikTok)</option>
                <option value="16:9">16:9 Landscape</option>
                <option value="1:1">1:1 Square</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Default Clip Duration</label>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-surface-100 px-3 py-2.5 text-xs text-white"
              >
                <option value="15">15 Seconds</option>
                <option value="30">30 Seconds</option>
                <option value="45">45 Seconds</option>
                <option value="60">60 Seconds</option>
              </select>
            </div>
          </div>
        </div>

        {/* Processing & Hardware Acceleration */}
        <div className="rounded-2xl border border-white/10 bg-surface-50 p-6 space-y-4">
          <h2 className="font-display text-sm font-bold text-white uppercase tracking-wider">
            Processing & Render Performance
          </h2>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-semibold text-white block">FFmpeg Hardware Acceleration</span>
              <span className="text-[11px] text-slate-400">
                Leverages NVIDIA NVENC / Intel QSV / AMD AMF when available on the host machine.
              </span>
            </div>
            <input
              type="checkbox"
              checked={hardwareAccel}
              onChange={(e) => setHardwareAccel(e.target.checked)}
              className="h-4 w-4 accent-brand-cyan"
            />
          </div>
        </div>

        {/* Caption Style Preset */}
        <div className="rounded-2xl border border-white/10 bg-surface-50 p-6 space-y-4">
          <h2 className="font-display text-sm font-bold text-white uppercase tracking-wider">
            Default Caption Aesthetic
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { id: 'anime', name: 'Anime Style', desc: 'Bold Impact text with black outline' },
              { id: 'clean', name: 'Clean Modern', desc: 'Sleek white text with subtle shadow' },
              { id: 'hype', name: 'Hype Pop', desc: 'High visibility energetic text' },
              { id: 'minimal', name: 'Minimal', desc: 'Compact centered subtitles' },
            ].map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setCaptionStyle(st.id)}
                className={`rounded-xl border p-3 text-left space-y-1 ${
                  captionStyle === st.id
                    ? 'border-brand-cyan bg-brand-cyan/10'
                    : 'border-white/10 bg-surface-100'
                }`}
              >
                <span className="text-xs font-bold text-white block">{st.name}</span>
                <span className="text-[10px] text-slate-400">{st.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Security notice */}
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-xs text-slate-300 flex items-center gap-3">
          <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0" />
          <span>
            API keys and credentials are securely maintained in server environment variables (<code>.env.local</code>) and are never exposed to the client.
          </span>
        </div>

        <button
          type="submit"
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-cyan to-brand-purple px-6 py-2.5 text-xs font-bold text-[#090a10] shadow-neon hover:opacity-95"
        >
          <Save className="h-4 w-4" />
          {saved ? 'Saved!' : 'Save Settings'}
        </button>
      </form>
    </div>
  );
}
